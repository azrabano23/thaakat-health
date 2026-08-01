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
  copay?: string; // code B — flat patient portion ($)
  coinsurance?: string; // code A — patient % share, formatted "20%"
  deductible?: string; // code C — remaining/annual deductible ($)
  outOfPocket?: string; // code G — out-of-pocket max / stop-loss ($)
  priorAuthRequired: 'Y' | 'N' | 'U' | 'unknown';
  authNote?: string; // when prior auth is 'U', the payer's free-text clarification
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

  // Pick the benefit for a cost code, preferring in-network (Y) or applies-to-both (W) — otherwise
  // the first out-of-network figure could overstate what she actually owes.
  const pick = (code: string) => {
    const matches = benefits.filter((b) => b.code === code);
    return matches.find((b) => b.inPlanNetworkIndicatorCode === 'Y' || b.inPlanNetworkIndicatorCode === 'W') ?? matches[0];
  };
  // Co-Payment (B) / Deductible (C) / Out-of-Pocket max (G) carry benefitAmount ($); Co-Insurance (A)
  // carries benefitPercent (decimal, e.g. "0.20" = the patient's 20% share).
  const coinsurancePct = pick('A')?.benefitPercent;
  // When prior auth is 'U' (payer can't determine in real time), the clarification is free-text.
  const uBenefit = benefits.find((b) => b.authOrCertIndicator === 'U');
  const authNote =
    (uBenefit?.additionalInformation ?? [])
      .map((a: { description?: string }) => a.description)
      .filter(Boolean)
      .join(' ') || undefined;

  return {
    active,
    // benefitsInformation[].planCoverage IS a real 271 field — the plan/product name (e.g. "Gold
    // 1-2-3"), sent when code is 1–8 and STC 30 is present. Fall back to the plan-info object.
    planName: benefits.find((b) => b.planCoverage)?.planCoverage ?? data.planInformation?.planName,
    copay: pick('B')?.benefitAmount,
    coinsurance: coinsurancePct ? `${Math.round(parseFloat(coinsurancePct) * 100)}%` : undefined,
    deductible: pick('C')?.benefitAmount,
    outOfPocket: pick('G')?.benefitAmount,
    priorAuthRequired: authFlag as EligibilityResult['priorAuthRequired'],
    authNote,
    raw: data,
  };
}
