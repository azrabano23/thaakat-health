import { NextRequest, NextResponse } from 'next/server';
import { commitChart, type ChartInput } from '@/lib/medplum';

export const runtime = 'nodejs';
// commitChart is the longest chain in the app: a client login, a Patient lookup, then ~10
// sequential createResource round-trips to api.medplum.com. On conference wifi that can run past
// Vercel's 10s default and truncate mid-write, leaving a half-written chart and a page that shows
// "unavailable" for a commit that partly succeeded. 60s is the ceiling on both Hobby and Pro.
export const maxDuration = 60;

// POST ChartInput -> writes DetectedIssue/Condition/Observations/DiagnosticReport/
// ServiceRequest/Claim(preauth)/Task.
//
// Rebuilding the payload field-by-field here silently dropped `cluster`, which is the ONE field
// commitChart() turns into the DetectedIssue — the headline resource, the thing that represents
// "nobody's job was to see this." Forward the whole body instead, so adding a field to ChartInput
// can't quietly stop reaching Medplum again.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ChartInput;
  try {
    const result = await commitChart({ ...body, symptoms: body.symptoms ?? [] });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
