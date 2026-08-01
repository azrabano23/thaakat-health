import {
  Nav,
  Footer,
  SectionHeading,
  FounderCard,
  ArchitectureFlow,
  MarketExpansion,
  ScanPlate,
  ArrowIcon,
  CheckIcon,
} from '@/components/ui';
import { ModelCard } from '@/components/ModelCard';

const NAV_LINKS = [
  { label: 'The problem', href: '#problem' },
  { label: 'How it works', href: '#how' },
  { label: 'The tech', href: '#tech' },
  { label: 'Handling', href: '#handling' },
  { label: 'Founders', href: '#founders' },
];

// Every figure sourced in docs/EVIDENCE.md. Verified primary sources only; soft/advocacy
// numbers were dropped rather than dressed up (a physician judge will check).
const STATS = [
  { value: '88%', label: 'of referred cases were changed or refined when one team re-read the whole record (n=286).', source: 'Mayo · Van Such 2017' },
  { value: '60–80%', label: 'of radiology errors are perceptual — the finding was already visible on the first scan.', source: 'Brady · Insights into Imaging' },
  { value: '795K', label: 'Americans die or are permanently disabled by diagnostic error every year.', source: 'Johns Hopkins · BMJ 2023' },
  { value: '4–12 yrs', label: 'and 5+ clinicians to diagnose endometriosis — and the delay is widening, not closing.', source: 'WHO · WERF' },
];

const WORKFLOW = [
  { n: '01', title: 'You talk — it charts as you speak', body: 'You check in by talking to a voice agent. The conversation becomes clinical documentation in real time — capturing the symptom story that forms and rushed visits lose.' },
  { n: '02', title: 'Deep-researched, with your full history', body: 'Any issue you describe — even a simple rash — is researched against the guidelines and your own record, so the next question is tailored to you, not generic.' },
  { n: '03', title: 'Triaged & routed to the right specialist', body: 'The core move. The reason it takes seven doctors is misrouting — GI for “IBS”, urology for “UTIs”, psych for “stress”. Thaakat decides which specialist you actually need — and whether you even need a scan — and routes you there the first time.' },
  { n: '04', title: 'Your scan, re-read — only if it matters', body: 'When imaging is part of the picture, a real model re-reads the scan they called “normal” for what a routine read misses. Many patients don’t need one — and Thaakat says so.' },
  { n: '05', title: 'An n=1 plan, peer-reviewed by an expert', body: 'A personalized next-steps plan (a FHIR CarePlan), flagged for a human specialist to peer-review before your visit — decision-support, never an autonomous diagnosis.' },
  { n: '06', title: 'Cost & coverage, up front', body: 'What it costs and whether insurance covers it — a live eligibility check — before you ever see the doctor.' },
];

const MODEL = [
  { val: 'B2B CDS SaaS', label: 'Clinical decision-support the clinic logs into — the Dossier, one-click orders, and an ROI dashboard.' },
  { val: '~$20–40k / site', label: 'Per-site annual license, priced to the value of a single avoided failed cycle.' },
  { val: 'The standard', label: 'Position: the structured intelligence layer for endometriosis care.' },
];

const METRICS = [
  { val: 'Years → weeks', dir: 'down' as const, label: 'Time to diagnosis — the odyssey compressed to a first informed visit.' },
  { val: 'Catch-rate', dir: 'up' as const, label: 'Endometriosis patterns surfaced earlier, from evidence already on file.' },
  { val: 'IVF success', dir: 'up' as const, label: 'Treat endometriosis before transfer instead of after failed cycles.' },
];

const BUYERS = ['Academic medical centers', 'Fertility clinics', 'Women’s-health clinics', 'Imaging centers'];

