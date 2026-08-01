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
    return NextResponse.json({ error: await res.text() }, { status: res.status });
  }
  const data = await res.json(); // { access_token, expires_in }
  return NextResponse.json(data);
}
