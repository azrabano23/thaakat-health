// Stable identities for the seeded demo chart.
//
// Why this exists: without a stable key, `commitChart()` creates a brand-new Patient on every run,
// so the DetectedIssue it writes — the resource representing "nobody's job was to see this" — hangs
// off an empty chart standing next to Maria's seeded record rather than on it. A judge opening that
// resource finds a patient with no history, which contradicts the entire pitch. It also silently
// accumulates duplicate patients: the project reached 8 before this was fixed the first time.
//
// A FHIR `identifier` fixes both halves: the seed stamps one on the Patient it creates, and the
// commit path resolves the same identifier instead of minting another. Conditional create keyed on
// identifier is also the pattern CLAUDE.md and Medplum's own guidance ask for over
// search-then-create.
//
// Synthetic demo data only — these identifiers exist to make the demo idempotent, nothing else.

import type { Identifier, Patient } from '@medplum/fhirtypes';
import type { MedplumClient } from '@medplum/core';

/** Namespace for the seeded demo patients. `value` is the DemoPatient id in lib/clusters.ts. */
export const DEMO_PATIENT_SYSTEM = 'https://thaakat.health/fhir/demo-patient';

/** Namespace for the radiomics Device, so repeat writes reuse one Device instead of N. */
export const THAAKAT_DEVICE_SYSTEM = 'https://thaakat.health/fhir/device';

/** Namespace for bot-authored resources, keyed so a re-fired Subscription can't duplicate them. */
export const THAAKAT_ISSUE_SYSTEM = 'https://thaakat.health/fhir/detected-issue';

/** The single Device that authors radiomics DetectedIssues. */
export const RADIOMICS_DEVICE_ID = 'radiomics-decision-support';

export function demoPatientIdentifier(demoId: string): Identifier {
  return { system: DEMO_PATIENT_SYSTEM, value: demoId };
}

export function deviceIdentifier(deviceId: string): Identifier {
  return { system: THAAKAT_DEVICE_SYSTEM, value: deviceId };
}

/**
 * Key for an automatic imaging re-score.
 *
 * Bot-channel Subscriptions fire once with no retry, but they DO fire again every time the study is
 * updated — so without a stable key the re-score bot writes a fresh DetectedIssue on every save.
 */
export function rescoreIdentifier(studyId: string): Identifier {
  return { system: THAAKAT_ISSUE_SYSTEM, value: `rescore:${studyId}` };
}

/** `identifier` search param value — `system|value`, per FHIR R4 token search syntax. */
export function identifierSearchValue(identifier: Identifier): string {
  return `${identifier.system}|${identifier.value}`;
}

/** Find the seeded Patient for a DemoPatient id, or undefined if the seed has not been run. */
export async function findDemoPatient(
  medplum: MedplumClient,
  demoId: string,
): Promise<Patient | undefined> {
  return medplum.searchOne('Patient', {
    identifier: identifierSearchValue(demoPatientIdentifier(demoId)),
  });
}

/**
 * The seeded Patient for this demo id, creating a stub carrying the same identifier if the seed has
 * not been run against this project.
 *
 * The stub matters: an unseeded project otherwise mints a new nameless Patient on every commit.
 * With the identifier, the second run finds the first run's patient, and a later `pnpm seed`
 * attaches the real history to that same record instead of starting a third one.
 */
export async function resolveDemoPatient(
  medplum: MedplumClient,
  demoId: string,
  name?: { given: string; family: string },
): Promise<Patient> {
  const existing = await findDemoPatient(medplum, demoId);
  if (existing) return existing;

  return medplum.createResourceIfNoneExist<Patient>(
    {
      resourceType: 'Patient',
      identifier: [demoPatientIdentifier(demoId)],
      name: name ? [{ given: [name.given], family: name.family }] : undefined,
    },
    `identifier=${identifierSearchValue(demoPatientIdentifier(demoId))}`,
  );
}
