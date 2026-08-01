import { NextRequest, NextResponse } from 'next/server';
import { analyzeImaging } from '@/lib/imaging';

export const runtime = 'nodejs';

// POST { studyId?: string } -> radiomics findings (demo stub; swap real model in lib/imaging.ts)
export async function POST(req: NextRequest) {
  const { studyId } = await req.json().catch(() => ({ studyId: 'demo-pelvic-mri-1' }));
  const result = await analyzeImaging(studyId ?? 'demo-pelvic-mri-1');
  return NextResponse.json(result);
}
