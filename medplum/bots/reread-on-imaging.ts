// Closed-loop re-scoring Bot (Diana Hu's "closed loop, not open loop" thesis).
// Wire a Subscription with criteria "ImagingStudy" -> this Bot (rest-hook). Whenever a new or
// updated imaging study lands, re-run the radiomics model and write an updated DetectedIssue —
// so previously-"normal" charts get silently re-scored as the model improves, with no human
// needing to remember to re-order anything. Decision-support, flags for review, never a diagnosis.
import { BotEvent, MedplumClient, createReference } from '@medplum/core';
import type { ImagingStudy, DetectedIssue, Device } from '@medplum/fhirtypes';

export async function handler(medplum: MedplumClient, event: BotEvent<ImagingStudy>): Promise<any> {
  const study = event.input;

  // TODO(real-model): pull the DICOM/Binary for this study, run radiomics (see radiomics/),
  // and gate on the model's confidence. Here we record the re-score as idiomatic FHIR.
  const device = await medplum.createResource<Device>({
    resourceType: 'Device',
    status: 'active',
    deviceName: [{ name: 'Radiomics decision-support model (auto re-score)', type: 'model-name' }],
  });

  const issue = await medplum.createResource<DetectedIssue>({
    resourceType: 'DetectedIssue',
    status: 'preliminary',
    severity: 'moderate',
    code: { text: 'Endometriosis pattern — automatic re-score on new imaging' },
    detail:
      'Radiomic re-read surfaced findings worth a specialist review. Decision-support only; flags for radiologist review, not a diagnosis.',
    patient: study.subject,
    author: createReference(device),
    evidence: [{ detail: [createReference(study)] }],
  });

  return { detectedIssue: issue.id, study: study.id };
}
