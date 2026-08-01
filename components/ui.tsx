'use client';

// Thaakat UI kit — clean, typed, presentational components.
// Import from '@/components/ui'. Marked 'use client' so it drops into both the
// server landing page and the client product page without RSC friction.
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import {
  ThaakatMark,
  PlayIcon,
  ArrowIcon,
  AssembleIcon,
  ScanIcon,
  PatternIcon,
  CoverageIcon,
} from './icons';

/* ============================================================================
   Product data types — match the demo engine exactly (lib/clusters.ts).
   Do not change these shapes; they are what the product page passes in.
   ========================================================================== */

export type Finding = {
  id: string;
  label: string;
  detail: string;
  specialty: string;
  date: string;
  source: string;
  tags: string[];
  orphaned?: boolean;
  fromImaging?: boolean;
};

export type ClusterMatch = {
  cluster: {
    id: string;
    name: string;
    narration: string;
    ask: string;
    confirmatory: { name: string; cptCode?: string };
  };
  matched: string[];
  confidence: number;
};

export type Turn = { role: 'patient' | 'thaakat'; text: string };

export type Coverage = {
  active?: boolean;
  copay?: number | string;
  priorAuthRequired?: string; // 'Y' | 'N' | 'U'
  payer?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/* ============================================================================
   Button
   ========================================================================== */

export type ButtonProps = {
  variant?: 'solid' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  style?: CSSProperties;
  target?: string;
  rel?: string;
  'aria-label'?: string;
  children: ReactNode;
};

export function Button({
  variant = 'solid',
  size = 'md',
  href,
  onClick,
  disabled,
  icon,
  trailingIcon,
  className,
  style,
  target,
  rel,
  children,
  ...rest
}: ButtonProps) {
  const cls = cx(
    'btn',
    variant === 'gold' && 'btn-gold',
    variant === 'outline' && 'btn-outline',
    variant === 'ghost' && 'btn-ghost',
    size === 'lg' && 'btn-lg',
    size === 'sm' && 'btn-sm',
    className,
  );
  const inner = (
    <>
      {icon}
      <span>{children}</span>
      {trailingIcon}
    </>
  );

  if (href && !disabled) {
    const external = /^(https?:|#|mailto:|tel:)/.test(href);
    if (external) {
      return (
        <a className={cls} href={href} target={target} rel={rel} style={style} {...rest}>
          {inner}
        </a>
      );
    }
    return (
      <Link className={cls} href={href} style={style} {...rest}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style} {...rest}>
      {inner}
    </button>
  );
}

/* ============================================================================
   IconButton
   ========================================================================== */

export function IconButton({
  children,
  href,
  onClick,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  'aria-label': string;
}) {
  const cls = cx('iconbtn', className);
  if (href) {
    return (
      <a className={cls} href={href} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

/* ============================================================================
   Pill / Badge
   ========================================================================== */

export function Pill({
  children,
  tone = 'default',
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'gold' | 'good' | 'warn';
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'pill',
        dot && 'pill-dot',
        tone === 'gold' && 'pill-gold',
        tone === 'good' && 'pill-good',
        tone === 'warn' && 'pill-warn',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('badge', className)}>{children}</span>;
}

/* ============================================================================
   Card
   ========================================================================== */

export function Card({
  children,
  glass = false,
  lg = false,
  hover = false,
  className,
  style,
}: {
  children: ReactNode;
  glass?: boolean;
  lg?: boolean;
  hover?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cx('card', lg && 'card-lg', glass && 'card-glass', hover && 'card-hover', className)}
      style={style}
    >
      {children}
    </div>
  );
}

/* ============================================================================
   StatTile
   ========================================================================== */

export function StatTile({
  value,
  label,
  source,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  source?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('stat', className)}>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
      {source && <div className="stat-source">{source}</div>}
    </div>
  );
}

/* ============================================================================
   SectionHeading
   ========================================================================== */

export function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
  className,
}: {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('sh', className)}>
      {(eyebrow || index) && (
        <span className="eyebrow">
          {index && <span className="num">{index}</span>}
          {eyebrow}
        </span>
      )}
      <h2 className="display display-lg">{title}</h2>
      {lede && <p className="sh-lede">{lede}</p>}
    </div>
  );
}

/* ============================================================================
   Nav
   ========================================================================== */

export function Nav({
  links = [
    { label: 'How it works', href: '#how' },
    { label: 'The problem', href: '#problem' },
    { label: 'Built on', href: '#builton' },
  ],
  cta = { label: 'Try the demo', href: '/intake' },
}: {
  links?: { label: string; href: string }[];
  cta?: { label: string; href: string };
}) {
  return (
    <nav className="nav">
      <div className="shell">
        <div className="nav-inner">
          <Link href="/" className="brand" aria-label="Thaakat — home">
            <span className="brand-mark">
              <ThaakatMark />
            </span>
            <span className="stack" style={{ lineHeight: 1.05 }}>
              <span className="brand-word">Thaakat</span>
              <span className="brand-sub">Diagnostic navigator</span>
            </span>
          </Link>

          <div className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="nav-link">
                {l.label}
              </a>
            ))}
          </div>

          <Button href={cta.href} variant="gold" size="sm" trailingIcon={<ArrowIcon />}>
            {cta.label}
          </Button>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================================
   Footer
   ========================================================================== */

