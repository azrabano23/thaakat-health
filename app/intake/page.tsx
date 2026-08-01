'use client';

import { useState } from 'react';

type Turn = { role: 'patient' | 'noor'; text: string };

// Scripted demo so the repo is instantly demoable. The teammate wires the REAL Deepgram Voice
// Agent loop (see docs/BUILD_KIT.md §voice) and calls the same API routes this simulate() calls.
const SCRIPT: { patient: string; retrieveQuery: string }[] = [
  { patient: "Hi… I've had really bad pelvic pain for years and no one can tell me why.", retrieveQuery: 'chronic pelvic pain unexplained years' },
  { patient: 'It gets way worse around my period, and honestly it hurts during sex too.', retrieveQuery: 'cyclical pelvic pain worse during period pain during sex' },
  { patient: 'I actually had a pelvic MRI last month but they said it looked normal.', retrieveQuery: 'pelvic MRI normal read endometriosis missed' },
];

export default function Intake() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [imaging, setImaging] = useState<any | null>(null);
  const [coverage, setCoverage] = useState<any | null>(null);
  const [committed, setCommitted] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [mossMs, setMossMs] = useState<number | null>(null);

  function say(role: Turn['role'], text: string) {
    setTurns((t) => [...t, { role, text }]);
  }

  async function simulate() {
    setRunning(true);
    setTurns([]); setSymptoms([]); setImaging(null); setCoverage(null); setCommitted(null);
    say('noor', "Hi, I'm Noor. Take your time — tell me what's been going on.");
    const captured: string[] = [];

    for (const step of SCRIPT) {
      await wait(700);
      say('patient', step.patient);
      captured.push(step.patient);
      setSymptoms([...captured]);

      // retrieve relevant criteria (Moss <10ms, or local fallback)
      const r = await fetch('/api/moss/query', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: step.retrieveQuery, topK: 4 }),
      }).then((x) => x.json());
      setMossMs(r.ms ?? null);
      const followUp = r.results?.find((c: any) => c.followUp)?.followUp;
      await wait(600);
      if (followUp) say('noor', followUp);
    }

    // read the scan (the moat)
    await wait(700);
    say('noor', 'You mentioned an MRI — let me take a look at it myself.');
    const img = await fetch('/api/imaging/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studyId: 'demo-pelvic-mri-1' }),
    }).then((x) => x.json());
    setImaging(img);
    await wait(500);
    for (const f of img.findings) say('noor', f.narration);

    // check coverage (Stedi test mode)
    await wait(700);
    const cov = await fetch('/api/eligibility', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: 'aetna' }),
    }).then((x) => x.json());
    setCoverage(cov);
    const pa = cov.priorAuthRequired === 'Y';
    say('noor', `The specialist MRI I'd recommend is covered${cov.copay ? `, about $${cov.copay} out of pocket` : ''}${pa ? ", and it needs prior authorization — which I've started for you." : '.'}`);

    // write the chart (Medplum FHIR)
    const commit = await fetch('/api/medplum/commit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: captured,
        imagingFindings: img.findings.map((f: any) => f.narration),
        referral: { specialty: 'Gynecology — endometriosis specialist', imaging: 'Pelvic MRI (endo protocol)', cptCode: '72197' },
        priorAuthRequired: pa,
        patientName: { given: 'Jane', family: 'Doe' },
      }),
    }).then((x) => x.json());
    setCommitted(commit);
    await wait(300);
    say('noor', "I've put together a summary and referral for your doctor. You've waited long enough — let's get you answers.");
    setRunning(false);
  }

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
        <h2 style={{ margin: 0 }}>Noor · voice intake</h2>
        <button className="btn" onClick={simulate} disabled={running}>
          {running ? 'Running…' : '▶ Play demo'}
        </button>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Demo runs the scripted flow against the real API routes (Moss retrieval, imaging, Stedi
        coverage, Medplum write). Wire the live Deepgram Voice Agent to replace the script — see
        <code> docs/BUILD_KIT.md</code>.
      </p>

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
        {/* conversation */}
        <div className="card" style={{ minHeight: 340 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Conversation {mossMs != null && <span className="pill">retrieval {mossMs}ms</span>}
          </div>
          {turns.map((t, i) => (
            <div key={i} style={{ margin: '10px 0', textAlign: t.role === 'patient' ? 'right' : 'left' }}>
              <span
                style={{
                  display: 'inline-block', padding: '8px 12px', borderRadius: 12, maxWidth: '85%',
                  background: t.role === 'patient' ? 'var(--panel-2)' : 'linear-gradient(135deg,#20305e,#3a2a5e)',
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
          {turns.length === 0 && <p className="muted">Press ▶ Play demo.</p>}
        </div>

        {/* live panels */}
        <div className="grid">
          <div className="card">
            <h4 style={{ marginTop: 0 }}>🧾 Clinical picture</h4>
            {symptoms.length === 0 && <p className="muted">Symptoms appear here as Noor listens.</p>}
            <ul>{symptoms.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}</ul>
          </div>

          <div className="card">
            <h4 style={{ marginTop: 0 }}>🩻 Imaging (radiomics)</h4>
            {!imaging && <p className="muted">The scan read appears here — our moat.</p>}
            {imaging && (
              <>
                <p className="muted" style={{ marginTop: 0 }}>{imaging.summary} {imaging.isMock && <span className="pill">demo model</span>}</p>
                {imaging.findings.map((f: any, i: number) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <strong>{f.label}</strong> {f.confidence && <span className="pill">{Math.round(f.confidence * 100)}%</span>}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="card">
            <h4 style={{ marginTop: 0 }}>✅ Coverage & next steps</h4>
            {!coverage && <p className="muted">Coverage + prior auth appear here.</p>}
            {coverage && (
              <p style={{ marginTop: 0 }}>
                <span className={coverage.active ? 'good' : 'bad'}>{coverage.active ? 'Covered' : 'Not covered'}</span>
                {coverage.copay && <> · ~${coverage.copay} out of pocket</>}
                {coverage.priorAuthRequired === 'Y' && <> · <span className="warn">prior auth started</span></>}
              </p>
            )}
            {committed && (
              <p className="muted" style={{ fontSize: 12 }}>
                {committed.dryRun ? committed.note : `Wrote ${Object.keys(committed.ids).length} FHIR resources to Medplum.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