// How the record is handled in transit and at rest. Every row here is a control that is actually
// in the codebase — the transport headers are set in next.config.mjs, the key boundary is why
// /api/deepgram/token exists at all. Don't add a row for something we haven't built.
const HANDLING = [
  {
    control: 'TLS everywhere',
    body: 'Nothing moves over plain HTTP. The browser reaches us over HTTPS, and every hop out — Deepgram, Moss, Medplum, Stedi — is TLS 1.2+. The voice stream is a WSS socket, not WS.',
    where: 'HSTS · upgrade-insecure-requests',
  },
  {
    control: 'Keys never reach the browser',
    body: 'No credential is bundled into client JavaScript. The browser gets a Deepgram token that expires in five minutes; the real keys stay in server routes, and Medplum and Stedi are only ever called server-side.',
    where: '/api/deepgram/token',
  },
  {
    control: 'Pinned egress',
    body: 'A Content-Security-Policy limits outbound connections to the four sponsor endpoints. Injected script has nowhere to send a record to, because every other destination is refused by the browser.',
    where: 'CSP connect-src',
  },
  {
    control: 'FHIR system of record',
    body: 'The record lives in Medplum — encrypted at rest, access-controlled, and audited. We keep no shadow copy: nothing clinical is written to local storage or a log line.',
    where: 'Medplum · AWS',
  },
  {
    control: 'Synthetic patients only',
    body: 'Every patient in this demo is invented. No real PHI has ever entered the system, so there is nothing here to breach — and the controls above are what we carry into a deployment where that changes.',
    where: 'Seeded fixtures',
  },
];

// Clinical backing — the product is grounded in guidelines + peer-reviewed literature (docs/EVIDENCE.md).
const CLINICAL_BACKING = [
  { src: 'ESHRE 2022 · NICE NG73', claim: 'The symptom cluster we assemble is the guideline “suspect endometriosis” list — and a normal scan does not exclude disease. Laparoscopy is no longer the required gold standard.' },
  { src: 'Van Such 2017 (Mayo, n=286)', claim: 'When one team re-read the whole record, 21% of referred cases got a different diagnosis and 66% were refined — evidence that assembly changes management.' },
  { src: 'Brady 2017 · Insights into Imaging', claim: '60–80% of radiology errors are perceptual — the finding was already visible on the first scan. That is exactly what the re-read targets.' },
  { src: 'FDA CDS Guidance 2022', claim: 'Record assembly is decision-support; image analysis is a device — so we frame the radiomics re-read as investigational SaMD, never autonomous diagnosis.' },
];

