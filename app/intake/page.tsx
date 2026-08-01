'use client';

// Thaakat — Clinical Console (/intake). Light editorial workspace that matches the marketing
// page's paper theme. Two ways to run the SAME demo, through the same engines and the same cards:
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
import { RecordTimeline, ConversationPanel, Nav } from '@/components/ui';
import { ImagingEvidence } from '@/components/ImagingEvidence';
import LiveVoice from './LiveVoice';

type Turn = { role: 'patient' | 'thaakat'; text: string };
type Coverage = { active?: boolean; planName?: string; copay?: string; priorAuthRequired?: string; error?: string };
type Committed = { dryRun?: boolean; ids?: Record<string, string>; note?: string; error?: string };
type Retrieval = { ms: number; backend: string };

const PAYER_NAME: Record<string, string> = { uhc: 'UnitedHealthcare', aetna: 'Aetna' };

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
      await wait(420);
      push(f);
    }

    // 2) the chart-aware question, assembled from what retrieval actually returned over HER record.
    setPhase('interview');
    await wait(380);
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
    say('thaakat', cited.length ? `I can see ${cited.join(', and ')}. ${patient.question}` : patient.question);

    await wait(620);
    say('patient', patient.reply);
    push(patient.reported);

    await wait(420);
    say(
      'thaakat',
      "I'm sorry you've had to keep hearing that this is normal. Pain that disrupts your life deserves to be taken seriously.",
    );

    // 3) the imaging moment — re-read the under-read scan (THE MOAT), only if she has one on file.
    let img: { summary?: string; findings?: { narration: string; clinicalDetail?: string }[] } | null = null;
    if (patient.imaging) {
      setPhase('reading');
      await wait(560);
      say('thaakat', patient.imaging.intro);
      img = await fetch('/api/imaging/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyId: patient.imaging.studyId }),
      })
        .then((x) => x.json())
        .catch(() => null);
      await wait(430);
      if (img?.findings?.length) {
        say('thaakat', "I found a couple of things I'd want an endometriosis specialist to review with you.");
        for (const f of img.findings) {
          await wait(450);
          say('thaakat', f.narration);
        }
        await wait(300);
        say(
          'thaakat',
          "This isn't a diagnosis, and I don't want to overstate what one scan can tell us. But it is enough that you deserve a careful next conversation.",
        );
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
    await wait(430);
    if (top) {
      say(
        'thaakat',
        patient.id === 'maria'
          ? "When I put your history together — the timing of the pain, the bowel symptoms, the lab that wasn't followed up, and this scan — I see a pattern that is worth bringing to a specialist."
          : "When I put these notes together, I see a pattern worth taking to a rheumatologist rather than treating each symptom separately.",
      );
      await wait(320);
      say('thaakat', `The question I’d bring to your clinician is: ${top.cluster.ask}`);
    }

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
        imagingFindings: img?.findings?.map((f) => f.clinicalDetail ?? f.narration),
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
        demoPatientId: patient.id, // resolves the seeded chart — lib/demo-identity.ts
      }),
    })
      .then((x) => x.json())
      .catch(() => ({ error: 'unreachable' }));
    setCommitted(commit);

    await wait(280);
    say(
      'thaakat',
      "I've put the important pieces into one brief your clinician can review, with the original sources attached. You shouldn't have to tell this whole story from scratch again.",
    );
    setRunning(false);
  }

  const pct = match ? Math.round(match.confidence * 100) : 0;

  return (
    <div className="paper console-wrap">
      <div className="field" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Nav
        links={[
          { label: 'The problem', href: '/#problem' },
          { label: 'How it works', href: '/#how' },
          { label: 'The tech', href: '/#tech' },
          { label: 'Founders', href: '/#founders' },
        ]}
        cta={{ label: 'Back to site', href: '/' }}
      />
      <main className="shell">
        {/* ── header ── */}
        <div className="console-head">
          <div>
            <h1 className="console-title">Thaakat · Clinical Console</h1>
            <div className="console-sub">
              Reads the whole record · re-reads the scan · surfaces a question for a clinician — never a diagnosis
            </div>
          </div>
          <div className="console-actions">
            {/* Same engine, different patient — the "is this hardcoded to endo?" answer. */}
            <select
              className="selectpt"
              value={patientId}
              disabled={running}
              onChange={(e) => {
                setPatientId(e.target.value);
                reset();
              }}
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

        {/* ── patient banner (the chart header a clinician reads first) ── */}
        <section className="pt-banner">
          <div className="pt-top">
            <span className="pt-name">
              {patient.name.given} {patient.name.family}
            </span>
            <span className="pt-demo">
              {patient.demographics.age} · {patient.demographics.sex} · {patient.demographics.mrn}
            </span>
            <span className="pt-payer">
              <span className="pill">{PAYER_NAME[patient.payer] ?? patient.payer} · member</span>
            </span>
          </div>
          <p className="pt-cc">
            <b>CC</b>
            {patient.chart.chiefComplaint}
          </p>

          <hr className="pt-rule" />
          <div className="vitals">
            {patient.vitals.map((v) => (
              <div key={v.label} className={`vital ${v.flag === 'high' ? 'hi' : v.flag === 'low' ? 'lo' : ''}`}>
                <span className="vk">{v.label}</span>
                <span className="vv">
                  {v.value}
                  {v.unit ? <span className="vu"> {v.unit}</span> : null}
                  {v.flag === 'high' ? ' ↑' : v.flag === 'low' ? ' ↓' : ''}
                </span>
              </div>
            ))}
          </div>

          <hr className="pt-rule" />
          <div className="chart-grid">
            <div className="chart-col">
              <h4>Labs on file</h4>
              {patient.labs.map((l) => (
                <div key={l.label} className={`lab ${l.flag === 'high' ? 'hi' : l.flag === 'low' ? 'lo' : ''}`}>
                  <span className="lab-k">{l.label}</span>
                  <span className="lab-v">{l.value}</span>
                  {l.orphaned && <span className="lab-orphan">never followed up</span>}
                  <span className="lab-ref">ref {l.ref}</span>
                </div>
              ))}
            </div>
            <div className="chart-col">
              <h4>History</h4>
              <p className="hx-line">
                <b>Past medical</b>
                {patient.chart.pmh.join(' · ')}
              </p>
              <p className="hx-line">
                <b>Past surgical</b>
                {patient.chart.psh.join(' · ')}
              </p>
              <p className="hx-line">
                <b>Medications</b>
                {patient.chart.meds.join(' · ')}
              </p>
              <p className="hx-line">
                <b>Allergies</b>
                {patient.chart.allergies.join(', ')}
              </p>
              <p className="hx-line">
                <b>Family</b>
                {patient.chart.family.join(' · ')}
              </p>
            </div>
          </div>

          {patient.chart.pathology && (
            <div className="gate">
              <FlagIcon />
              <p>
                <b>Diagnostic gate — </b>
                {patient.chart.pathology}
              </p>
            </div>
          )}
        </section>

        <section className="call-bridge" aria-label="How the patient call reaches the clinical team">
          <div className="call-bridge-copy">
            <span className="label-sig">◆ From patient call to clinician action</span>
            <p>
              The patient speaks naturally; the care team sees the transcript, chart evidence, and next-step brief in
              one place. The live button uses Deepgram. “Play demo” is an offline-safe replay of the same retrieval,
              imaging, coverage, and FHIR steps.
            </p>
          </div>
          <div className="call-flow" aria-label="Patient to Deepgram to Thaakat to clinical console">
            <span>Patient call</span><i>→</i><span><b>Deepgram</b><small>Nova-3 Medical · Aura</small></span><i>→</i>
            <span><b>Thaakat</b><small>Claude + Moss</small></span><i>→</i><span>Clinical console</span>
          </div>
          <div className="patient-benefits">
            <span><b>Less repetition</b> Her history is assembled before the visit.</span>
            <span><b>More agency</b> She leaves with a clinician question, not a black-box verdict.</span>
            <span><b>A practical next step</b> Coverage and prior-auth status travel with the brief.</span>
          </div>
        </section>

        {/* ── two-column interactive workspace ── */}
        <div className="console">
          {/* LEFT: the Dossier + the assembled pattern */}
          <div style={{ display: 'grid', gap: 22 }}>
            <div className="panel-ed">
              <div className="panel-h">
                <span className="label-sig">◆ The Dossier — assembled record</span>
                {phase === 'connecting' && <span className="hud">connecting via patient-access APIs…</span>}
                {retrieval && (
                  <span className="hud" title="Retrieval call only — excludes the server→Moss network hop">
                    {retrieval.backend === 'moss' ? 'Moss' : 'local'} retrieval <b>{retrieval.ms}ms</b>
                  </span>
                )}
              </div>
              {record.length === 0 ? (
                <p className="empty-ed">
                  Press <b>▶ Play demo</b>, or start a live call — every note, lab, and scan across her specialists
                  assembles here on one timeline.
                </p>
              ) : (
                <RecordTimeline record={record} />
              )}
            </div>

            {match && (
              <div className="cluster">
                <div className="cluster-head">
                  <span className="label-sig">◆ Pattern nobody assembled</span>
                  <span className="cluster-conf">
                    <span className="cluster-meter">
                      <span style={{ width: `${pct}%` }} />
                    </span>
                    <span style={{ color: 'var(--signal)', fontVariantNumeric: 'tabular-nums', fontWeight: 650, fontSize: 13 }}>
                      {pct}%
                    </span>
                  </span>
                </div>

                <h3>{match.cluster.name}</h3>
                <p className="cluster-narr">{match.cluster.narration}</p>

                <div className="cluster-block">
                  <span className="lbl">The Ask — for the clinician, never a diagnosis</span>
                  <p>{match.cluster.ask}</p>
                  {match.cluster.confirmatory?.name && (
                    <p style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13.5 }}>
                      Suggested confirmatory step:{' '}
                      <strong style={{ color: 'var(--text)' }}>{match.cluster.confirmatory.name}</strong>
                      {match.cluster.confirmatory.cptCode && (
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>
                          {' '}
                          · CPT {match.cluster.confirmatory.cptCode}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {coverage && (
                  <div className="cluster-block">
                    <span className="lbl">The Cost — live eligibility (Stedi)</span>
                    {/* A failed eligibility call is NOT a denial — don't put a decision in the payer's mouth. */}
                    {coverage.error ? (
                      <p style={{ margin: 0 }} className="muted">
                        Coverage check unavailable
                      </p>
                    ) : (
                      <div className="cluster-cost">
                        <span className={coverage.active ? 'good' : 'bad'} style={{ fontWeight: 650 }}>
                          {coverage.active ? 'Covered' : 'Not covered'}
                        </span>
                        {coverage.copay && <span className="muted">~${coverage.copay} out of pocket</span>}
                        {coverage.priorAuthRequired === 'Y' && <span className="pill pill-warn">prior auth started</span>}
                        {coverage.priorAuthRequired === 'U' && (
                          <span className="muted">prior auth undetermined by payer</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {committed && (
                  <p className="muted" style={{ fontSize: 11.5, marginTop: 14, marginBottom: 0 }}>
                    {/* A failed write degrades to a line, not a blank screen. */}
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

          {/* RIGHT: the conversation */}
          <div className="panel-ed">
            <div className="panel-h">
              <span className="label-sig">◆ Conversation</span>
              {phase === 'reading' && <span className="hud">re-reading the scan…</span>}
            </div>
            {turns.length === 0 ? (
              <p className="empty-ed">
                Press <b>🎙️ Talk to Thaakat</b> for a live call, or <b>▶ Play demo</b> for the scripted run.
              </p>
            ) : (
              <ConversationPanel turns={turns} />
            )}
          </div>
        </div>

        <ImagingEvidence reading={phase === 'reading'} />

        <section className="sponsor-proof" aria-labelledby="sponsor-proof-title">
          <div className="sponsor-proof-head">
            <span className="label-sig">◆ Every sponsor is in the clinical loop</span>
            <p id="sponsor-proof-title">Each call produces something useful for the patient and something reviewable for the care team.</p>
          </div>
          <div className="sponsor-grid">
            <div><b>Deepgram</b><span>Patient speaks naturally</span><p>Nova-3 Medical handles clinical vocabulary; Aura speaks back. The clinician console receives the live transcript and extracted symptoms.</p></div>
            <div><b>Moss</b><span>Finds the missing context</span><p>Retrieves the relevant notes and labs during the turn, so Thaakat can ask a chart-aware question without making the patient repeat years of history.</p></div>
            <div><b>Medplum</b><span>Makes it reviewable</span><p>Writes the sourced `DetectedIssue`, voice observations, imaging report, referral, and authorization task into FHIR for a clinician to verify.</p></div>
            <div><b>Stedi</b><span>Makes the plan actionable</span><p>Checks eligibility and estimated cost for the suggested next step, rather than leaving the patient with an unaffordable or unknowable recommendation.</p></div>
          </div>
          <p className="sponsor-note">Claude is the conversation and orchestration layer. Synthetic chart data only; research images are separately attributed; decision-support, never diagnosis.</p>
        </section>
      </main>
    </div>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 14V3.5C4 3.5 5 2.8 8 2.8s4 1.4 4 1.4v6s-1-.7-4-.7-4 .7-4 .7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
