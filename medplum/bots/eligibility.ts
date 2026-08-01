// Medplum Bot: on a CoverageEligibilityRequest, call Stedi (test mode) and write a
// CoverageEligibilityResponse. Store the Stedi test key as a Bot Secret named STEDI_API_KEY.
// Stedi has NO 278 API — the caller models prior auth as Claim(use="preauthorization") separately.
import { BotEvent, MedplumClient, createReference } from '@medplum/core';
import type {
  Coverage,
  CoverageEligibilityRequest,
  CoverageEligibilityResponse,
  Reference,
} from '@medplum/fhirtypes';

const STEDI_URL = 'https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3';

// The slice of Stedi's eligibility response we read. Parsing an external API as `any` is how a
// silent shape change turns into "coverage inactive" with nothing in the logs.
type StediBenefit = { code?: string; authOrCertIndicator?: string };
type StediEligibilityResponse = { benefitsInformation?: StediBenefit[]; status?: string };

// Stedi test-mode identities. Exact values are required — these are the only member records the
// sandbox recognises. Which one to use comes from the request, not from a hardcoded default.
const STEDI_IDENTITIES = {
  aetna: {
    tradingPartnerServiceId: '60054',
    subscriber: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '20040404', memberId: 'AETNA12345' },
  },
  uhc: {
    tradingPartnerServiceId: '87726',
    subscriber: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '19710101', memberId: 'UHC123456' },
  },
} as const;

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<CoverageEligibilityRequest>,
): Promise<CoverageEligibilityResponse> {
  const request = event.input;
  const stediKey = event.secrets['STEDI_API_KEY']?.valueString;

  // Which payer identity to price against comes from the REQUEST, not a hardcoded default. The
  // demo seeds one patient on UHC and one on Aetna, so defaulting to Aetna reported the wrong
  // plan's benefits for the other patient — the bot contradicting the app it feeds.
  const insurerName = (request.insurer?.display ?? '').toLowerCase();
  const identity = insurerName.includes('uhc') || insurerName.includes('united')
    ? STEDI_IDENTITIES.uhc
    : STEDI_IDENTITIES.aetna;

  // Service type from the request when present; '30' (health benefit plan coverage) as the default.
  const serviceTypeCodes = request.item?.[0]?.category?.coding?.[0]?.code
    ? [request.item[0].category!.coding![0].code!]
    : ['30'];

  const stediBody = {
    provider: { npi: '1999999984', organizationName: 'Thaakat Health' },
    subscriber: identity.subscriber,
    encounter: { serviceTypeCodes },
    tradingPartnerServiceId: identity.tradingPartnerServiceId,
  };

  // 'U' means the payer did not determine whether auth is required. It is NOT a no, and it is NOT
  // a yes — keep it distinct all the way through so nothing downstream can collapse it into one.
  let authRequired: 'Y' | 'N' | 'U' | 'unknown' = 'unknown';
  let active = true;
  if (stediKey) {
    const data = await fetch(STEDI_URL, {
      method: 'POST',
      headers: { Authorization: stediKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(stediBody),
    }).then((r) => r.json() as Promise<StediEligibilityResponse>);
    const benefits = data.benefitsInformation ?? [];
    active = benefits.some((b) => b.code === '1') || (data.status ?? '').toLowerCase() === 'active';
    authRequired =
      benefits
        .map((b) => b.authOrCertIndicator)
        .find((v): v is 'Y' | 'N' | 'U' => v === 'Y' || v === 'N' || v === 'U') ?? 'unknown';
  }

  // CoverageEligibilityResponse.insurance[].coverage is REQUIRED (1..1) in R4, so carry through the
  // Coverage the request pointed at. Without one there is no valid response to write at all.
  const coverage = request.insurance?.[0]?.coverage as Reference<Coverage> | undefined;
  if (!coverage) {
    throw new Error('CoverageEligibilityRequest has no insurance[].coverage — cannot build a valid response.');
  }

  return medplum.createResource<CoverageEligibilityResponse>({
    resourceType: 'CoverageEligibilityResponse',
    status: 'active',
    purpose: ['benefits', 'auth-requirements'],
    patient: request.patient,
    created: new Date().toISOString(),
    request: createReference(request),
    outcome: 'complete',
    insurer: request.insurer,
    insurance: [
      {
        coverage,
        inforce: active,
        item: [
          {
            category: { coding: serviceTypeCodes.map((code) => ({ code })) },
            // Boolean cannot express "undetermined". Only 'Y' sets it true and only 'N' sets it
            // false; for 'U'/unknown the field is OMITTED, which is how FHIR says "not stated".
            // Writing false here would tell a clinician no prior auth is needed when the payer
            // never actually said that.
            authorizationRequired:
              authRequired === 'Y' ? true : authRequired === 'N' ? false : undefined,
          },
        ],
      },
    ],
  });
}
