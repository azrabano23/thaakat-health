import { NextResponse } from 'next/server';

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

export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'DEEPGRAM_API_KEY is not set. Add it to .env.local and restart `pnpm dev`.' },
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
    // This key can't mint JWTs. Fall back to the raw key so the demo still runs — note this does
    // put the key in the browser, so it is a DEMO-ONLY path. A Member-scoped key removes it.
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
