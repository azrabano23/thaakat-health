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

type ArchNode = { name: string; role: string; icon: ReactNode; moat?: boolean; tag?: string };

const ARCH: ArchNode[] = [
  { name: 'Deepgram', role: 'Voice intake', icon: <MicIcon />, tag: 'listens' },
  { name: 'Claude', role: 'Reasoning', icon: <SparkIcon />, tag: 'decides' },
  { name: 'Moss', role: '<10ms retrieval', icon: <BoltIcon />, tag: 'recalls' },
  { name: 'Radiomics', role: 'Re-reads the scan', icon: <ScanIcon />, moat: true, tag: 'the moat' },
  { name: 'Medplum', role: 'FHIR · DetectedIssue', icon: <RecordIcon />, tag: 'writes' },
  { name: 'Stedi', role: 'Coverage', icon: <CoverageIcon />, tag: 'clears' },
];

export function ArchitectureFlow() {
  return (
    <div className="arch" role="list" aria-label="Thaakat system architecture">
      {ARCH.map((n, i) => (
        <Fragment key={n.name}>
          <div className={cx('arch-node', n.moat && 'is-moat')} role="listitem">
            {n.tag && <span className="arch-tag">{n.tag}</span>}
            <span className="arch-ico">{n.icon}</span>
            <span className="arch-name">{n.name}</span>
            <span className="arch-role">{n.role}</span>
          </div>
          {i < ARCH.length - 1 && (
            <span className="arch-link" aria-hidden="true">
              <span className="arch-pulse" />
            </span>
          )}
        </Fragment>
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
