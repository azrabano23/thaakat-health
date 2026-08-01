// Closed-loop re-scoring Bot (Diana Hu's "closed loop, not open loop" thesis).
// Wire a Subscription with criteria "ImagingStudy" -> this Bot (rest-hook). Whenever a new or
// updated imaging study lands, re-run the radiomics model and write an updated DetectedIssue —
// so previously-"normal" charts get silently re-scored as the model improves, with no human
// needing to remember to re-order anything. Decision-support, flags for review, never a diagnosis.
import { BotEvent, MedplumClient, createReference } from '@medplum/core';
import type { ImagingStudy, DetectedIssue, Device, Patient, Reference } from '@medplum/fhirtypes';
// Same identifier helpers the web app uses (lib/demo-identity.ts) — the bot and the app must agree
// on these keys, or each would create its own "one" Device. Bundled in by esbuild at build time.
import {
  RADIOMICS_DEVICE_ID,
  deviceIdentifier,
  identifierSearchValue,
  rescoreIdentifier,
} from '../../lib/demo-identity';

export async function handler(medplum: MedplumClient, event: BotEvent<ImagingStudy>): Promise<any> {
  const study = event.input;

  // ImagingStudy.subject may be a Patient, Device, or Group; DetectedIssue.patient must be a
  // Patient. A study belonging to anything else is not a person we can re-score, so stop rather
  // than attach a finding to the wrong subject.
  const subject = study.subject as Reference<Patient | Device> | undefined;
  if (!subject?.reference?.startsWith('Patient/')) {
    return { skipped: 'ImagingStudy.subject is not a Patient', study: study.id };
  }
  const patient = subject as Reference<Patient>;

  // The re-score is keyed to the study, so an id is what makes this idempotent. Without one there
  // is nothing to deduplicate on, and re-delivery would stack duplicate findings on the chart.
  if (!study.id) {
    return { skipped: 'ImagingStudy has no id to key the re-score on' };
  }
  const rescoreKey = rescoreIdentifier(study.id);

  // TODO(real-model): pull the DICOM/Binary for this study, run radiomics (see radiomics/),
  // and gate on the model's confidence. Here we record the re-score as idiomatic FHIR.
  //
  // One Device per project, not one per firing. Subscription-channel bots run ONCE with no retry,
  // so a plain create would leave a new duplicate "model" behind on every scan that lands.
  const deviceId = deviceIdentifier(RADIOMICS_DEVICE_ID);
  const device = await medplum.createResourceIfNoneExist<Device>(
    {
      resourceType: 'Device',
      status: 'active',
      identifier: [deviceId],
      deviceName: [{ name: 'Radiomics decision-support model (auto re-score)', type: 'model-name' }],
    },
    `identifier=${identifierSearchValue(deviceId)}`,
  );

  // Same reasoning for the finding itself: re-delivery of the same study must not stack up
  // duplicate DetectedIssues on the chart.
  const issue = await medplum.createResourceIfNoneExist<DetectedIssue>(
    {
      resourceType: 'DetectedIssue',
      status: 'preliminary',
      severity: 'moderate',
      identifier: [rescoreKey],
      code: { text: 'Endometriosis pattern — automatic re-score on new imaging' },
      detail:
        'Radiomic re-read surfaced findings worth a specialist review. Decision-support only; flags for radiologist review, not a diagnosis.',
      patient,
      author: createReference(device),
      evidence: [{ detail: [createReference(study)] }],
    },
    `identifier=${identifierSearchValue(rescoreKey)}`,
  );

  return { detectedIssue: issue.id, study: study.id };
}
