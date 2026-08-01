import { NextRequest, NextResponse } from 'next/server';
import { retrieveContextTimed } from '@/lib/moss';

export const runtime = 'nodejs';

// POST { query: string, patientId?: string, topK?: number }
// -> ranked context over BOTH the diagnostic criteria and the patient's own record.
//    Record docs are scoped to the requested patient.
//
// Two timings, deliberately separate (see lib/moss.ts): `ms` is the Moss retrieval itself —
// the number that goes on the HUD and gets claimed on stage — and `totalMs` is the whole handler
// including the Next-server -> Moss network hop. `backend` reports which path actually served
// the query, so the HUD can never show a Moss latency for a local-fallback result.
export async function POST(req: NextRequest) {
  const { query, patientId, topK } = await req.json().catch(() => ({ query: '' }));
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });
  const { docs, retrievalMs, totalMs, backend } = await retrieveContextTimed(query, {
    topK: topK ?? 4,
    patientId,
  });
  return NextResponse.json({ results: docs, backend, ms: retrievalMs, totalMs });
}
