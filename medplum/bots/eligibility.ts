// Medplum Bot: on a CoverageEligibilityRequest, call Stedi (test mode) and write a
// CoverageEligibilityResponse. Store the Stedi test key as a Bot Secret named STEDI_API_KEY.
// Stedi has NO 278 API — the caller models prior auth as Claim(use="preauthorization") separately.
import { BotEvent, MedplumClient, createReference } from '@medplum/core';
import type { CoverageEligibilityRequest, CoverageEligibilityResponse } from '@medplum/fhirtypes';

const STEDI_URL = 'https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3';

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<CoverageEligibilityRequest>,
): Promise<CoverageEligibilityResponse> {
  const request = event.input;
  const stediKey = event.secrets['STEDI_API_KEY']?.valueString;

  // Demo default: Aetna test patient. In a real build, map request.patient -> member identifiers.
  const stediBody = {
    provider: { npi: '1999999984', organizationName: 'Thaakat Health' },
    subscriber: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '20040404', memberId: 'AETNA12345' },
    encounter: { serviceTypeCodes: ['30'] },
    tradingPartnerServiceId: '60054',
  };

  let authRequired: 'Y' | 'N' | 'U' | 'unknown' = 'unknown';
  let active = true;
  if (stediKey) {
    const data: any = await fetch(STEDI_URL, {
      method: 'POST',
      headers: { Authorization: stediKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(stediBody),
    }).then((r) => r.json());
    const benefits: any[] = data.benefitsInformation ?? [];
    active = benefits.some((b) => b.code === '1') || (data.status ?? '').toLowerCase() === 'active';
    authRequired =
      benefits.map((b) => b.authOrCertIndicator).find((v: string) => ['Y', 'N', 'U'].includes(v)) ?? 'unknown';
  }

  return medplum.createResource<CoverageEligibilityResponse>({
    resourceType: 'CoverageEligibilityResponse',
    status: 'active',
    purpose: ['benefits', 'auth-requirements'],
    patient: request.patient ?? { display: 'Jane Doe (demo)' },
    created: new Date().toISOString(),
    request: createReference(request),
    outcome: 'complete',
    insurer: request.insurer ?? { display: 'Aetna (test)' },
    insurance: [
      {
        // R4 requires CoverageEligibilityResponse.insurance[].coverage — echo the request's
        // coverage, or a synthetic display reference in the demo.
        coverage: request.insurance?.[0]?.coverage ?? { display: 'Demo coverage (synthetic)' },
        inforce: active,
        item: [
          {
            category: { coding: [{ code: '30' }] },
            authorizationRequired: authRequired === 'Y',
          },
        ],
      },
    ],
  });
}
