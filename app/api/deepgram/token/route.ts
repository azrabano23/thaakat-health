import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Auth for the browser's Voice Agent websocket. Two shapes, and they are NOT interchangeable —
// Deepgram picks the scheme from the Sec-WebSocket-Protocol subprotocol:
//   short-lived JWT  -> ['bearer', <jwt>]     (preferred: the key never leaves the server)
//   raw API key      -> ['token',  <key>]     (fallback below)
// So we tell the client which one it got via `scheme`; sending a raw key as 'bearer' fails auth,
// and so does sending a JWT as 'token'.
//
// /v1/auth/grant requires an API key with **Member or higher** role. A lower-scoped key still
// works for raw agent sockets, so this fails ONLY in the browser — a confusing way to lose 20
// minutes. When the grant is refused we fall back to the raw key so the demo still runs, and
// return `hint` so it's obvious how to fix it properly.

const TTL_SECONDS = 300;

// Reuse a token until it's nearly expired — a page reload mid-demo shouldn't re-hit the API.
let cached: { token: string; expiresAt: number } | null = null;

/**
 * Is this request coming from a local dev machine?
 *
 * Deliberately keyed on the request HOST, not NODE_ENV. A Vercel preview deploy is a public URL
 * that anyone with the link can open, and on some build configurations NODE_ENV is not
 * 'production' there — so an NODE_ENV check can hand a live API key to the browser on a URL that
 * is already shared. The host cannot lie about being localhost to a remote visitor.
 */
function isLocalRequest(req: NextRequest): boolean {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

export async function POST(req: NextRequest) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          'DEEPGRAM_API_KEY is not set. Locally: add it to .env.local and restart `pnpm dev`. ' +
          'On Vercel: Settings → Environment Variables, then redeploy (a .env file is gitignored ' +
          'and never ships).',
      },
      { status: 500 },
    );
  }

  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ access_token: cached.token, scheme: 'bearer', cached: true });
  }

  let res: Response;
  try {
    res = await fetch('https://api.deepgram.com/v1/auth/grant', {
      method: 'POST',
      headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl_seconds: TTL_SECONDS }),
    });
  } catch (e) {
    return NextResponse.json({ error: `Could not reach Deepgram: ${(e as Error).message}` }, { status: 502 });
  }

  if (!res.ok) {
    // This key can't mint JWTs, so the only way to keep voice working is to hand the browser the
    // raw key. On localhost that's an acceptable demo shortcut. On a public deploy it publishes a
    // live credential to anyone who opens the network tab — CLAUDE.md's "never ship a key to the
    // browser" rule, broken in the most literal way.
    //
    // So the fallback is refused off localhost unless someone opts in deliberately. Failing loudly
    // here is recoverable (use ▶ Play demo, or set a Member-scoped key); a leaked key on a URL
    // handed to judges is not.
    const isLocal = isLocalRequest(req);
    const optedIn = process.env.ALLOW_DEEPGRAM_KEY_IN_BROWSER === 'true';
    if (!isLocal && !optedIn) {
      console.error('[deepgram] auth/grant refused (%s) and raw-key fallback is off for remote hosts.', res.status);
      return NextResponse.json(
        {
          error:
            'Live voice is unavailable: this DEEPGRAM_API_KEY cannot mint short-lived tokens, and ' +
            'sending the raw key to the browser is disabled on a deployed URL. Create a key with ' +
            'the "Member" role at console.deepgram.com → Settings → API Keys. To accept the risk ' +
            'anyway, set ALLOW_DEEPGRAM_KEY_IN_BROWSER=true.',
        },
        { status: 503 },
      );
    }
    if (!isLocal && optedIn) {
      // Someone deliberately opted in on a public URL. That publishes a live credential to anyone
      // who opens the network tab, so make it impossible to do accidentally or to forget about.
      console.error(
        '[deepgram] SECURITY: serving the RAW API key to a browser on a non-local host (%s) because ' +
          'ALLOW_DEEPGRAM_KEY_IN_BROWSER=true. Rotate this key after the demo.',
        req.headers.get('host'),
      );
    }

    console.warn(
      '[deepgram] auth/grant refused (%s) — falling back to the raw API key in the browser. ' +
        'Use a Member-scoped key to mint short-lived tokens instead.',
      res.status,
    );
    return NextResponse.json({
      access_token: key,
      scheme: 'token',
      expires_in: 0,
      fallback: true,
      // True only when a live key is being served to a browser on a PUBLIC url — the client
      // surfaces this so nobody demos in that state without knowing.
      keyExposedPublicly: !isLocal,
      hint:
        'Using the raw API key in the browser. To mint short-lived tokens instead, create a key ' +
        'with the "Member" role at console.deepgram.com → Settings → API Keys.',
    });
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    return NextResponse.json({ error: 'Deepgram returned no access_token.' }, { status: 502 });
  }

  const ttl = data.expires_in ?? TTL_SECONDS;
  cached = { token: data.access_token, expiresAt: Date.now() + Math.max(ttl - 15, 5) * 1000 };

  return NextResponse.json({ access_token: data.access_token, scheme: 'bearer', expires_in: ttl });
}
