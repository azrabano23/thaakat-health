// The hero figure: an abstract grayscale pelvic-MRI cross-section with a
// radiomics ROI overlay (vermilion) flagging the lesion read as "normal".
// Pure inline SVG. The plate is always a dark photographic figure (it reads the
// same in the light editorial page and the dark product). Motion is CSS
// (scan-line sweep + contour draw) and is disabled under reduced-motion.
export function ScanPlate() {
  return (
    <svg viewBox="0 0 800 600" role="img" aria-label="Pelvic MRI cross-section with a radiomics region-of-interest flagging a lesion read as normal">
      <defs>
        <radialGradient id="sp-field" cx="50%" cy="46%" r="62%">
          <stop offset="0" stopColor="#22242a" />
          <stop offset="0.7" stopColor="#121317" />
          <stop offset="1" stopColor="#08090b" />
        </radialGradient>
        <radialGradient id="sp-tissue" cx="50%" cy="48%" r="52%">
          <stop offset="0" stopColor="#8b8e96" />
          <stop offset="0.5" stopColor="#565962" />
          <stop offset="0.85" stopColor="#2b2d33" />
          <stop offset="1" stopColor="#191a1f" />
        </radialGradient>
        <radialGradient id="sp-organ" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3a3c42" />
          <stop offset="1" stopColor="#101116" />
        </radialGradient>
        <radialGradient id="sp-bone" cx="50%" cy="45%" r="50%">
          <stop offset="0" stopColor="#c7c9cf" />
          <stop offset="0.6" stopColor="#7d808a" />
          <stop offset="1" stopColor="#33353c" />
        </radialGradient>
        <radialGradient id="sp-heat" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff5a38" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#ff5a38" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ff5a38" stopOpacity="0" />
        </radialGradient>
        <filter id="sp-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="sp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
        </filter>
        <clipPath id="sp-body">
          <ellipse cx="400" cy="300" rx="278" ry="222" />
        </clipPath>
      </defs>

      {/* field */}
      <rect width="800" height="600" fill="url(#sp-field)" />

      {/* body cross-section — soft, asymmetric grayscale tissue (abstract) */}
      <g clipPath="url(#sp-body)">
        <ellipse cx="400" cy="300" rx="278" ry="222" fill="url(#sp-tissue)" />
        {/* broad muscle / tissue masses, deliberately asymmetric */}
        <ellipse cx="352" cy="296" rx="158" ry="150" fill="#4e5159" opacity="0.5" filter="url(#sp-soft)" />
        <ellipse cx="452" cy="332" rx="120" ry="126" fill="#2c2e34" opacity="0.55" filter="url(#sp-soft)" />
        {/* central pelvic structure (adnexal region) */}
        <ellipse cx="418" cy="286" rx="74" ry="60" fill="#82858e" opacity="0.5" filter="url(#sp-soft)" />
        {/* bladder — a dark anterior fluid pocket, off-centre */}
        <ellipse cx="372" cy="366" rx="58" ry="42" fill="#141519" opacity="0.85" filter="url(#sp-soft)" />
        {/* sacral crescent (posterior, single, bright — breaks symmetry) */}
        <path d="M296 214 q52 -22 104 -8" stroke="#b9bcc4" strokeWidth="8" fill="none" opacity="0.35" filter="url(#sp-soft)" />
        {/* one bright bony structure, low and lateral, partly cropped */}
        <ellipse cx="238" cy="404" rx="34" ry="30" fill="url(#sp-bone)" opacity="0.85" />
        {/* faint phase-encode striations (MRI texture) */}
        <g stroke="#c8cbd2" strokeWidth="0.8" opacity="0.05">
          <line x1="128" y1="252" x2="672" y2="252" />
          <line x1="128" y1="300" x2="672" y2="300" />
          <line x1="128" y1="348" x2="672" y2="348" />
          <line x1="128" y1="396" x2="672" y2="396" />
        </g>
        {/* MRI grain */}
        <rect width="800" height="600" filter="url(#sp-grain)" opacity="0.5" />
        {/* scan-line sweep */}
        <rect className="scan-sweep" x="0" y="0" width="800" height="2.5" fill="#e9ebf0" opacity="0.14" />
      </g>

      {/* faint crosshair / graticule */}
      <g stroke="#5a5d66" strokeWidth="1" opacity="0.35">
        <line x1="60" y1="70" x2="740" y2="70" strokeDasharray="1.5 22" />
        <line x1="60" y1="70" x2="60" y2="530" strokeDasharray="1.5 22" />
        <line x1="400" y1="86" x2="400" y2="104" />
        <line x1="392" y1="95" x2="408" y2="95" />
      </g>

      {/* radiomics ROI — the flag (vermilion): heatmap + drawn contour + callout */}
      <g>
        <circle cx="474" cy="238" r="52" fill="url(#sp-heat)" />
        <path
          className="contour-draw"
          d="M474 196 C512 200 524 232 516 258 C508 286 476 296 452 288 C426 280 420 246 432 222 C440 206 456 195 474 196 Z"
          fill="none"
          stroke="#ff5a38"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* leader line + callout */}
        <line x1="516" y1="220" x2="612" y2="176" stroke="#ff5a38" strokeWidth="1.2" opacity="0.8" />
        <circle className="flag-pulse" cx="516" cy="220" r="3.5" fill="#ff5a38" />
        <g fontFamily="ui-monospace, 'SF Mono', Menlo, monospace" fill="#ff6a4a">
          <text x="618" y="172" fontSize="15" letterSpacing="0.5">ROI 01 — lesion</text>
          <text x="618" y="192" fontSize="12" fill="#b9a79f" letterSpacing="0.5">texture: heterogeneous</text>
          <text x="618" y="208" fontSize="12" fill="#b9a79f" letterSpacing="0.5">prior read: “normal”</text>
        </g>
      </g>

      {/* DICOM corner metadata */}
      <g fontFamily="ui-monospace, 'SF Mono', Menlo, monospace" fill="#7c808a" fontSize="12.5" letterSpacing="1">
        <text x="60" y="52">T2 TSE · PELVIS</text>
        <text x="740" y="52" textAnchor="end">SE 24/40</text>
        <text x="60" y="548">TR 4000 / TE 90</text>
        <text x="740" y="548" textAnchor="end" fill="#9a8f88">THAAKAT · RADIOMICS</text>
      </g>
    </svg>
  );
}
