// The coverage half of the record: who insures the patient, and what the payer said.
//
// Stedi answers a real 270/271 eligibility question — is coverage active, what does it cost, is
// prior authorization required. Until now that answer lived in React state and died there: the
// project held zero CoverageEligibilityResponse resources, so the one sponsor whose whole job is
// "what does the next step cost" left no trace on the chart a clinician actually opens.
//
// This module persists it, and fixes a related class of bug. Three references in the generated
// chart pointed nowhere — `Claim.insurance[].coverage`, `Claim.provider`, and `Coverage.payor` were
// all `{ display: '...' }` with no `reference`. That type-checks, because every member of FHIR
// `Reference<T>` is optional, so tsc cannot tell a real pointer from a label. Required-and-a-
// Reference is exactly where the type system stops protecting you.
//
// FHIR R4. Required fields verified against @medplum/fhirtypes:
//   CoverageEligibilityRequest  → status, purpose[], patient, created, insurer
//   CoverageEligibilityResponse → status, purpose[], patient, created, request, outcome, insurer
//   Coverage                    → status, beneficiary, payor[]
// Synthetic demo data only.

import { createReference } from '@medplum/core';
import type { MedplumClient } from '@medplum/core';
import type {
  Coverage,
  CoverageEligibilityRequest,
  CoverageEligibilityResponse,
  CoverageEligibilityResponseInsuranceItemBenefit,
  Organization,
  Patient,
  Reference,
} from '@medplum/fhirtypes';

export const PAYER_SYSTEM = 'https://thaakat.health/fhir/payer';
export const COVERAGE_SYSTEM = 'https://thaakat.health/fhir/coverage';

/** Payer key → the identity Stedi test mode expects. Keys match DemoPatient.payer. */
export const PAYERS = {
  uhc: {
    name: 'UnitedHealthcare',
    // Stedi's tradingPartnerServiceId doubles as a stable payer id for the Organization.
    tradingPartnerServiceId: '87726',
    memberId: 'UHC123456',
  },
  aetna: {
    name: 'Aetna',
    tradingPartnerServiceId: '60054',
    memberId: 'AETNA12345',
  },
} as const;

export type PayerKey = keyof typeof PAYERS;

export function isPayerKey(value: string | undefined): value is PayerKey {
  return value === 'uhc' || value === 'aetna';
}

/** The payer as a real Organization, so `Coverage.payor` and `insurer` point at something. */
export async function resolvePayerOrganization(
  medplum: MedplumClient,
  payer: PayerKey,
): Promise<Organization> {
  const { name, tradingPartnerServiceId } = PAYERS[payer];
  const query = `identifier=${PAYER_SYSTEM}|${tradingPartnerServiceId}`;
  return medplum.createResourceIfNoneExist<Organization>(
    {
      resourceType: 'Organization',
      active: true,
      identifier: [{ system: PAYER_SYSTEM, value: tradingPartnerServiceId }],
      name: `${name} (Stedi test mode)`,
    },
    query,
  );
}

/**
 * The patient's Coverage for this payer, created if the seed did not already write one.
 *
 * Keyed on the member id so re-running a demo reuses the same Coverage instead of stacking a new
 * one per commit — the same duplicate-by-default problem that produced eight Patients.
 */
export async function resolveCoverage(
  medplum: MedplumClient,
  patient: Reference<Patient>,
  payer: PayerKey,
): Promise<{ coverage: Coverage; insurer: Organization }> {
  const insurer = await resolvePayerOrganization(medplum, payer);
  const { memberId } = PAYERS[payer];
  const query = `identifier=${COVERAGE_SYSTEM}|${memberId}`;

  const coverage = await medplum.createResourceIfNoneExist<Coverage>(
    {
      resourceType: 'Coverage',
      status: 'active',
      identifier: [{ system: COVERAGE_SYSTEM, value: memberId }],
      beneficiary: patient,
      subscriberId: memberId,
      payor: [createReference(insurer)],
    },
    query,
  );

  return { coverage, insurer };
}

/** What our Stedi wrapper returns (lib/stedi.ts EligibilityResult), narrowed to what we persist. */
export type EligibilitySummary = {
  active?: boolean;
  planName?: string;
  copay?: string;
  deductible?: string;
  priorAuthRequired?: 'Y' | 'N' | 'U' | 'unknown' | string;
};

/**
 * Persist one eligibility check as the FHIR pair it actually is: the question we asked, and the
 * payer's answer, linked.
 *
 * `authorizationRequired` is set ONLY when Stedi returned an explicit "Y". Absent and "U" are not
 * "no" — Aetna's test payer omits `authOrCertIndicator` entirely — and writing `false` there would
 * record a definite negative the payer never gave us. Leaving it undefined is the honest encoding.
 */
export async function recordEligibility(opts: {
  medplum: MedplumClient;
  patient: Reference<Patient>;
  coverage: Coverage;
  insurer: Organization;
  result: EligibilitySummary;
  serviceTypeCodes?: string[];
}): Promise<{ request: CoverageEligibilityRequest; response: CoverageEligibilityResponse }> {
  const { medplum, patient, coverage, insurer, result, serviceTypeCodes } = opts;
  const created = new Date().toISOString();
  const coverageRef = createReference(coverage);
  const insurerRef = createReference(insurer);
  const purpose: ('auth-requirements' | 'benefits')[] = ['benefits', 'auth-requirements'];

  const request = await medplum.createResource<CoverageEligibilityRequest>({
    resourceType: 'CoverageEligibilityRequest',
    status: 'active',
    purpose,
    patient,
    created,
    insurer: insurerRef,
    insurance: [{ focal: true, coverage: coverageRef }],
    ...(serviceTypeCodes?.length
      ? { item: [{ category: { coding: serviceTypeCodes.map((code) => ({ code })) } }] }
      : {}),
  });

  // R4 pins Money.currency to the ISO-4217 union, so this must stay a literal, not a widened string.
  const benefit: CoverageEligibilityResponseInsuranceItemBenefit[] = [];
  if (result.copay) {
    benefit.push({ type: { text: 'Co-payment' }, allowedMoney: { value: Number(result.copay), currency: 'USD' as const } });
  }
  if (result.deductible) {
    benefit.push({
      type: { text: 'Deductible' },
      allowedMoney: { value: Number(result.deductible), currency: 'USD' as const },
    });
  }

  const response = await medplum.createResource<CoverageEligibilityResponse>({
    resourceType: 'CoverageEligibilityResponse',
    status: 'active',
    purpose,
    patient,
    created,
    request: createReference(request),
    outcome: 'complete',
    disposition: result.planName ? `Plan: ${result.planName}` : undefined,
    insurer: insurerRef,
    insurance: [
      {
        coverage: coverageRef,
        inforce: result.active,
        item: [
          {
            category: serviceTypeCodes?.length
              ? { coding: serviceTypeCodes.map((code) => ({ code })) }
              : { text: 'Health benefit plan coverage' },
            ...(result.priorAuthRequired === 'Y' ? { authorizationRequired: true } : {}),
            ...(benefit.length ? { benefit } : {}),
          },
        ],
      },
    ],
  });

  return { request, response };
}
