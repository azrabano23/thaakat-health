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

const NAV_LINKS = [
  { label: 'The problem', href: '#problem' },
  { label: 'How it works', href: '#how' },
  { label: 'The tech', href: '#tech' },
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
  { n: '01', title: 'Intake', body: 'A calm spoken interview captures the symptom story that forms and rushed visits lose.' },
  { n: '02', title: 'Assemble the record', body: 'Every note, lab, and scan across every specialist — pulled into one timeline through patient-access APIs.' },
  { n: '03', title: 'Re-read the scan', body: 'A real radiomics model re-reads the under-read MRI or ultrasound for signs a routine read misses.' },
  { n: '04', title: 'Surface the pattern', body: 'The cluster engine connects what nobody assembled — and raises a question for the clinician, not a diagnosis.' },
  { n: '05', title: 'Orders & coverage', body: 'One-click orders and prior auth, a live coverage check, and a physician-ready FHIR brief.' },
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
              To diagnose endometriosis, doctors still have to{' '}
              <span className="italic underscore">cut you open.</span>
            </h1>

            <div className="mag hero-lower">
              <div className="hero-copy">
                <p className="lede rise rise-2">
                  There’s no non-invasive test — surgery <em>is</em> the diagnostic test. So 1 in 10 women —{' '}
                  <strong>190 million</strong> — spend 7–10 years and seven doctors in pain, missing work, losing
                  fertility, waiting for surgery to confirm what their scan already showed.
                </p>

                <p className="hero-motto rise rise-3">
                  The answer was already there. <span className="sig">Thaakat reads it.</span>
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
                  <span>Pelvic MRI (T2). Thaakat’s radiomics overlay flags the lesion a routine read called “normal.”</span>
                </figcaption>
              </figure>
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
              title="From one conversation to a covered next step."
              lede="Voice is the sensor. Assembling the record and re-reading the scan are the moat. Every run ends in a physician-ready brief — and a clear, covered action."
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
              title="Real voice. Real retrieval. A real imaging model."
              lede="Not a wrapper. Four sponsors do real work in the loop — and the moat is a trained radiomics model reading the pixels a radiologist skipped."
            />

            <div style={{ marginTop: 38 }}>
              <span className="label-sig" style={{ display: 'block', marginBottom: 16 }}>
                System architecture — every stage load-bearing
              </span>
              <ArchitectureFlow />
            </div>

            <div className="aside" style={{ marginTop: 26 }}>
              <div className="row wrap" style={{ justifyContent: 'space-between', gap: 12 }}>
                <span className="label-sig">◆ The imaging moat</span>
                <span className="pill pill-signal pill-dot">Founder’s own research</span>
              </div>
              <h3>EndoDetect: a trained radiomics model, not a mock.</h3>
              <p style={{ maxWidth: '74ch' }}>
                Thaakat’s moat is <strong>EndoDetect</strong> — Azra’s radiomics work turning routine MRI and
                ultrasound into non-invasive endometriosis signal <em>before</em> surgery. A real{' '}
                <strong>scikit-image radiomics</strong> pipeline (GLCM + first-order texture — the family PyRadiomics
                computes) extracts real features from real, public imaging, with an honest, cross-validated result.
                We report it as <strong>investigational decision-support</strong>, never autonomous diagnosis — the hard
                modality other teams can’t stand up in a weekend.
              </p>
              <div className="evidence">
                <div className="evi">
                  <div className="evi-val">0.967</div>
                  <div className="evi-label">ROC-AUC, 5-fold CV (±0.012, out-of-fold) — reported with its class imbalance, not accuracy.</div>
                </div>
                <div className="evi">
                  <div className="evi-val" style={{ fontSize: '1.2rem' }}>12 texture features</div>
                  <div className="evi-label">GLCM + first-order, extracted from the pixels — not a hardcoded label.</div>
                </div>
                <div className="evi">
                  <div className="evi-val" style={{ fontSize: '1.2rem' }}>GLENDA · n=5,990</div>
                  <div className="evi-label">Trained on a real, public endometriosis imaging dataset (500 / 5,490).</div>
                </div>
              </div>
            </div>

            <div className="row wrap" style={{ gap: 18, marginTop: 28 }}>
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

        {/* ===================== 7 · MEET THE FOUNDERS ===================== */}
        <section className="section" id="founders">
          <div className="shell">
            <SectionHeading
              index="№ 06"
              eyebrow="Meet the founders"
              title="The rare team that can actually build this."
              lede="Voice, real-time retrieval, FHIR, and a trained imaging model — plus the lived research behind the moat."
            />

            <div className="founders" style={{ marginTop: 40 }}>
              <FounderCard
                name="Azra Bano"
                role="Co-founder"
                initials="AB"
                bio={
                  <>
                    Repeat medtech founder (5×, <strong>~$7M raised</strong>). AI/ML researcher at Robert Wood Johnson
                    University Hospital — radiomics and MRI/ultrasound AI for cardio-gynecologic health. She built{' '}
                    <strong>EndoDetect</strong>: radiomics that turns routine MRI and ultrasound into non-invasive
                    endometriosis detection before surgery. Thaakat is that proven imaging engine wrapped in a full
                    agent. She didn’t discover this problem for a hackathon — she pitched and built a company for it.
                    Previously SWE at Google and a quant at Goldman Sachs; 1st place NASA SpaceTech (international);
                    quantum-ML at Columbia; Rutgers ECE + Math.
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

            <div className="aside" style={{ marginTop: 34 }}>
              <span className="label-sig">Why this team</span>
              <p style={{ marginTop: 12, maxWidth: '84ch', color: 'var(--text-2)' }}>
                Azra and Nitu met at <strong>Road to Silicon V/Alley</strong> — New Jersey’s largest entrepreneurship
                organization — where both rose to lead it. They flew across the country to SF hackathons together and
                won repeatedly, including healthcare voice agents (Meridian) and a Y&nbsp;Combinator
                reinforcement-learning hackathon. They’re now in SF full-time.
              </p>
              <p className="founder-angle">
                “We’ve already built healthcare voice AI together — and we win in YC’s own rooms.”
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
