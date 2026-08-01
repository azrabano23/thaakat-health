import { NextRequest, NextResponse } from 'next/server';
import { retrieveCriteria, usingMoss } from '@/lib/moss';

export const runtime = 'nodejs';

// POST { query: string, topK?: number } -> ranked criteria (Moss <10ms, or local fallback)
export async function POST(req: NextRequest) {
  const { query, topK } = await req.json().catch(() => ({ query: '' }));
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });
  const t0 = Date.now();
  const results = await retrieveCriteria(query, topK ?? 4);
  return NextResponse.json({
    results,
    backend: usingMoss() ? 'moss' : 'local-fallback',
    ms: Date.now() - t0,
  });
}
