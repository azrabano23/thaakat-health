// Security headers. Vercel terminates TLS for us, but it does NOT set these — without them the
// app ships no CSP, no HSTS, and no clickjacking protection.
//
// Scope note: this demo holds NO PHI (every patient is synthetic), so HIPAA's Security Rule does
// not attach to it. These headers are the transport-side controls a real deployment would need
// under §164.312(e) — cheap to get right now, and they keep the "swap in real data" seam honest.
const securityHeaders = [
  // Force HTTPS for two years, including subdomains. Harmless locally (browsers ignore HSTS on
  // localhost) and correct on Vercel, which is HTTPS-only anyway.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // No embedding — a clinical-looking UI framed inside someone else's page is a phishing surface.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // The mic is the ONLY device capability this app needs; deny the rest outright.
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-inline'/'unsafe-eval' are required by Next.js's runtime unless every script gets a
      // per-request nonce via middleware. Nonces are the right production answer; they are not
      // wired here, so this is a deliberate, documented gap rather than an oversight.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // The UI styles heavily with inline `style={{…}}` props, which CSP counts as inline styles.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // The browser's only cross-origin call is the Deepgram Voice Agent websocket. Every other
      // sponsor (Medplum, Moss, Stedi, Anthropic) is reached server-side from /api/*, so their
      // keys stay on the server and their origins never belong in a browser-facing policy.
      "connect-src 'self' wss://agent.deepgram.com https://api.deepgram.com",
      // Audio worklet for mic capture is built from a blob URL (see lib/voice/audio.ts).
      "worker-src 'self' blob:",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep native/heavy SDKs out of the webpack bundle — loaded at runtime in the Node.js runtime.
  // @moss-dev/moss-core ships platform .node binaries that must NOT be bundled.
  serverExternalPackages: ['@medplum/core', '@moss-dev/moss', '@moss-dev/moss-core'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
