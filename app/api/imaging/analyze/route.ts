import { NextRequest, NextResponse } from 'next/server';
import { analyzeImaging } from '@/lib/imaging';

export const runtime = 'nodejs';

// POST { studyId: string } -> radiomics findings (demo stub; swap real model in lib/imaging.ts)
//
// An unknown studyId is a 404, not somebody else's scan. See lib/imaging.ts.
export async function POST(req: NextRequest) {
  const { studyId } = await req.json().catch(() => ({ studyId: '' }));
  if (!studyId) return NextResponse.json({ error: 'studyId required' }, { status: 400 });

  const result = await analyzeImaging(studyId);
  if (!result) {
    return NextResponse.json(
      { available: false, error: `No re-read available for study "${studyId}".` },
      { status: 404 },
    );
  }
  return NextResponse.json({ available: true, ...result });
}
