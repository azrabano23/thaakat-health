// Radiomics layer — THE MOAT. This is a DEMO STUB with a clean seam to swap in the real model.
// Real path: extract radiomics features (e.g. PyRadiomics) from the DICOM/MRI, run the classifier,
// return findings + overlay regions. For the hackathon we return curated, believable findings for
// known sample studies so the demo is reliable. Frame as detection/decision-support, never diagnosis.

import RADIOMICS_MODEL from '@/lib/radiomics-model.json';

export type ImagingFinding = {
  label: string;
  /** Plain-language wording for the patient conversation. */
  narration: string;
  /** Technical detail retained for the clinician-facing FHIR report. */
  clinicalDetail?: string;
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
  // Provenance of the REAL trained model behind the moat (radiomics/real_endo_summary.json).
  model?: { name: string; trainedOn: string; cvAuc: string; topFeatures: string[] };
};

// Curated sample studies. Add a corresponding image under /public/sample-mri/<studyId>.png
const SAMPLE_STUDIES: Record<string, ImagingResult> = {
  'demo-pelvic-mri-1': {
    studyId: 'demo-pelvic-mri-1',
    modality: 'MRI',
    isMock: true,
    model: {
      name: 'Radiomic texture classifier (first-order + GLCM)',
      trainedOn: 'GLENDA — real endometriosis imaging (n=5,990)',
      // Read from the trained model's own artifact rather than retyped, so this card and the
      // ModelCard (which renders the same file) can never quote different numbers on stage.
      cvAuc: `${RADIOMICS_MODEL.roc_auc.toFixed(4)} (pooled out-of-fold ROC-AUC, 5-fold CV)`,
      topFeatures: ['fo_entropy', 'glcm_homogeneity', 'fo_p10'],
    },
    summary:
      'Re-read of the 2024 pelvic MRI surfaces two findings under-called on the routine read: a deep-infiltrating endometriosis nodule on the left uterosacral ligament, and junctional-zone thickening consistent with adenomyosis.',
    findings: [
      {
        label: 'Left uterosacral ligament — DIE nodule',
        narration:
          "I found an area on the left side of the pelvis that deserves a closer look. It wasn't called out in the original report, and it has features a specialist would want to review for endometriosis.",
        clinicalDetail:
          'Asymmetric, spiculated T2-hypointense thickening of the left uterosacral ligament, approximately 11 mm, with small T1-bright foci; features consistent with deep infiltrating endometriosis.',
        region: [0.44, 0.52, 0.14, 0.12],
        confidence: 0.82,
        criteriaId: 'img-die',
      },
      {
        label: 'Junctional zone — adenomyosis',
        narration:
          "There is also some thickening in the muscle of the uterus. It may help explain your symptoms, but it needs to be reviewed alongside the rest of your history — not treated as an answer on its own.",
        clinicalDetail:
          'Junctional zone measures approximately 14 mm with an inner-to-outer ratio over 40%, features consistent with adenomyosis. The routine read recorded 9 mm without the additional measurements.',
        region: [0.4, 0.34, 0.2, 0.16],
        confidence: 0.74,
        criteriaId: 'img-adenomyosis',
      },
    ],
  },
};

/**
 * Re-read a study. Returns null when we have no result for that identifier.
 *
 * Falling back to a default study for an unknown id is the one wrong answer here: it would
 * narrate a uterosacral nodule for a patient whose scan we never looked at, in a product whose
 * entire claim is that it read THIS person's imaging. An empty answer is recoverable; a
 * confidently wrong one is not.
 */
export async function analyzeImaging(studyId: string): Promise<ImagingResult | null> {
  // TODO(real-model): pull DICOM from Medplum (ImagingStudy/Binary), run radiomics + classifier here.
  return SAMPLE_STUDIES[studyId] ?? null;
}
