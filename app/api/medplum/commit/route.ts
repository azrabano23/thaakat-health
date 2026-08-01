import { NextRequest, NextResponse } from 'next/server';
import { commitChart, type ChartInput } from '@/lib/medplum';

export const runtime = 'nodejs';

// POST ChartInput -> writes Condition/Observations/DiagnosticReport/ServiceRequest/Claim(preauth)/Task
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ChartInput;
  try {
    const result = await commitChart({
      symptoms: body.symptoms ?? [],
      imagingFindings: body.imagingFindings,
      referral: body.referral,
      priorAuthRequired: body.priorAuthRequired,
      patientName: body.patientName,
      patientId: body.patientId,
      cluster: body.cluster, // the assembled cross-specialty pattern -> DetectedIssue (the marquee write)
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
