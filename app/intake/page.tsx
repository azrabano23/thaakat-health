'use client';

import { useRef, useState } from 'react';
import { SEEDED_RECORD, matchClusters, type Finding, type ClusterMatch } from '@/lib/clusters';
import { useVoiceAgent } from '@/lib/useVoiceAgent';
import { THAAKAT_SYSTEM_PROMPT } from '@/lib/prompts';

type Turn = { role: 'patient' | 'thaakat'; text: string };

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

  // ── live Deepgram voice loop (real): the agent drives the flow via these function calls ──
  const recRef = useRef<Finding[]>([]);
  const FUNCTIONS = [
    { name: 'retrieve_criteria', description: 'Retrieve diagnostic criteria + prior findings relevant to what the patient just said.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'analyze_imaging', description: "Re-read the patient's prior pelvic MRI with the radiomics model.", parameters: { type: 'object', properties: {} } },
    { name: 'check_eligibility', description: 'Check coverage + cost for the recommended imaging/specialist.', parameters: { type: 'object', properties: {} } },
    { name: 'commit_chart', description: 'Write the assembled findings, referral, and question to the record.', parameters: { type: 'object', properties: {} } },
  ];

  async function handleFunction(name: string, args: any) {
    if (name === 'retrieve_criteria') {
      const r = await fetch('/api/moss/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: args?.query ?? '', topK: 4 }) }).then((x) => x.json());
      setMossMs(r.ms ?? null);
      return { criteria: r.results };
    }
    if (name === 'analyze_imaging') {
      const img = await fetch('/api/imaging/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studyId: 'demo-pelvic-mri-1' }) }).then((x) => x.json());
      const f: Finding = { id: 'radiomics', label: 'MRI re-read: deep infiltrating endometriosis', detail: img.summary, specialty: 'Thaakat radiomics', date: '2024-06', source: 'Radiomics re-read of 2024 pelvic MRI', tags: ['die-imaging'], fromImaging: true };
      setRecord((prev) => { const n = [...prev, f]; recRef.current = n; setMatch(matchClusters(n)[0] ?? null); return n; });
      return img;
    }
    if (name === 'check_eligibility') {
      const cov = await fetch('/api/eligibility', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient: 'aetna' }) }).then((x) => x.json());
      setCoverage(cov);
      return cov;
    }
    if (name === 'commit_chart') {
      const top = matchClusters(recRef.current)[0] ?? null;
      const commit = await fetch('/api/medplum/commit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symptoms: recRef.current.filter((f) => f.specialty.startsWith('Patient')).map((f) => f.detail), referral: top ? { specialty: 'Gyn / endometriosis specialist', imaging: top.cluster.confirmatory.name, cptCode: top.cluster.confirmatory.cptCode } : undefined, cluster: top ? { name: top.cluster.name, ask: top.cluster.ask, confidence: top.confidence } : undefined, patientName: { given: 'Maria', family: 'Doe' } }) }).then((x) => x.json());
      setCommitted(commit);
      return commit;
    }
    return { ok: true };
  }

  const voice = useVoiceAgent({
    systemPrompt: THAAKAT_SYSTEM_PROMPT + "\n\nThe patient's prior records are already loaded. Ask about the orphaned CA-125 and the pelvic MRI that was read as normal. Call analyze_imaging when she mentions the MRI, retrieve_criteria as you go, then check_eligibility and commit_chart to finish. Keep every turn to one short spoken sentence.",
    greeting: "Hi, I'm Thaakat. I've pulled your records together across your doctors. Take your time — tell me what's been going on.",
    functions: FUNCTIONS,
    onTranscript: say,
    onFunctionCall: handleFunction,
  });

  async function goLive() {
    setTurns([]); setMatch(null); setCoverage(null); setCommitted(null);
    recRef.current = [...SEEDED_RECORD];
    setRecord([...SEEDED_RECORD]);
    setPhase('interview');
    voice.start();
  }

  async function simulate() {
    setRunning(true);
    setRecord([]); setTurns([]); setMatch(null); setCoverage(null); setCommitted(null);
    const rec: Finding[] = [];
    const push = (f: Finding) => { rec.push(f); setRecord([...rec]); };

    // 1) connect records
    setPhase('connecting');
    say('thaakat', "Hi, I'm Thaakat. I've pulled your records together across your doctors — take your time and tell me what's been going on.");
    for (const f of SEEDED_RECORD) { await wait(500); push(f); }

    // 2) chart-aware question (Moss retrieves over the whole record <10ms)
    setPhase('interview');
    await wait(500);
    const r = await fetch('/api/moss/query', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'cyclical pelvic pain elevated CA-125 unremarkable ultrasound', topK: 4 }),
    }).then((x) => x.json()).catch(() => ({}));
    setMossMs(r.ms ?? null);
    say('thaakat', "I can see a CA-125 from 2024 that came back high and was never followed up, plus a pelvic ultrasound read as normal. When is the pain at its worst — and does it ever hurt during sex?");

    await wait(700);
    say('patient', "It's worst right before my period. And yeah… it really hurts during sex. Five doctors told me it was normal.");
    push({
      id: 'pt-today', label: 'Pain during sex + cyclical (today)',
      detail: 'Patient-reported: deep dyspareunia, pain worst premenstrually, misses work. Dismissed by prior clinicians.',
      specialty: 'Patient (today)', date: '2025-08', source: 'Thaakat voice intake',
      tags: ['dyspareunia', 'pelvic-pain', 'severity'],
    });

    // 3) the imaging moment — re-read the under-read MRI (THE MOAT)
    setPhase('reading');
    await wait(700);
    say('thaakat', 'You mentioned an MRI they called normal. Let me look at it myself.');
    const img = await fetch('/api/imaging/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studyId: 'demo-pelvic-mri-1' }),
    }).then((x) => x.json()).catch(() => null);
    await wait(500);
    if (img?.findings?.length) {
      for (const f of img.findings) say('thaakat', f.narration);
      push({
        id: 'radiomics', label: 'MRI re-read: deep infiltrating endometriosis',
        detail: img.summary, specialty: 'Thaakat radiomics', date: '2024-06',
        source: 'Radiomics re-read of 2024 pelvic MRI', tags: ['die-imaging'], fromImaging: true,
      });
    }

    // 4) assemble the cluster
    const matches = matchClusters(rec);
    const top = matches[0] ?? null;
    setMatch(top);
    setPhase('assembled');
    await wait(500);
    if (top) say('thaakat', top.cluster.narration);

    // 5) The Cost — live Stedi eligibility for the confirmatory step
    const cov = await fetch('/api/eligibility', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: 'aetna' }),
    }).then((x) => x.json()).catch(() => null);
    setCoverage(cov);
    const pa = cov?.priorAuthRequired === 'Y';
    if (top) {
      say('thaakat', `The next step I'd suggest — ${top.cluster.confirmatory.name} — is covered${cov?.copay ? `, about $${cov.copay} out of pocket` : ''}${pa ? ", and it needs prior authorization, which I've started." : '.'}`);
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
    say('thaakat', "I've assembled everything your doctors documented — including the scan they missed — into one brief. You've waited long enough. Let's get you answers.");
    setRunning(false);
  }

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
        <div>
          <h2 style={{ margin: 0 }}>Thaakat</h2>
          <span className="muted" style={{ fontSize: 13 }}>reading your whole record — including the scan they missed</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {voice.status !== 'idle' && <span className="pill">🎙️ {voice.status}</span>}
          {voice.status === 'idle' ? (
            <>
              <button className="btn" onClick={simulate} disabled={running}>{running ? 'Running…' : '▶ Play demo'}</button>
              <button className="btn" style={{ background: 'linear-gradient(135deg,var(--good),var(--accent))' }} onClick={goLive} disabled={running} title="Live Deepgram voice — needs DEEPGRAM_API_KEY">🎙️ Go live</button>
            </>
          ) : (
            <button className="btn" onClick={voice.stop}>■ Stop</button>
          )}
        </div>
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
                  <div style={{ fontSize: 12 }} className="muted">{f.date} · {f.specialty}{f.orphaned && <span className="warn"> · never followed up</span>}{f.fromImaging && <span style={{ color: 'var(--accent-2)' }}> · surfaced by Thaakat</span>}</div>
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
