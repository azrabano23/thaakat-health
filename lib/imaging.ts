// Radiomics layer — THE MOAT. This is a DEMO STUB with a clean seam to swap in the real model.
// Real path: extract radiomics features (e.g. PyRadiomics) from the DICOM/MRI, run the classifier,
// return findings + overlay regions. For the hackathon we return curated, believable findings for
// known sample studies so the demo is reliable. Frame as detection/decision-support, never diagnosis.

export type ImagingFinding = {
  label: string;
  narration: string; // what Noor says out loud
  // normalized bounding box on the displayed image, for the overlay [x, y, w, h] in 0..1
  region?: [number, number, number, number];
  confidence?: number; // 0..1 (demo)
  criteriaId?: string; // links back to lib/criteria imaging signals
};

export type ImagingResult = {
  studyId: string;
  modality: 'MRI' | 'US';
  findings: ImagingFinding[];
  summary: string;
  isMock: boolean;
};

// Curated sample studies. Add a corresponding image under /public/sample-mri/<studyId>.png
const SAMPLE_STUDIES: Record<string, ImagingResult> = {
  'demo-pelvic-mri-1': {
    studyId: 'demo-pelvic-mri-1',
    modality: 'MRI',
    isMock: true,
    summary:
      'Findings consistent with deep infiltrating endometriosis and adenomyosis — the pattern most often missed on a routine read.',
    findings: [
      {
        label: 'Uterosacral ligament nodule',
        narration:
          "I'm seeing a hypointense nodule along the left uterosacral ligament — a sign consistent with deep infiltrating endometriosis that routine reads often miss.",
        region: [0.44, 0.52, 0.14, 0.12],
        confidence: 0.82,
        criteriaId: 'img-die',
      },
      {
        label: 'Junctional zone thickening',
        narration:
          'The junctional zone looks thickened, which can point to adenomyosis — worth a specialist confirming.',
        region: [0.4, 0.34, 0.2, 0.16],
        confidence: 0.74,
        criteriaId: 'img-adenomyosis',
      },
    ],
  },
};

export async function analyzeImaging(studyId: string): Promise<ImagingResult> {
  // TODO(real-model): pull DICOM from Medplum (ImagingStudy/Binary), run radiomics + classifier here.
  const hit = SAMPLE_STUDIES[studyId] ?? SAMPLE_STUDIES['demo-pelvic-mri-1'];
  return hit;
}