const BUILT_ON = ['Medplum', 'Deepgram', 'Moss', 'Stedi'];

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-inner">
          <div>
            <Link href="/" className="brand" style={{ marginBottom: 16 }}>
              <span className="brand-mark">
                <ThaakatMark />
              </span>
              <span className="brand-word">Thaakat</span>
            </Link>
            <p className="footer-motto">The answer was already there.</p>
            <p className="disclaimer">
              Thaakat is <strong style={{ color: 'var(--text-2)' }}>decision-support and navigation, not diagnosis</strong>.
              It surfaces documented findings and a recognized cluster as a question for a clinician — it never
              names a condition to a patient. Demonstrated on synthetic data only.
            </p>
          </div>
          <div className="stack" style={{ gap: 16 }}>
            <div className="stack" style={{ gap: 8 }}>
              <span className="fine">Built on</span>
              <div className="row wrap" style={{ gap: 8 }}>
                {BUILT_ON.map((b) => (
                  <span key={b} className="pill">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <span className="fine">نور · light</span>
            <span className="fine" style={{ color: 'var(--gold-deep)' }}>YC × Medplum · 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================================
   PRODUCT — Record timeline (the assembled chart)
   ========================================================================== */

export function RecordTimeline({ record }: { record: Finding[] }) {
  return (
    <div className="timeline">
      {record.map((f) => (
        <div
          key={f.id}
          className={cx('tl-item', f.orphaned && 'is-orphan', f.fromImaging && 'is-imaging')}
        >
          <span className="tl-dot" />
          <div className="tl-meta">
            <span>{f.date}</span>
            <span className="sep">·</span>
            <span>{f.specialty}</span>
            {f.orphaned && <span className="tl-flag warn">· never followed up</span>}
            {f.fromImaging && <span className="tl-flag gold">· surfaced by Thaakat</span>}
          </div>
          <div className="tl-label">{f.label}</div>
          <p className="tl-detail">{f.detail}</p>
          <p className="tl-source">source: {f.source}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   PRODUCT — Cluster card (the pattern nobody assembled)
   ========================================================================== */

export function ClusterCard({ match, coverage }: { match: ClusterMatch; coverage?: Coverage }) {
  const pct = Math.round(match.confidence * 100);
  const pa = coverage?.priorAuthRequired === 'Y';
  return (
    <div className="cluster">
      <div className="cluster-head">
        <span className="eyebrow" style={{ margin: 0 }}>
          <span className="num">◆</span> Pattern nobody assembled
        </span>
        <span className="cluster-conf">
          <span className="cluster-meter">
            <span style={{ width: `${pct}%` }} />
          </span>
          <span className="text-gold" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 650, fontSize: 13 }}>
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
            Suggested confirmatory step: <strong style={{ color: 'var(--text)' }}>{match.cluster.confirmatory.name}</strong>
            {match.cluster.confirmatory.cptCode && (
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}> · CPT {match.cluster.confirmatory.cptCode}</span>
            )}
          </p>
        )}
      </div>

      {coverage && (
        <div className="cluster-block">
          <span className="lbl">The Cost</span>
          <div className="cluster-cost">
            <span className={coverage.active ? 'good' : 'bad'} style={{ fontWeight: 650 }}>
              {coverage.active ? 'Covered' : 'Not covered'}
            </span>
            {coverage.copay != null && coverage.copay !== '' && (
              <span className="muted">~${coverage.copay} out of pocket</span>
            )}
            {pa && <Pill tone="warn">prior auth started</Pill>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PRODUCT — Conversation panel (voice interview)
   ========================================================================== */

export function ConversationPanel({ turns }: { turns: Turn[] }) {
  return (
    <div className="convo">
      {turns.map((t, i) => (
        <div key={i} className={cx('convo-row', t.role)}>
          <div className={cx('bubble', t.role === 'patient' ? 'bubble-patient' : 'bubble-thaakat')}>
            <span className="bubble-who">{t.role === 'patient' ? 'Patient' : 'Thaakat'}</span>
            {t.text}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Founder card
   ========================================================================== */

export function FounderCard({
  name,
  role,
  initials,
  bio,
  highlights,
  angle,
  pending = false,
}: {
  name: string;
  role: string;
  initials?: string;
  bio?: ReactNode;
  highlights?: string[];
  angle?: string;
  pending?: boolean;
}) {
  return (
    <div className={cx('founder', pending && 'is-pending')}>
      <div className="founder-head">
        <span className="founder-avatar" aria-hidden="true">
          {initials ?? name.slice(0, 1)}
        </span>
        <div className="stack" style={{ gap: 3 }}>
          <span className="founder-name">{name}</span>
          <span className="founder-role">{role}</span>
        </div>
      </div>
      {bio && <p className="founder-bio">{bio}</p>}
      {highlights && highlights.length > 0 && (
        <div className="founder-chips">
          {highlights.map((h) => (
            <span key={h} className="chip">
              {h}
            </span>
          ))}
        </div>
      )}
      {angle && <p className="founder-angle">“{angle}”</p>}
    </div>
  );
}

/* ============================================================================
   Re-exports (barrel) — icons, hero visual, diagrams from '@/components/ui'
   ========================================================================== */

export {
  ThaakatMark,
  PlayIcon,
  ArrowIcon,
  CheckIcon,
  AssembleIcon,
  ScanIcon,
  PatternIcon,
  CoverageIcon,
  MicIcon,
  SparkIcon,
  BoltIcon,
  RecordIcon,
  OrdersIcon,
  TrendIcon,
  ClinicIcon,
} from './icons';
export { HeroVisual } from './HeroVisual';
export { ArchitectureFlow, MarketExpansion } from './diagrams';
