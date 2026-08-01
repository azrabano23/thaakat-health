import {
  Nav,
  Footer,
  Button,
  Pill,
  StatTile,
  SectionHeading,
  HeroVisual,
  FounderCard,
  ArchitectureFlow,
  MarketExpansion,
  ArrowIcon,
  CheckIcon,
  MicIcon,
  AssembleIcon,
  ScanIcon,
  PatternIcon,
  OrdersIcon,
  ClinicIcon,
  TrendIcon,
} from '@/components/ui';

const NAV_LINKS = [
  { label: 'The problem', href: '#problem' },
  { label: 'How it works', href: '#how' },
  { label: 'The tech', href: '#tech' },
  { label: 'Founders', href: '#founders' },
];

const STATS = [
  { value: '88%', label: 'of diagnoses changed when one specialist re-read the whole chart.', source: 'Mayo Clinic' },
  { value: '1 in 3', label: 'missed cancers had the red flag already documented in the record.', source: 'Diagnostic-error research' },
  { value: '795K', label: 'Americans seriously harmed by a diagnostic error every year.', source: 'Johns Hopkins · BMJ' },
  { value: '7–10 yrs', label: 'and 7+ doctors — the average wait for an endometriosis diagnosis.', source: 'Endometriosis research' },
];

const WORKFLOW = [
  { n: '01', icon: <MicIcon />, title: 'Intake', body: 'A calm spoken interview captures the symptom story that forms and rushed visits lose.' },
  { n: '02', icon: <AssembleIcon />, title: 'Assemble the record', body: 'Every note, lab, and scan across every specialist — pulled into one timeline through patient-access APIs.' },
  { n: '03', icon: <ScanIcon />, title: 'Re-read the scan', body: 'A real radiomics model re-reads the under-read MRI or ultrasound for signs a routine read misses.' },
  { n: '04', icon: <PatternIcon />, title: 'Surface the pattern', body: 'The cluster engine connects what nobody assembled — and raises a question for the clinician, not a diagnosis.' },
  { n: '05', icon: <OrdersIcon />, title: 'Orders & coverage', body: 'One-click orders and prior auth, a live coverage check, and a physician-ready FHIR brief.' },
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

export default function Home() {
  return (
    <>
      <div className="bg-field" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      <Nav links={NAV_LINKS} cta={{ label: 'See the demo', href: '/intake' }} />

      <main>
        {/* ============================ 1 · HERO ============================ */}
        <section className="section hero" id="top">
          <div className="hero-sidenote" aria-hidden="true">
            <span className="sidenote">Thaakat · نور · light</span>
          </div>
          <div className="shell">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow rise rise-1">Thaakat — bringing it to light</span>

                <h1 className="display display-lg rise rise-2" style={{ marginTop: 18 }}>
                  To diagnose endometriosis, doctors still have to{' '}
                  <span className="text-lume">cut you open.</span>
                </h1>

                <p className="lede rise rise-2">
                  There’s no non-invasive test — surgery <em>is</em> the diagnostic test. So 1 in 10 women —{' '}
                  <strong>190 million</strong> — spend 7–10 years and seven doctors in pain, missing work, losing
                  fertility, waiting for surgery to confirm what their scan already showed.
                </p>

                <p className="hero-motto rise rise-3">
                  The answer was already there. <span className="text-gold">Thaakat reads it.</span>
                </p>

                <div className="hero-cta rise rise-3">
                  <Button href="/intake" variant="gold" size="lg" trailingIcon={<ArrowIcon />}>
                    See the live demo
                  </Button>
                  <Button href="#founders" variant="outline" size="lg">
                    Meet the founders
                  </Button>
                </div>

                <div className="hero-meta rise rise-4">
                  <Pill dot>Since 2026</Pill>
                  <Pill>Built on FHIR R4</Pill>
                  <Pill tone="gold">Decision-support, not diagnosis</Pill>
                </div>
              </div>

              <div className="hero-visual rise rise-3">
                <HeroVisual />
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
                  <br className="hide-sm" /> <span className="text-muted">No one’s job is to read it all together.</span>
                </>
              }
            />

            <p className="pull" style={{ marginTop: 34 }}>
              Diagnostic delay isn’t a knowledge problem — it’s an <span className="text-gold">assembly problem</span>.
              The clues are documented across specialists, years apart, and nobody reads them together.
            </p>

            <div className="card card-lg card-gold" style={{ marginTop: 30 }}>
              <span className="label-gold">Why the wait is so long</span>
              <h3>There is no non-invasive test. Surgery is the test.</h3>
              <p style={{ maxWidth: '74ch' }}>
                Confirming endometriosis means laparoscopy — so women wait 4–11 years for a surgeon to agree to cut.
                Meanwhile the disease’s early signal — subtle texture changes, diffuse heterogeneous patterns, early
                inflammation — sits <strong>unread</strong> on MRIs and ultrasounds they already had. That is exactly
                what radiomics catches and the human eye misses.
              </p>
            </div>

            <div className="card-glass" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: 22 }}>
              <div className="stat-divide">
                {STATS.map((s) => (
                  <StatTile key={s.source} value={s.value} label={s.label} source={s.source} />
                ))}
              </div>
            </div>

            <p className="sh-lede" style={{ marginTop: 26, maxWidth: '64ch' }}>
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
              title="From one conversation to a covered next step."
              lede="Voice is the sensor. Assembling the record and re-reading the scan are the moat. Every run ends in a physician-ready brief — and a clear, covered action."
            />

            <div className="rail" style={{ marginTop: 40 }}>
              {WORKFLOW.map((s) => (
                <div key={s.n} className="card card-hover step">
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>

            <div className="views" style={{ marginTop: 22 }}>
              <div className="card card-lg">
                <div className="view-head">
                  <Pill tone="gold" dot>
                    Patient app
                  </Pill>
                  <span className="badge">what she experiences</span>
                </div>
                <ul className="view-list">
                  <li><CheckIcon /><span>Talk to Thaakat in plain language, any time — no forms, no gatekeeping.</span></li>
                  <li><CheckIcon /><span>See <b>her own record</b> assembled and explained, source by source.</span></li>
                  <li><CheckIcon /><span>Walk into the visit with the right questions already framed.</span></li>
                </ul>
              </div>
              <div className="card card-lg">
                <div className="view-head">
                  <Pill dot>Clinician console</Pill>
                  <span className="badge">what they buy</span>
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

            <div className="card card-lg" style={{ marginTop: 36, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span className="step-icon" style={{ margin: 0 }}>
                <ClinicIcon />
              </span>
              <div style={{ flex: '1 1 320px' }}>
                <div className="row wrap" style={{ gap: 10, marginBottom: 8 }}>
                  <strong style={{ fontSize: 16 }}>Beachhead: academic medical centers &amp; women’s-health, fertility, and imaging clinics.</strong>
                  <Pill tone="gold">Start here</Pill>
                </div>
                <p className="muted" style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.6, maxWidth: '70ch' }}>
                  They already run the MRI and transvaginal ultrasound Thaakat re-reads. They compete on outcomes and
                  credibility, and a better-assembled, non-invasive workup pays for itself in a single avoided failed
                  cycle — the kind of clear ROI that closes a pilot.
                </p>
                <div className="row wrap" style={{ gap: 8 }}>
                  {BUYERS.map((b) => (
                    <span key={b} className="chip">
                      {b}
                    </span>
                  ))}
                </div>
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

            <div className="metrics" style={{ marginTop: 40 }}>
              {MODEL.map((m) => (
                <div key={m.val} className="metric">
                  <div className="metric-val">{m.val}</div>
                  <div className="metric-label">{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 34 }}>
              <span className="label-gold" style={{ display: 'block', marginBottom: 14 }}>
                The path — pilot to standard of care
              </span>
              <MarketExpansion />
            </div>

            <div style={{ marginTop: 34 }}>
              <span className="label-gold" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <span className="step-icon" style={{ margin: 0, width: 30, height: 30, borderRadius: 9 }}>
                  <TrendIcon />
                </span>
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
              title="Real voice. Real retrieval. A real imaging model."
              lede="Not a wrapper. Four sponsors do real work in the loop — and the moat is a trained radiomics model reading the pixels a radiologist skipped."
            />

            <div style={{ marginTop: 36 }}>
              <span className="label-gold" style={{ display: 'block', marginBottom: 16 }}>
                System architecture — every stage load-bearing
              </span>
              <ArchitectureFlow />
            </div>

            <div className="card cluster" style={{ marginTop: 24 }}>
              <div className="cluster-head">
                <span className="eyebrow" style={{ margin: 0 }}>
                  <span className="num">◆</span> The imaging moat
                </span>
                <Pill tone="gold" dot>
                  Founder’s own research
                </Pill>
              </div>
              <h3 style={{ marginTop: 14 }}>EndoDetect: a trained radiomics model, not a mock.</h3>
              <p className="cluster-narr" style={{ maxWidth: '72ch' }}>
                Thaakat’s moat is <strong style={{ color: 'var(--text)' }}>EndoDetect</strong> — Azra’s radiomics model
                that turns routine MRI and ultrasound into non-invasive endometriosis detection <em>before</em> surgery.
                A real <strong style={{ color: 'var(--text)' }}>PyRadiomics</strong> pipeline extracts real features
                from real, public imaging data, with an honest, cross-validated result — the hard modality other teams
                can’t stand up in a weekend.
              </p>
              <div className="evidence" style={{ marginTop: 20 }}>
                <div className="evi">
                  <div className="evi-val pending">AUC {"0.967 AUC (5-fold CV)"}</div>
                  <div className="evi-label">Cross-validated on held-out imaging — reported honestly.</div>
                </div>
                <div className="evi">
                  <div className="evi-val">PyRadiomics</div>
                  <div className="evi-label">Real features extracted from the pixels, not a hardcoded label.</div>
                </div>
                <div className="evi">
                  <div className="evi-val pending">{"GLENDA (real endometriosis, n=5,990)"}</div>
                  <div className="evi-label">Trained on real, public imaging data.</div>
                </div>
              </div>
            </div>

            <div className="row wrap" style={{ gap: 12, marginTop: 26 }}>
              <Button href="/intake" variant="gold" trailingIcon={<ArrowIcon />}>
                See it work — the live demo
              </Button>
              <span className="muted" style={{ fontSize: 13.5, alignSelf: 'center' }}>
                Deepgram · Claude · Moss · Medplum · Stedi — all four sponsors, in one run.
              </span>
            </div>
          </div>
        </section>

        {/* ===================== 7 · MEET THE FOUNDERS ===================== */}
        <section className="section" id="founders">
          <div className="shell">
            <SectionHeading
              index="№ 06"
              eyebrow="Meet the founders"
              title="The rare team that can actually build this."
              lede="Voice, real-time retrieval, FHIR, and a trained imaging model — plus the lived research behind the moat."
            />

            <div className="founders" style={{ marginTop: 36 }}>
              <FounderCard
                name="Azra Bano"
                role="Co-founder"
                initials="AB"
                bio={
                  <>
                    Repeat medtech founder (5×, <strong>~$7M raised</strong>). AI/ML researcher at Robert Wood Johnson
                    University Hospital — radiomics and MRI/ultrasound AI for cardio-gynecologic health. She built{' '}
                    <strong>EndoDetect</strong>: radiomics that turns routine MRI and ultrasound into non-invasive
                    endometriosis detection before surgery. Thaakat is that proven imaging engine wrapped in a full agent.
                    She didn’t discover this problem for a hackathon — she pitched and built a company for it. Previously
                    SWE at Google and a quant at Goldman Sachs; 1st place NASA SpaceTech (international); quantum-ML at
                    Columbia; Rutgers ECE + Math.
                  </>
                }
                highlights={[
                  'EndoDetect',
                  'Radiomics / imaging AI',
                  '5× founder · ~$7M',
                  'ex-Google SWE',
                  'ex-Goldman quant',
                  'NASA SpaceTech 1st',
                  'Rutgers ECE + Math',
                ]}
                angle="I did the radiomics research on this — I know why women wait a decade."
              />

              <FounderCard
                name="Nityanth “Nitu” Maramreddy"
                role="Co-founder"
                initials="NM"
                bio={
                  <>
                    Neuroscience + CS at Rutgers (pre-med → tech). <strong>4× hackathon winner</strong>. Former product
                    intern at Star (YC S22) and former co-founder at Palura. He’s built clinical voice agents before —{' '}
                    <strong>Meridian</strong>, an AI phone agent for clinics, won at Daytona’s SF hackathon alongside
                    Azra. Pre-med rigor and a builder who ships.
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

            <div className="card card-lg card-gold" style={{ marginTop: 18 }}>
              <span className="label-gold">Why this team</span>
              <p style={{ marginTop: 10, maxWidth: '82ch' }}>
                Azra and Nitu met at <strong>Road to Silicon V/Alley</strong> — New Jersey’s largest entrepreneurship
                organization — where both rose to lead it. They flew across the country to SF hackathons together and won
                repeatedly, including healthcare voice agents (Meridian) and a Y&nbsp;Combinator reinforcement-learning
                hackathon. They’re now in SF full-time.
              </p>
              <p className="founder-angle" style={{ borderTop: 'none', paddingTop: 8, marginTop: 12 }}>
                “We’ve already built healthcare voice AI together — and we win in YC’s own rooms.”
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