export default function Home() {
  return (
    <div className="paper">
      <div className="field" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <Nav links={NAV_LINKS} cta={{ label: 'See the demo', href: '/intake' }} />

      <main>
        {/* ============================ 1 · HERO ============================ */}
        <section className="section hero" id="top">
          <div className="shell">
            <div className="runhead hero-eyebrow rise rise-1">
              <span className="no">Thaakat</span>
              <span>Bringing it to light</span>
              <span className="ln" />
            </div>

            <h1 className="display display-xl rise rise-2">
              She wasn’t hard to diagnose. She was sent to the{' '}
              <span className="italic underscore">wrong doctor</span> — for ten years.
            </h1>

            <div className="mag hero-lower">
              <div className="hero-copy">
                <p className="lede rise rise-2">
                  1 in 10 women spend <strong>7–10 years</strong> bounced between GI, urology, and primary care —
                  misrouted, while the answer sits unread in their own chart. Thaakat is the{' '}
                  <strong>voice-first front door</strong>: you talk, and before you ever see a doctor it charts the
                  conversation, deep-researches it against your whole history, and routes you to the right specialist
                  the first time.
                </p>

                <p className="hero-motto rise rise-3">
                  The answer was already there. <span className="sig">Thaakat routes you to it.</span>
                </p>

                <div className="hero-cta rise rise-3">
                  <a href="/intake" className="btn btn-lg">
                    <span>See the live demo</span>
                    <ArrowIcon />
                  </a>
                  <a href="#founders" className="tlink">
                    Meet the founders
                    <ArrowIcon />
                  </a>
                </div>

                <div className="hero-metaline meta rise rise-4">
                  Since 2026 <span className="sig">/</span> Built on FHIR R4 <span className="sig">/</span> Decision-support,
                  not diagnosis
                </div>
              </div>

              <figure className="hero-figure plate-fig rise rise-3">
                <div className="plate-frame">
                  <ScanPlate />
                </div>
                <figcaption className="plate-cap">
                  <span className="fno">Fig. 1</span>
                  <span>Pelvic MRI (T2) — the scan a routine read called “normal.” When a scan is part of the picture, Thaakat re-reads it and flags what a specialist should see.</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ===================== STORY — MEET MARIA ===================== */}
        <section className="section-tight" id="story">
          <div className="shell">
            <div className="runhead">
              <span className="no">A patient</span>
              <span>Why it takes a decade</span>
              <span className="ln" />
            </div>
            <div className="story">
              <p className="story-lead">For ten years, they told Maria her pain was normal.</p>
              <div className="story-body">
                <p>
                  A GP called it bad period cramps. A gastroenterologist called it IBS. A radiologist called her
                  ultrasound “unremarkable.” She was poked, scanned, and sent home — seven doctors, missing work every
                  month, while the child she’d been trying for never came. To finally get an answer, she’ll have to be{' '}
                  <em>cut open</em>: surgery is still the only way to confirm endometriosis.
                </p>
                <p>
                  Maria is a composite — but her story is the median. She is <strong>1 in 10 women — 190 million of
                  them</strong>, and the average one waits <strong>7–10 years</strong>, seeing seven doctors first.
                </p>
              </div>

              <div className="story-why">
                <div>
                  <span className="label-sig">Why there’s no early answer</span>
                  <h4>There is no non-invasive test.</h4>
                  <p>
                    No blood test, no scan that settles it. To confirm endometriosis a surgeon has to look inside — so
                    women wait years for a <strong>laparoscopy</strong> no one is quick to schedule, treated for
                    everything else in the meantime.
                  </p>
                </div>
                <div>
                  <span className="label-sig">Why the scan “looks normal”</span>
                  <h4>The early signal is written in texture.</h4>
                  <p>
                    Subtle changes a routine MRI or ultrasound read isn’t looking for. By the time it’s obvious to the
                    eye, it’s often years and lesions too late — yet the clues sat in her record the whole time.{' '}
                    <strong>Nobody’s job was to read them together.</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== 2 · THE PROBLEM + MARKET ===================== */}
        <section className="section" id="problem">
          <div className="shell">
            <SectionHeading
              index="№ 01"
              eyebrow="The problem"
              title={
                <>
                  The answer is usually already in the chart.
                  <br className="hide-sm" /> <span className="muted">No one’s job is to read it all together.</span>
                </>
              }
            />

            <p
              className="dropcap"
              style={{ marginTop: 34, maxWidth: '60ch', fontSize: 'clamp(1.15rem, 1.7vw, 1.4rem)', lineHeight: 1.5, color: 'var(--text-2)' }}
            >
              Diagnostic delay isn’t a knowledge problem — it’s an <span className="ink-flag">assembly problem</span>. The
              clues are documented across specialists, years apart, and nobody reads them together.
            </p>

            <div className="aside" style={{ marginTop: 32 }}>
              <span className="label-sig">Why the wait is so long</span>
              <h3>There is no non-invasive test. Surgery is the test.</h3>
              <p style={{ maxWidth: '74ch' }}>
                Confirming endometriosis means laparoscopy — so women wait 4–11 years for a surgeon to agree to cut.
                Meanwhile the disease’s early signal — subtle texture changes, diffuse heterogeneous patterns, early
                inflammation — sits <strong>unread</strong> on MRIs and ultrasounds they already had. That is exactly
                what radiomics catches and the human eye misses.
              </p>
            </div>

            <div className="spread" style={{ marginTop: 40 }}>
              <div className="spread-h">
                <span>Finding</span>
                <span>What the record already shows</span>
                <span>Source</span>
              </div>
              {STATS.map((s) => (
                <div key={s.source} className="spread-row">
                  <div className="spread-fig">{s.value}</div>
                  <div className="spread-txt">{s.label}</div>
                  <div className="spread-src">{s.source}</div>
                </div>
              ))}
            </div>

            <p className="sh-lede" style={{ marginTop: 28, maxWidth: '64ch' }}>
              Endometriosis affects roughly <strong style={{ color: 'var(--text)' }}>1 in 10 women — 190 million</strong>{' '}
              worldwide: the women’s-health beachhead into every delayed, under-read condition. Solve the longest,
              most-stigmatized odyssey first, then generalize.
            </p>
          </div>
        </section>

        {/* ================== 3 · THE SOLUTION + WORKFLOW ================== */}
        <section className="section" id="how">
          <div className="shell">
            <SectionHeading
              index="№ 02"
              eyebrow="The solution"
              title="A voice-first front door that triages you to the right specialist."
              lede="You talk; it charts the conversation, deep-researches it against your full history, and triages you to the right specialist the first time — the misrouting fix that's the difference between seven doctors and one. When a scan matters it re-reads it, then hands you an n=1 plan a human expert peer-reviews, and the cost — all before you see a doctor. Endometriosis is where we prove it: the hardest case, misrouted for a decade."
            />

            <div className="steps-ed" style={{ marginTop: 40 }}>
              {WORKFLOW.map((s) => (
                <div key={s.n} className="step-ed">
                  <span className="n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>

            <div className="views" style={{ marginTop: 44 }}>
              <div className="view">
                <div className="view-head">
                  <span className="label-sig">Patient app</span>
                  <span className="tag">what she experiences</span>
                </div>
                <ul className="view-list">
                  <li><CheckIcon /><span>Talk to Thaakat in plain language, any time — no forms, no gatekeeping.</span></li>
                  <li><CheckIcon /><span>See <b>her own record</b> assembled and explained, source by source.</span></li>
                  <li><CheckIcon /><span>Walk into the visit with the right questions already framed.</span></li>
                </ul>
              </div>
              <div className="view">
                <div className="view-head">
                  <span className="label-sig">Clinician console</span>
                  <span className="tag">what they buy</span>
                </div>
                <ul className="view-list">
                  <li><CheckIcon /><span>The <b>Dossier</b>: the whole record plus the re-read scan, every claim sourced.</span></li>
                  <li><CheckIcon /><span>One-click orders, prior authorization, and scheduling.</span></li>
                  <li><CheckIcon /><span>An outcomes &amp; ROI dashboard, written back to FHIR.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== 4 · CUSTOMERS (WHO PAYS) ===================== */}
        <section className="section" id="customers">
          <div className="shell">
            <SectionHeading
              index="№ 03"
              eyebrow="Who pays"
              title="We sell to whoever loses money on the odyssey."
              lede="Not fee-for-service doctors — they profit from repeat visits. We sell to the people who carry the cost of a decade-long search, and win when it ends sooner."
            />

            <div className="aside" style={{ marginTop: 34 }}>
              <span className="label-sig">The wedge</span>
              <h3>Beachhead: academic medical centers, women’s-health, fertility &amp; imaging clinics.</h3>
              <p style={{ maxWidth: '72ch' }}>
                They already run the MRI and transvaginal ultrasound Thaakat re-reads. They compete on outcomes and
                credibility, and a better-assembled, non-invasive workup pays for itself in a single avoided failed
                cycle — the kind of clear ROI that closes a pilot.
              </p>
              <div className="row wrap" style={{ gap: 8, marginTop: 18 }}>
                <span className="pill pill-signal">Start here</span>
                {BUYERS.map((b) => (
                  <span key={b} className="chip">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =================== 5 · BUSINESS MODEL / GTM =================== */}
        <section className="section" id="business">
          <div className="shell">
            <SectionHeading
              index="№ 04"
              eyebrow="Business model"
              title="Land as software. Grow into the standard."
              lede="A B2B clinical-decision-support SaaS. Pilot on the imaging clinics already run, prove it, publish it, and become the structured intelligence layer for endometriosis care."
            />

            <div className="metrics" style={{ marginTop: 42 }}>
              {MODEL.map((m) => (
                <div key={m.val} className="metric">
                  <div className="metric-val">{m.val}</div>
                  <div className="metric-label">{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40 }}>
              <span className="label-sig" style={{ display: 'block', marginBottom: 16 }}>
                The path — pilot to standard of care
              </span>
              <MarketExpansion />
            </div>

            <div style={{ marginTop: 40 }}>
              <span className="label-sig" style={{ display: 'block', marginBottom: 16 }}>
                What renews the contract
              </span>
              <div className="metrics">
                {METRICS.map((m) => (
                  <div key={m.val} className="metric">
                    <div className="metric-val">
                      {m.val}
                      <span className={`arw ${m.dir}`}>{m.dir === 'up' ? '▲' : '▼'}</span>
                    </div>
                    <div className="metric-label">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================== 6 · THE DEMO + THE TECH ================== */}
        <section className="section" id="tech">
          <div className="shell">
            <SectionHeading
              index="№ 05"
              eyebrow="The demo & the tech"
              title="Voice-first, and every sponsor doing real work."
              lede="Not a wrapper. Deepgram, Moss, Claude, Medplum, and Stedi each do real work in one run — the conversation becomes a real, auditable medical record, priced and ready for a specialist, before you ever see a doctor."
            />

            <div style={{ marginTop: 40 }}>
              <span className="label-sig" style={{ display: 'block', marginBottom: 16 }}>
                System architecture — every stage load-bearing
              </span>
              <ArchitectureFlow />
            </div>

            <div style={{ marginTop: 40 }}>
              <span className="label-sig" style={{ display: 'block', marginBottom: 6 }}>
                The model — real, trained, honestly reported
              </span>
              <ModelCard />
            </div>

            <div style={{ marginTop: 40 }}>
              <span className="label-sig" style={{ display: 'block', marginBottom: 16 }}>
                Clinical backing — grounded in the guidelines
              </span>
              <div style={{ borderTop: '1.5px solid var(--text)' }}>
                {CLINICAL_BACKING.map((c) => (
                  <div
                    key={c.src}
                    style={{ display: 'grid', gap: 6, padding: '18px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="label-sig">{c.src}</span>
                    <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15, lineHeight: 1.55, maxWidth: '78ch' }}>
                      {c.claim}
                    </p>
                  </div>
                ))}
              </div>
              <p className="meta" style={{ marginTop: 14 }}>
                Every figure sourced in <span className="sig">docs/EVIDENCE.md</span>
              </p>
            </div>

            <div className="row wrap" style={{ gap: 18, marginTop: 36 }}>
              <a href="/intake" className="btn">
                <span>See it work — the live demo</span>
                <ArrowIcon />
              </a>
              <span className="meta">
                Deepgram <span className="sig">/</span> Claude <span className="sig">/</span> Moss{' '}
                <span className="sig">/</span> Medplum <span className="sig">/</span> Stedi — all in one run
              </span>
            </div>
          </div>
        </section>

        {/* ================== 7 · HANDLING THE RECORD ================== */}
        <section className="section" id="handling">
          <div className="shell">
            <SectionHeading
              index="№ 06"
              eyebrow="Handling the record"
              title="A record worth assembling is a record worth protecting."
              lede="Thaakat reads a woman's whole medical history, which is exactly the kind of data that should never be casually handled. So the transport rules are set in code, not in a policy document."
            />

            <div className="spread" style={{ marginTop: 34 }}>
              <div className="spread-h">
                <span>Control</span>
                <span>What it means</span>
                <span>Where</span>
              </div>
              {HANDLING.map((h) => (
                <div key={h.control} className="spread-row handling-row">
                  <div className="handling-control">{h.control}</div>
                  <div className="spread-txt">{h.body}</div>
                  <div className="spread-src">{h.where}</div>
                </div>
              ))}
            </div>

            <div className="aside" style={{ marginTop: 32 }}>
              <span className="label-sig">On HIPAA, honestly</span>
              <h3>The technical safeguards are built. The paperwork is what a pilot buys.</h3>
              <p style={{ maxWidth: '76ch' }}>
                Compliance is usually retrofitted onto a product that was built without it, which is why it takes so
                long. We went the other way: the safeguards HIPAA asks for are already in the architecture. Encryption
                in transit and at rest, no keys in the browser, a real audit trail, and minimum-necessary access are all
                here now. What a first clinical pilot adds is contractual, not architectural:{' '}
                <strong>Business Associate Agreements</strong> with each vendor in the path, and the enterprise tiers
                that sign them.
              </p>
            </div>
          </div>
        </section>

        {/* ===================== 8 · MEET THE FOUNDERS ===================== */}
        <section className="section" id="founders">
          <div className="shell">
            <SectionHeading
              index="№ 07"
              eyebrow="Meet the founders"
              title="The rare team that can actually build this."
              lede="Voice, real-time retrieval, FHIR, and a trained imaging model — plus the lived research behind the moat."
            />

            {/*
              Both founders at Y Combinator. Sits above the cards rather than inside one, because
              it's a group photo — splitting it into a per-founder headshot would crop out the
              thing that makes it worth showing.
            */}
            <figure className="founders-photo">
              <img
                src="/founders/thaakat-founders-yc.jpg"
                alt="Azra Bano and Nityanth Maramreddy with teammates at the Y Combinator sign in San Francisco."
                width={1320}
                height={978}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                At Y&nbsp;Combinator, San Francisco. <strong>Azra</strong> seated at lower left,{' '}
                <strong>Nitu</strong> standing behind the sign at right.
              </figcaption>
            </figure>

            <div className="founders" style={{ marginTop: 40 }}>
              <FounderCard
                name="Azra Bano"
                role="Co-founder"
                initials="AB"
                bio={
                  <>
                    Repeat medtech founder (5×, <strong>~$7M raised</strong>). AI/ML researcher at Robert Wood Johnson
                    University Hospital, working on radiomics and MRI/ultrasound AI for cardio-gynecologic health. Her
                    research turns routine MRI and ultrasound into non-invasive endometriosis detection before surgery,
                    and Thaakat wraps that imaging work in a full agent. She has been building toward this problem for
                    years, not since Friday. Previously SWE at Google and a quant at Goldman Sachs; 1st place NASA
                    SpaceTech (international); quantum-ML at Columbia; Rutgers ECE + Math.
                  </>
                }
                highlights={[
                  'Radiomics / imaging AI',
                  '5× founder · ~$7M',
                  'ex-Google SWE',
                  'ex-Goldman quant',
                  'NASA SpaceTech 1st',
                  'Rutgers ECE + Math',
                ]}
                angle="I did the radiomics research on this. I know why women wait a decade."
              />

              <FounderCard
                name="Nityanth “Nitu” Maramreddy"
                role="Co-founder"
                initials="NM"
                bio={
                  <>
                    Neuroscience + CS at Rutgers (pre-med → tech). <strong>4× hackathon winner</strong>. Former product
                    intern at Star (YC S22) and former co-founder at Palura. He has built clinical voice agents before:{' '}
                    <strong>Meridian</strong>, an AI phone agent for clinics, won at Daytona’s SF hackathon alongside
                    Azra. Pre-med rigor, and he ships.
                  </>
                }
                highlights={[
                  'Clinical voice agents',
                  '4× hackathon wins',
                  'ex-Star (YC S22)',
                  'ex-Palura co-founder',
                  'Rutgers Neuro + CS',
                ]}
              />
            </div>

            <div className="aside" style={{ marginTop: 34 }}>
              <span className="label-sig">Why this team</span>
              <p style={{ marginTop: 12, maxWidth: '84ch', color: 'var(--text-2)' }}>
                Azra and Nitu met at <strong>Road to Silicon V/Alley</strong>, New Jersey’s largest entrepreneurship
                organization, where both rose to lead it. They flew across the country to SF hackathons together and won
                repeatedly, including healthcare voice agents (Meridian) and a Y&nbsp;Combinator reinforcement-learning
                hackathon. They’re now in SF full-time.
              </p>
              <p className="founder-angle">
                “We’ve already built healthcare voice AI together, and we win in YC’s own rooms.”
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
