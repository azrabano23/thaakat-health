'use client';

// Structural visuals for the launch page: the system architecture pipeline and
// the go-to-market expansion ladder. Pure presentational, responsive, no deps.
import type { ReactNode } from 'react';
import { Fragment } from 'react';
import {
  MicIcon,
  SparkIcon,
  BoltIcon,
  ScanIcon,
  RecordIcon,
  CoverageIcon,
} from './icons';

function cx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(' ');
}

type ArchNode = { name: string; role: string; icon: ReactNode; moat?: boolean; tag?: string; note: string };

const ARCH: ArchNode[] = [
  {
    name: 'Deepgram',
    role: 'Voice intake',
    icon: <MicIcon />,
    tag: 'listens',
    note: 'She just talks — no forms. Deepgram’s live Voice Agent transcribes with Nova-3 Medical (so it actually hears “CA-125” and “dyspareunia,” not gibberish), speaks back in a natural voice, and lets her interrupt. It captures the symptom story a rushed visit throws away.',
  },
  {
    name: 'Claude',
    role: 'Reasoning',
    icon: <SparkIcon />,
    tag: 'decides',
    note: 'The brain of the call. Claude chooses the next question, connects clues scattered across five specialists into one pattern, and turns the whole conversation into a structured medical record — using forced tool-use so it fills our exact schema instead of writing loose prose.',
  },
  {
    name: 'Moss',
    role: '<10 ms retrieval',
    icon: <BoltIcon />,
    tag: 'recalls',
    note: 'While she’s still mid-sentence, Thaakat searches her entire multi-year record. Moss answers in about 8 milliseconds — a normal cloud database (150–300 ms) would make that an awkward pause — so “tell me about that CA-125 nobody followed up” can land inside the conversation, not after it.',
  },
  {
    name: 'Radiomics',
    role: 'Re-reads the scan',
    icon: <ScanIcon />,
    moat: true,
    tag: 'the moat',
    note: 'The part no other team can copy in a weekend. A real trained model reads the *texture* of the MRI a radiologist called “normal” (GLCM + first-order features, AUC 0.966 on the real GLENDA dataset) and flags the deep-endometriosis and adenomyosis signs the human eye skips on a routine read. Investigational decision-support — it raises a question, never a diagnosis.',
  },
  {
    name: 'Medplum',
    role: 'FHIR · DetectedIssue',
    icon: <RecordIcon />,
    tag: 'writes',
    note: 'A finding a doctor can’t verify is worthless, so everything becomes real, auditable medical data. One atomic write creates 13 typed FHIR resources — headlined by a DetectedIssue authored by the radiomics “device,” with a Provenance trail proving each one was derived from her transcript. It’s a chart a real hospital system can ingest, not a chat log.',
  },
  {
    name: 'Stedi',
    role: 'Coverage',
    icon: <CoverageIcon />,
    tag: 'clears',
    note: 'Finding the answer isn’t enough if she can’t afford the next step. Stedi runs real insurance eligibility (the 270/271 exchange) to price the recommended test and check whether prior authorization is needed — so the run ends with a covered, scheduled step, not another “come back later.”',
  },
];

export function ArchitectureFlow() {
  return (
    <div className="arch" role="list" aria-label="Thaakat system architecture">
      {ARCH.map((n) => (
        <div key={n.name} className={cx('arch-node', n.moat && 'is-moat')} role="listitem">
          <span className="arch-ico">{n.icon}</span>
          <div className="arch-head">
            <span className="arch-name">{n.name}</span>
            <span className="arch-role">{n.role}</span>
            {n.tag && <span className="arch-tag">{n.tag}</span>}
          </div>
          <p className="arch-note">{n.note}</p>
        </div>
      ))}
    </div>
  );
}

type Stage = { label: string; who: string; tag?: string; beachhead?: boolean };

const STAGES: Stage[] = [
  {
    label: 'Academic medical centers',
    who: 'Pilot on the MRI and transvaginal ultrasound they already run. Where validation and credibility begin.',
    tag: 'Beachhead — start here',
    beachhead: true,
  },
  {
    label: 'Multi-site validation + publications',
    who: 'Prospective, cross-site results and peer-reviewed papers turn pilots into proof.',
  },
  {
    label: 'Enterprise licensing',
    who: 'Health systems and women’s-health, fertility, and imaging networks license per site.',
  },
  {
    label: 'Surgical planning · recurrence · trials',
    who: 'The same imaging intelligence expands into planning, monitoring, and trial patient-stratification.',
  },
];

export function MarketExpansion() {
  return (
    <div className="ladder" role="list" aria-label="Go-to-market expansion">
      {STAGES.map((s, i) => (
        <Fragment key={s.label}>
          <div className={cx('ladder-step', s.beachhead && 'is-beachhead')} role="listitem">
            <div className="ladder-top">
              <span className="ladder-idx">{String(i + 1).padStart(2, '0')}</span>
              {s.tag && <span className="ladder-tag">{s.tag}</span>}
            </div>
            <div className="ladder-label">{s.label}</div>
            <p className="ladder-who">{s.who}</p>
          </div>
          {i < STAGES.length - 1 && (
            <span className="ladder-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13.5" />
                <path d="m13 6.5 6 5.5-6 5.5" />
              </svg>
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
