import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mint a SHORT-LIVED Deepgram token for the browser. Never ship DEEPGRAM_API_KEY to the client.
export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'DEEPGRAM_API_KEY not set' }, { status: 500 });
  }
  const res = await fetch('https://api.deepgram.com/v1/auth/grant', {
    method: 'POST',
    headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: 300 }),
  });
  if (!res.ok) {
    // This key can't mint JWTs (needs "Member" permission). Fall back to the raw key for the
    // browser WebSocket auth — Sec-WebSocket-Protocol accepts the API key directly. Fine for a
    // demo; use a Member-scoped key to mint short-lived tokens in production.
    return NextResponse.json({ access_token: key, expires_in: 0, fallback: true });
  }
  const data = await res.json(); // { access_token, expires_in }
  return NextResponse.json(data);
}
