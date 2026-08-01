// Inline SVG icon set for Thaakat. Line icons, currentColor, size via font-size (1em)
// unless a parent class constrains them. No external assets.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (p: IconProps) => ({
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

/* Brand mark — an aperture of light (lens/scan + radiance). Uses its own
   gradient so it glows gold regardless of surrounding color. */
export function ThaakatMark({ className, ...p }: { className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="100%"
      height="100%"
      fill="none"
      className={className}
      aria-hidden="true"
      {...p}
    >
      <defs>
        <linearGradient id="noorMark" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe0a3" />
          <stop offset="0.55" stopColor="#f6cd77" />
          <stop offset="1" stopColor="#d7a24c" />
        </linearGradient>
        <radialGradient id="noorCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="1" stopColor="#f6cd77" />
        </radialGradient>
      </defs>
      {/* outer ring */}
      <circle cx="24" cy="24" r="18" stroke="url(#noorMark)" strokeWidth="1.6" opacity="0.9" />
      {/* aperture: two offset hexagons */}
      <polygon
        points="24,9 37,16.5 37,31.5 24,39 11,31.5 11,16.5"
        stroke="url(#noorMark)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <polygon
        points="14.7,17.2 33.3,17.2 38.6,26 29.3,34.8 18.7,34.8 9.4,26"
        stroke="url(#noorMark)"
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* luminous core */}
      <circle cx="24" cy="24" r="5.2" fill="url(#noorCore)" />
      <circle cx="24" cy="24" r="8.4" stroke="url(#noorMark)" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 5.5 18 12 7 18.5V5.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12h13.5" />
      <path d="m13 6.5 6 5.5-6 5.5" />
    </svg>
  );
}

/* Step 1 — Assemble the record: scattered documents merging into one. */
export function AssembleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="4" width="9" height="12" rx="1.6" opacity="0.55" />
      <rect x="7.5" y="7" width="9" height="12" rx="1.6" opacity="0.8" />
      <path d="M11.5 11.5h3M11.5 14.5h4.5" />
    </svg>
  );
}

/* Step 2 — Re-read the scan (radiomics): a focus reticle with a spark. */
export function ScanIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 7.6v-1M12 17.4v-1M7.6 12h-1M17.4 12h-1" opacity="0.7" />
    </svg>
  );
}

/* Step 3 — Surface the pattern: connected nodes (a cluster). */
export function PatternIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 7.5 12 12l5-4M7 16.5 12 12" opacity="0.75" />
      <circle cx="6" cy="6.5" r="2.1" />
      <circle cx="18" cy="6.5" r="2.1" />
      <circle cx="6" cy="17.5" r="2.1" />
      <circle cx="13" cy="12.5" r="2.4" fill="currentColor" fillOpacity="0.16" />
    </svg>
  );
}

/* Step 4 — Check coverage: shield + check. */
export function CoverageIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5 19 6v5.4c0 4.3-2.9 7.3-7 8.6-4.1-1.3-7-4.3-7-8.6V6l7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

/* Small check / dot glyphs used in copy */
export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  );
}

/* Voice intake — microphone */
export function MicIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M9 21h6" />
    </svg>
  );
}

/* Claude reasoning — spark / node */
export function SparkIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3c.6 3.6 1.8 4.8 5.4 5.4C13.8 9 12.6 10.2 12 13.8 11.4 10.2 10.2 9 6.6 8.4 10.2 7.8 11.4 6.6 12 3Z" fill="currentColor" fillOpacity="0.14" />
      <path d="M18.5 14.2c.28 1.5.78 2 2.3 2.3-1.52.3-2.02.8-2.3 2.3-.28-1.5-.78-2-2.3-2.3 1.52-.3 2.02-.8 2.3-2.3Z" />
    </svg>
  );
}

/* Moss retrieval — bolt (fast) */
export function BoltIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M13 3 5 13.5h5.5L10 21l8-10.5h-5.5L13 3Z" />
    </svg>
  );
}

/* Medplum FHIR record — branching record */
export function RecordIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="4" y="3.5" width="10.5" height="17" rx="2" />
      <path d="M7.5 8h4M7.5 11.5h4M7.5 15h2.5" opacity="0.8" />
      <path d="M14.5 7.5h3.2a1.8 1.8 0 0 1 1.8 1.8v8.4" />
      <circle cx="19.5" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Orders / one-click actions — clipboard + check */
export function OrdersIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3.6A1.1 1.1 0 0 1 10.1 2.5h3.8A1.1 1.1 0 0 1 15 3.6v.9" />
      <path d="m8.8 12.4 1.9 1.9 3.9-3.9" />
    </svg>
  );
}

/* Outcomes / ROI — trending up */
export function TrendIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 15.5 9.5 10l3 3L20 5.5" />
      <path d="M15 5.5h5v5" />
    </svg>
  );
}

/* Customers / clinic — building */
export function ClinicIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20.5V6.5l8-3 8 3v14" />
      <path d="M3 20.5h18" />
      <path d="M12 8.5v4M10 10.5h4" />
      <path d="M9 20.5v-4h6v4" />
    </svg>
  );
}
