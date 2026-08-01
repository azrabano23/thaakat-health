'use client';

import { useState } from 'react';
import { SEEDED_RECORD, matchClusters, type Finding, type ClusterMatch } from '@/lib/clusters';

type Turn = { role: 'patient' | 'noor'; text: string };

// Scripted so the repo is instantly demoable. The teammate wires the REAL Deepgram Voice Agent
// (see docs/BUILD_KIT.md) — it calls the same /api routes and the same lib/clusters engine.
export default function Intake() {
  const [record, setRecord] = useState<Finding[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [match, setMatch] = useState<ClusterMatch | null>(null);
  const [coverage, setCoverage] = useState<any | null>(null);
  const [committed, setCommitted] = useState<any | null>(null);
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'interview' | 'reading' | 'assembled'>('idle');
  const [mossMs, setMossMs] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const say = (role: Turn['role'], text: string) => setTurns((t) => [...t, { role, text }]);

  async function simulate() {
    setRunning(true);
    setRecord([]); setTurns([]); setMatch(null); setCoverage(null); setCommitted(null);
    const rec: Finding[] = [];
    const push = (f: Finding) => { rec.push(f); setRecord([...rec]); };

    // 1) connect records
    setPhase('connecting');
    say('noor', "Hi, I'm Noor. I've pulled your records together across your doctors — take your time and tell me what's been going on.");
    for (const f of SEEDED_RECORD) { await wait(500); push(f); }

    // 2) chart-aware question (Moss retrieves over the whole record <10ms)
    setPhase('interview');
    await wait(500);
    const r = await fetch('/api/moss/query', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'cyclical pelvic pain elevated CA-125 unremarkable ultrasound', topK: 4 }),
    }).then((x) => x.json()).catch(() => ({}));
    setMossMs(r.ms ?? null);
    say('noor', "I can see a CA-125 from 2024 that came back high and was never followed up, plus a pelvic ultrasound read as normal. When is the pain at its worst — and does it ever hurt during sex?");

    await wait(700);
    say('patient', "It's worst right before my period. And yeah… it really hurts during sex. Five doctors told me it was normal.");
    push({
      id: 'pt-today', label: 'Pain during sex + cyclical (today)',
      detail: 'Patient-reported: deep dyspareunia, pain worst premenstrually, misses work. Dismissed by prior clinicians.',
      specialty: 'Patient (today)', date: '2025-08', source: 'Noor voice intake',
      tags: ['dyspareunia', 'pelvic-pain', 'severity'],
    });

    // 3) the imaging moment — re-read the under-read MRI (THE MOAT)
    setPhase('reading');
    await wait(700);
    say('noor', 'You mentioned an MRI they called normal. Let me look at it myself.');
    const img = await fetch('/api/imaging/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studyId: 'demo-pelvic-mri-1' }),
    }).then((x) => x.json()).catch(() => null);
    await wait(500);
    if (img?.findings?.length) {
      for (const f of img.findings) say('noor', f.narration);
      push({
        id: 'radiomics', label: 'MRI re-read: deep infiltrating endometriosis',
        detail: img.summary, specialty: 'Noor radiomics', date: '2024-06',
        source: 'Radiomics re-read of 2024 pelvic MRI', tags: ['die-imaging'], fromImaging: true,
      });
    }

    // 4) assemble the cluster
    const matches = matchClusters(rec);
    const top = matches[0] ?? null;
    setMatch(top);
    setPhase('assembled');
    await wait(500);
    if (top) say('noor', top.cluster.narration);

    // 5) The Cost — live Stedi eligibility for the confirmatory step
    const cov = await fetch('/api/eligibility', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: 'aetna' }),
    }).then((x) => x.json()).catch(() => null);
    setCoverage(cov);
    const pa = cov?.priorAuthRequired === 'Y';
    if (top) {
      say('noor', `The next step I'd suggest — ${top.cluster.confirmatory.name} — is covered${cov?.copay ? `, about $${cov.copay} out of pocket` : ''}${pa ? ", and it needs prior authorization, which I've started." : '.'}`);
    }

    // 6) write it to Medplum (DetectedIssue + Dossier + referral + PA)
    const commit = await fetch('/api/medplum/commit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: rec.filter((f) => f.specialty.startsWith('Patient')).map((f) => f.detail),
        imagingFindings: img?.findings?.map((f: any) => f.narration),
        referral: top ? { specialty: 'Gyn / endometriosis specialist', imaging: top.cluster.confirmatory.name, cptCode: top.cluster.confirmatory.cptCode } : undefined,
        priorAuthRequired: pa,
        cluster: top ? { name: top.cluster.name, ask: top.cluster.ask, confidence: top.confidence } : undefined,
        patientName: { given: 'Maria', family: 'Doe' },
      }),
    }).then((x) => x.json()).catch(() => null);
    setCommitted(commit);

    await wait(300);
    say('noor', "I've assembled everything your doctors documented — including the scan they missed — into one brief. You've waited long enough. Let's get you answers.");
    setRunning(false);
  }

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
        <div>
          <h2 style={{ margin: 0 }}>Noor</h2>
          <span className="muted" style={{ fontSize: 13 }}>reading your whole record — including the scan they missed</span>
        </div>
        <button className="btn" onClick={simulate} disabled={running}>{running ? 'Running…' : '▶ Play demo'}</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr', alignItems: 'start' }}>
        {/* LEFT: the assembled record (The Dossier) + cluster */}
        <div className="grid">
          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              📄 The Dossier — assembled record {phase === 'connecting' && <span className="pill">connecting via patient-access APIs…</span>} {mossMs != null && <span className="pill">retrieval {mossMs}ms</span>}
            </div>
            {record.length === 0 && <p className="muted">Press ▶ Play demo — your records assemble here.</p>}
            <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 14 }}>
              {record.map((f) => (
                <div key={f.id} style={{ margin: '0 0 14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: 999,
                    background: f.fromImaging ? 'var(--accent-2)' : f.orphaned ? 'var(--warn)' : 'var(--accent)' }} />
                  <div style={{ fontSize: 12 }} className="muted">{f.date} · {f.specialty}{f.orphaned && <span className="warn"> · never followed up</span>}{f.fromImaging && <span style={{ color: 'var(--accent-2)' }}> · surfaced by Noor</span>}</div>
                  <div style={{ fontWeight: 600 }}>{f.label}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{f.detail}</div>
                  <div className="muted" style={{ fontSize: 11, opacity: 0.7 }}>source: {f.source}</div>
                </div>
              ))}
            </div>
          </div>

          {match && (
            <div className="card" style={{ borderColor: 'var(--accent-2)' }}>
              <div className="muted" style={{ fontSize: 12 }}>🔍 Pattern nobody assembled <span className="pill">{Math.round(match.confidence * 100)}% match</span></div>
              <h3 style={{ margin: '6px 0' }}>{match.cluster.name}</h3>
              <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>{match.cluster.narration}</p>
              <div style={{ marginTop: 10 }}>
                <div className="pill" style={{ marginBottom: 8 }}>The Ask (for the clinician — never a diagnosis)</div>
                <p style={{ margin: 0 }}>{match.cluster.ask}</p>
              </div>
              {coverage && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span className="pill" style={{ marginBottom: 8 }}>The Cost</span>
                  <p style={{ margin: '6px 0 0' }}>
                    <span className={coverage.active ? 'good' : 'bad'}>{coverage.active ? 'Covered' : 'Not covered'}</span>
                    {coverage.copay && <> · ~${coverage.copay} out of pocket</>}
                    {coverage.priorAuthRequired === 'Y' && <> · <span className="warn">prior auth started</span></>}
                  </p>
                </div>
              )}
              {committed && (
                <p className="muted" style={{ fontSize: 11, marginBottom: 0 }}>
                  {committed.dryRun ? committed.note : `Wrote ${Object.keys(committed.ids).length} FHIR resources (incl. DetectedIssue) to Medplum.`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: conversation */}
        <div className="card" style={{ minHeight: 380 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>🎙️ Conversation</div>
          {turns.map((t, i) => (
            <div key={i} style={{ margin: '10px 0', textAlign: t.role === 'patient' ? 'right' : 'left' }}>
              <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 12, maxWidth: '88%',
                background: t.role === 'patient' ? 'var(--panel-2)' : 'linear-gradient(135deg,#20305e,#3a2a5e)' }}>{t.text}</span>
            </div>
          ))}
          {turns.length === 0 && <p className="muted">Voice interview appears here. (Wire live Deepgram to replace the script — docs/BUILD_KIT.md.)</p>}
        </div>
      </div>
    </main>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
