// Stedi eligibility (270/271) helper — TEST MODE. Real endpoint, mock payers.
// Stedi has NO 278 prior-auth API: we only DETECT whether auth is required (authOrCertIndicator),
// then model the prior-auth request as FHIR Claim(use="preauthorization") in Medplum.

const STEDI_ELIGIBILITY_URL =
  'https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3';

// Exact test-mode identities that return canned ACTIVE coverage. Deviating from these values
// returns an error — use these exact values in the demo. (See docs/SPONSORS.md.)
export const MOCK_PATIENTS = {
  aetna: {
    tradingPartnerServiceId: '60054',
    subscriber: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '20040404', memberId: 'AETNA12345' },
  },
  uhc: {
    tradingPartnerServiceId: '87726',
    subscriber: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '19710101', memberId: 'UHC123456' },
  },
  uhcInactive: {
    tradingPartnerServiceId: '87726',
    subscriber: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: '19710101', memberId: 'UHCINACTIVE' },
  },
} as const;

export type EligibilityResult = {
  active: boolean;
  planName?: string;
  copay?: string;
  deductible?: string;
  priorAuthRequired: 'Y' | 'N' | 'U' | 'unknown';
  raw?: unknown;
};

// serviceTypeCode "30" = general health benefit plan coverage.
export async function checkEligibility(opts: {
  apiKey: string;
  patient: (typeof MOCK_PATIENTS)[keyof typeof MOCK_PATIENTS];
  serviceTypeCodes?: string[];
  npi?: string;
}): Promise<EligibilityResult> {
  const body = {
    provider: { npi: opts.npi ?? '1999999984', organizationName: 'Thaakat Health' },
    subscriber: opts.patient.subscriber,
    // '30' = general health benefit plan coverage; '62' = MRI/CAT scan — check the CONFIRMATORY
    // scan specifically (keep '30' so the cost card never empties if a payer omits STC-62).
    encounter: { serviceTypeCodes: opts.serviceTypeCodes ?? ['30', '62'] },
    tradingPartnerServiceId: opts.patient.tradingPartnerServiceId,
  };

  const res = await fetch(STEDI_ELIGIBILITY_URL, {
    method: 'POST',
    headers: { Authorization: opts.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Stedi eligibility failed: ${res.status} ${await res.text()}`);
  }
  const data: any = await res.json();

  const benefits: any[] = data.benefitsInformation ?? [];
  const active =
    (data.status ?? '').toLowerCase() === 'active' ||
    benefits.some((b) => b.code === '1' || /active/i.test(b.name ?? ''));

  // authOrCertIndicator: Y = prior auth required, N = not, U = undetermined. Per Stedi, an ABSENT
  // indicator means auth is NOT required — so default to 'N', never a misleading "unknown".
  const authFlag =
    benefits.map((b) => b.authOrCertIndicator).find((v) => v === 'Y' || v === 'N' || v === 'U') ?? 'N';

  const copayObj = benefits.find((b) => b.code === 'B'); // Co-Payment
  const dedObj = benefits.find((b) => b.code === 'C'); // Deductible

  return {
    active,
    // planCoverage is not a field in the 271 schema — read the real top-level plan info.
    planName: data.planInformation?.planName ?? data.planStatus?.[0]?.planDetails,
    copay: copayObj?.benefitAmount,
    deductible: dedObj?.benefitAmount,
    priorAuthRequired: authFlag as EligibilityResult['priorAuthRequired'],
    raw: data,
  };
}
