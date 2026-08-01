import { NextRequest, NextResponse } from 'next/server';
import { checkEligibility, MOCK_PATIENTS } from '@/lib/stedi';

export const runtime = 'nodejs';

// POST { patient?: "aetna" | "uhc" | "uhcInactive", serviceTypeCodes?: string[] }
// Uses Stedi TEST MODE mock payers. Returns coverage + whether prior auth is required.
export async function POST(req: NextRequest) {
  const key = process.env.STEDI_API_KEY;
  const body = await req.json().catch(() => ({}));
  const which = (body.patient as keyof typeof MOCK_PATIENTS) ?? 'aetna';
  const patient = MOCK_PATIENTS[which] ?? MOCK_PATIENTS.aetna;

  // graceful demo fallback if key isn't set yet
  if (!key) {
    return NextResponse.json({
      active: true,
      planName: 'CHOICE PLUS (demo)',
      copay: '210',
      priorAuthRequired: 'Y',
      _note: 'STEDI_API_KEY not set — returning demo coverage. Set the key for a real test-mode call.',
    });
  }

  try {
    const result = await checkEligibility({
      apiKey: key,
      patient,
      serviceTypeCodes: body.serviceTypeCodes,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
