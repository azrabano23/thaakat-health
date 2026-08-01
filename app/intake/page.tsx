'use client';

// Two ways to run the same demo, through the same engines and the same cards:
//   🎙️ Talk to Thaakat — the live Deepgram Voice Agent (app/intake/LiveVoice.tsx)
//   ▶ Play demo        — a scripted run, kept as the on-stage fallback if wifi eats the socket
//
// Both drive lib/clusters.ts, /api/moss/query, /api/imaging/analyze, /api/eligibility and
// /api/medplum/commit. Decision-support / navigation — never diagnosis. Synthetic data only.

import { useRef, useState } from 'react';
import {
  DEMO_PATIENTS,
  getPatient,
  matchClusters,
  mentionOf,
  type Finding,
  type ClusterMatch,
} from '@/lib/clusters';
import type { ContextDoc } from '@/lib/moss';
import LiveVoice from './LiveVoice';

type Turn = { role: 'patient' | 'thaakat'; text: string };
type Coverage = { active?: boolean; planName?: string; copay?: string; priorAuthRequired?: string; error?: string };
type Committed = { dryRun?: boolean; ids?: Record<string, string>; note?: string; error?: string };
type Retrieval = { ms: number; backend: string };

export default function Intake() {
  const [patientId, setPatientId] = useState('maria');
  const [record, setRecord] = useState<Finding[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [match, setMatch] = useState<ClusterMatch | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [committed, setCommitted] = useState<Committed | null>(null);
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'interview' | 'reading' | 'assembled'>('idle');
  const [retrieval, setRetrieval] = useState<Retrieval | null>(null);
  const [running, setRunning] = useState(false);

  const patient = getPatient(patientId);
  const say = (role: Turn['role'], text: string) => setTurns((t) => [...t, { role, text }]);

  function reset() {
    setRecord([]);
    setTurns([]);
    setMatch(null);
    setCoverage(null);
    setCommitted(null);
    setRetrieval(null);
    setPhase('idle');
  }

  // ── the live call drives the exact same cards through these callbacks ──
  const liveRecord = useRef<Finding[]>([]);
  const liveHandlers = {
    onTurn: say,
    onFinding: (f: Finding) =>
      setRecord((prev) => {
        const next = [...prev, f];
        liveRecord.current = next;
        return next;
      }),
    onCluster: setMatch,
    onCoverage: (c: Coverage) => setCoverage(c),
    onCommit: (c: unknown) => setCommitted(c as Committed),
    onRetrieval: (ms: number, backend: string) => setRetrieval({ ms, backend }),
    onPhase: (p: 'interview' | 'reading' | 'assembled') => setPhase(p),
  };

  // ── the scripted run ──
  async function simulate() {
    setRunning(true);
    reset();
    const rec: Finding[] = [];
    const push = (f: Finding) => {
      rec.push(f);
      setRecord([...rec]);
    };

    // 1) connect records
    setPhase('connecting');
    say(
      'thaakat',
      "Hi, I'm Thaakat. I've pulled your records together across your doctors — take your time and tell me what's been going on.",
    );
    for (const f of patient.record) {
      await wait(450);
      push(f);
    }

    // 2) the chart-aware question. What gets cited is assembled from what retrieval actually
    //    returned over HER record — not a hardcoded sentence about a CA-125.
    setPhase('interview');
    await wait(400);
    const r = await fetch('/api/moss/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: patient.retrievalQuery, patientId: patient.id, topK: 6 }),
    })
      .then((x) => x.json())
      .catch(() => null);

    if (r?.ms != null) setRetrieval({ ms: r.ms, backend: r.backend });
    const cited = ((r?.results ?? []) as ContextDoc[])
      .filter((d): d is Extract<ContextDoc, { kind: 'record' }> => d.kind === 'record')
      .slice(0, 2)
      .map((d) => mentionOf(d.finding));
    say(
      'thaakat',
      cited.length
        ? `I can see ${cited.join(', and ')}. ${patient.question}`
        : patient.question,
    );

    await wait(650);
    say('patient', patient.reply);
    push(patient.reported);

    // 3) the imaging moment — re-read the under-read scan (THE MOAT). Only for a patient who
    //    actually has one on file; Dana's run is pure record assembly, which is the honest version.
    let img: { summary?: string; findings?: { narration: string }[] } | null = null;
    if (patient.imaging) {
      setPhase('reading');
      await wait(600);
      say('thaakat', patient.imaging.intro);
      img = await fetch('/api/imaging/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyId: patient.imaging.studyId }),
      })
        .then((x) => x.json())
        .catch(() => null);
      await wait(450);
      if (img?.findings?.length) {
        for (const f of img.findings) say('thaakat', f.narration);
        push({
          id: 'radiomics',
          label: patient.imaging.label,
          detail: img.summary ?? '',
          specialty: patient.imaging.specialty,
          date: patient.imaging.date,
          source: patient.imaging.source,
          tags: patient.imaging.tags,
          fromImaging: true,
        });
      }
    }

    // 4) assemble the cluster
    const top = matchClusters(rec)[0] ?? null;
    setMatch(top);
    setPhase('assembled');
    await wait(450);
    if (top) say('thaakat', top.cluster.narration);

    // 5) The Cost — live Stedi eligibility for the confirmatory step
    const cov: Coverage | null = await fetch('/api/eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: patient.payer, serviceTypeCodes: top?.cluster.confirmatory.serviceTypeCodes }),
    })
      .then((x) => x.json())
      .catch(() => ({ error: 'unreachable' }));
    setCoverage(cov);
    const pa = cov?.priorAuthRequired === 'Y';
    if (top && cov && !cov.error) {
      say(
        'thaakat',
        `The next step I'd suggest — ${top.cluster.confirmatory.name} — is covered${
          cov.copay ? `, about $${cov.copay} out of pocket` : ''
        }${pa ? ", and it needs prior authorization, which I've started." : '.'}`,
      );
    }

    // 6) write it to Medplum (DetectedIssue + Dossier + referral + PA)
    const commit: Committed = await fetch('/api/medplum/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: rec.filter((f) => f.specialty.startsWith('Patient')).map((f) => f.detail),
        imagingFindings: img?.findings?.map((f) => f.narration),
        referral: top
          ? {
              specialty: 'Gyn / endometriosis specialist',
              imaging: top.cluster.confirmatory.name,
              cptCode: top.cluster.confirmatory.cptCode,
            }
          : undefined,
        priorAuthRequired: pa,
        cluster: top ? { name: top.cluster.name, ask: top.cluster.ask, confidence: top.confidence } : undefined,
        patientName: patient.name,
      }),
    })
      .then((x) => x.json())
      .catch(() => ({ error: 'unreachable' }));
    setCommitted(commit);

    await wait(300);
    say(
      'thaakat',
      "I've assembled everything your doctors documented into one brief. You've waited long enough. Let's get you answers.",
    );
    setRunning(false);
  }

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Thaakat</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            reading your whole record — including the scan they missed
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Same engine, different patient — the "is this hardcoded to endo?" answer. */}
          <select
            className="pill"
            value={patientId}
            disabled={running}
            onChange={(e) => {
              setPatientId(e.target.value);
              reset();
            }}
            style={{ background: 'transparent', color: 'inherit', border: '1px solid var(--border)', padding: '6px 10px' }}
          >
            {DEMO_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.given} {p.name.family} — {p.headline}
              </option>
            ))}
          </select>

          <button className="btn" onClick={simulate} disabled={running}>
            {running ? 'Running…' : '▶ Play demo'}
          </button>

          <LiveVoice
            handlers={liveHandlers}
            patientId={patientId}
            disabled={running}
            onSeed={(seeded) => {
              reset();
              liveRecord.current = [...seeded];
              setRecord([...seeded]);
              setPhase('interview');
            }}
          />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr', alignItems: 'start' }}>
        {/* LEFT: the assembled record (The Dossier) + cluster */}
        <div className="grid">
          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              📄 The Dossier — assembled record{' '}
              {phase === 'connecting' && <span className="pill">connecting via patient-access APIs…</span>}{' '}
              {retrieval && (
                <span className="pill" title="Retrieval call only — excludes the server→Moss network hop">
                  {retrieval.backend === 'moss' ? 'Moss' : 'local fallback'} retrieval {retrieval.ms}ms
                </span>
              )}
            </div>
            {record.length === 0 && <p className="muted">Press ▶ Play demo, or start a live call — records assemble here.</p>}
            <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 14 }}>
              {record.map((f) => (
                <div key={f.id} style={{ margin: '0 0 14px', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -21,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: f.fromImaging ? 'var(--accent-2)' : f.orphaned ? 'var(--warn)' : 'var(--accent)',
                    }}
                  />
                  <div style={{ fontSize: 12 }} className="muted">
                    {f.date} · {f.specialty}
                    {f.orphaned && <span className="warn"> · never followed up</span>}
                    {f.fromImaging && <span style={{ color: 'var(--accent-2)' }}> · surfaced by Thaakat</span>}
                  </div>
                  <div style={{ fontWeight: 600 }}>{f.label}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{f.detail}</div>
                  <div className="muted" style={{ fontSize: 11, opacity: 0.7 }}>source: {f.source}</div>
                </div>
              ))}
            </div>
          </div>

          {match && (
            <div className="card" style={{ borderColor: 'var(--accent-2)' }}>
              <div className="muted" style={{ fontSize: 12 }}>
                🔍 Pattern nobody assembled <span className="pill">{Math.round(match.confidence * 100)}% match</span>
              </div>
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
                    {/* A failed eligibility call is NOT a denial. Rendering an error as "Not covered"
                        puts a decision in the payer's mouth that the payer never made. */}
                    {coverage.error ? (
                      <span className="muted">Coverage check unavailable</span>
                    ) : (
                      <>
                        <span className={coverage.active ? 'good' : 'bad'}>
                          {coverage.active ? 'Covered' : 'Not covered'}
                        </span>
                        {coverage.copay && <> · ~${coverage.copay} out of pocket</>}
                        {coverage.priorAuthRequired === 'Y' && (
                          <> · <span className="warn">prior auth started</span></>
                        )}
                        {coverage.priorAuthRequired === 'U' && (
                          <> · <span className="muted">prior auth undetermined by payer</span></>
                        )}
                      </>
                    )}
                  </p>
                </div>
              )}

              {committed && (
                <p className="muted" style={{ fontSize: 11, marginBottom: 0 }}>
                  {/* Reading committed.ids unguarded crashed the whole page mid-demo when the
                      FHIR write failed. A failed write degrades to a line, not a blank screen. */}
                  {committed.error
                    ? 'FHIR write unavailable — the assembled record above is unaffected.'
                    : committed.dryRun
                      ? committed.note
                      : `Wrote ${Object.keys(committed.ids ?? {}).length} FHIR resources (incl. DetectedIssue) to Medplum.`}
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
              <span
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 12,
                  maxWidth: '88%',
                  background: t.role === 'patient' ? 'var(--panel-2)' : 'linear-gradient(135deg,#20305e,#3a2a5e)',
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
          {turns.length === 0 && (
            <p className="muted">
              Press 🎙️ Talk to Thaakat for a live call, or ▶ Play demo for the scripted run.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
