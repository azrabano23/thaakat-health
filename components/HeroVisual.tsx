// Thaakat hero visual — a luminous aperture. Scattered clinical findings (the faint
// orbiting dots) resolve around a lens of light: "assembling the picture nobody's
// job was to see, brought into the light." Pure inline SVG + CSS. Motion is CSS
// keyframes (see globals.css) and is disabled under prefers-reduced-motion.
export function HeroVisual() {
  return (
    <svg viewBox="0 0 640 640" role="img" aria-label="An aperture of light resolving scattered findings into a single pattern">
      <defs>
        <radialGradient id="hvHaze" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8f7dff" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#5b74ff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#5b74ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hvCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6e2" />
          <stop offset="0.35" stopColor="#ffe0a3" />
          <stop offset="0.7" stopColor="#f6cd77" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6cd77" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hvRing" x1="120" y1="120" x2="520" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b98cff" />
          <stop offset="0.5" stopColor="#82a6ff" />
          <stop offset="1" stopColor="#5b74ff" />
        </linearGradient>
        <linearGradient id="hvGold" x1="200" y1="200" x2="440" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe0a3" />
          <stop offset="1" stopColor="#d7a24c" />
        </linearGradient>
        <linearGradient id="hvSweep" x1="320" y1="320" x2="320" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6cd77" stopOpacity="0" />
          <stop offset="1" stopColor="#f6cd77" stopOpacity="0.38" />
        </linearGradient>
        <filter id="hvBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>

      {/* atmospheric glows */}
      <circle cx="320" cy="320" r="240" fill="url(#hvHaze)" filter="url(#hvBlur)" />
      <circle cx="320" cy="320" r="120" fill="url(#hvCore)" filter="url(#hvBlur)" opacity="0.9" />

      {/* faint crosshair — instrument reticle */}
      <g stroke="#3a4a74" strokeWidth="1" opacity="0.35">
        <line x1="60" y1="320" x2="580" y2="320" />
        <line x1="320" y1="60" x2="320" y2="580" />
      </g>

      {/* outer dial: ring + tick marks (dashed stroke = evenly spaced ticks) */}
      <circle cx="320" cy="320" r="300" fill="none" stroke="#2a3a63" strokeWidth="1" opacity="0.7" />
      <circle
        cx="320"
        cy="320"
        r="292"
        fill="none"
        stroke="#43547f"
        strokeWidth="7"
        strokeDasharray="1.5 13"
        opacity="0.55"
      />

      {/* rotating dashed scan rings */}
      <g className="spin-slow">
        <circle cx="320" cy="320" r="250" fill="none" stroke="url(#hvRing)" strokeWidth="1.4" strokeDasharray="2 12" opacity="0.7" />
        <path d="M320 70 A250 250 0 0 1 570 320" fill="none" stroke="url(#hvGold)" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
        <path d="M320 570 A250 250 0 0 1 70 320" fill="none" stroke="url(#hvRing)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>

      <g className="spin-med">
        <circle cx="320" cy="320" r="196" fill="none" stroke="url(#hvRing)" strokeWidth="1.2" strokeDasharray="1.5 10" opacity="0.6" />
        <path d="M124 320 A196 196 0 0 1 320 124" fill="none" stroke="url(#hvGold)" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* radar sweep */}
      <g className="sweep">
        <path d="M320 320 L320 60 A260 260 0 0 1 487 121 Z" fill="url(#hvSweep)" opacity="0.32" />
        <line x1="320" y1="320" x2="320" y2="62" stroke="#ffe0a3" strokeWidth="1.4" opacity="0.5" />
      </g>

      {/* aperture — two offset hexagons forming a lens iris */}
      <g className="breathe">
        <polygon
          points="450,320 385,432.6 255,432.6 190,320 255,207.4 385,207.4"
          fill="none"
          stroke="url(#hvGold)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          opacity="0.75"
        />
        <polygon
          points="402.3,367.5 320,415 237.7,367.5 237.7,272.5 320,225 402.3,272.5"
          fill="none"
          stroke="url(#hvGold)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity="0.45"
        />
        <polygon
          points="450,320 385,432.6 255,432.6 190,320 255,207.4 385,207.4"
          fill="url(#hvCore)"
          opacity="0.14"
        />
      </g>

      {/* orbiting findings on the outer ring */}
      <g className="orbit">
        <circle cx="554.9" cy="405.5" r="4.5" fill="#82a6ff" opacity="0.7" />
        <circle cx="363.4" cy="566.2" r="3.6" fill="#b98cff" opacity="0.6" />
        <circle cx="128.5" cy="480.7" r="4.2" fill="#82a6ff" opacity="0.55" />
        <circle cx="85.1" cy="234.5" r="3.4" fill="#b98cff" opacity="0.5" />
        <circle cx="276.6" cy="73.8" r="3.8" fill="#82a6ff" opacity="0.6" />
        {/* the surfaced one — luminous gold */}
        <circle cx="511.5" cy="159.3" r="9" fill="#f6cd77" opacity="0.25" />
        <circle cx="511.5" cy="159.3" r="5" fill="#ffe6b8" />
      </g>

      {/* inner orbit */}
      <g className="orbit-rev">
        <circle cx="457.9" cy="457.9" r="3" fill="#82a6ff" opacity="0.5" />
        <circle cx="182.1" cy="457.9" r="2.6" fill="#b98cff" opacity="0.45" />
        <circle cx="182.1" cy="182.1" r="3" fill="#82a6ff" opacity="0.5" />
        <circle cx="457.9" cy="182.1" r="2.6" fill="#b98cff" opacity="0.4" />
      </g>

      {/* core */}
      <g className="breathe">
        <circle cx="320" cy="320" r="56" fill="none" stroke="url(#hvGold)" strokeWidth="1.3" opacity="0.55" />
        <circle cx="320" cy="320" r="34" fill="none" stroke="#ffe0a3" strokeWidth="1.2" opacity="0.7" />
        <circle cx="320" cy="320" r="17" fill="url(#hvCore)" />
        <circle cx="320" cy="320" r="7" fill="#fff6e2" />
      </g>
    </svg>
  );
}
