// Medplum FHIR client (server-side, client-credentials) + chart-writing helper.
// Writes the structured picture Thaakat assembles as ONE transaction Bundle (the idiomatic Medplum
// way to commit a cross-referenced graph atomically): Observations, a provisional Condition, the
// DetectedIssue (author = radiomics Device, implicated = the cluster), a radiomics DiagnosticReport,
// ServiceRequest, Claim(use="preauthorization") + Task, and a Provenance proving it's AI-derived
// from the intake transcript (stored as a real Binary via DocumentReference — never base64).
//
// FHIR R4 only. Synthetic data only. Decision-support / navigation — never diagnosis.

import { MedplumClient, createReference } from '@medplum/core';
import type { Patient, DocumentReference, Reference, Coverage, Organization } from '@medplum/fhirtypes';
import { buildChartBundle, extractionFromChartInput } from './fhir/model';
import { resolveDemoPatient } from './demo-identity';
import { isPayerKey, recordEligibility, resolveCoverage, type EligibilitySummary } from './fhir/coverage';

let cached: MedplumClient | null = null;

export async function getMedplum(): Promise<MedplumClient | null> {
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
  if (!clientId || !clientSecret) return null;
  if (cached) return cached;
  const medplum = new MedplumClient({ baseUrl, fetch });
  try {
    await medplum.startClientLogin(clientId, clientSecret);
  } catch (e) {
    console.warn('[medplum] client login failed — falling back to dry-run:', (e as Error).message);
    return null;
  }
  cached = medplum;
  return medplum;
}

export type ChartInput = {
  patientId?: string;
  // The DemoPatient id from lib/clusters.ts ("maria"). Resolves to the seeded chart via the
  // identifier `pnpm seed` stamped on it, so the assembled picture is written ONTO her existing
  // record instead of onto a fresh empty Patient standing next to it.
  demoPatientId?: string;
  patientName?: { given: string; family: string };
  symptoms: string[]; // plain-language symptom snippets Thaakat captured
  imagingFindings?: string[]; // radiomics narration lines
  referral?: { specialty: string; imaging?: string; cptCode?: string };
  priorAuthRequired?: boolean;
  // Which Stedi test payer priced this (DemoPatient.payer). Resolves a real Coverage + payer
  // Organization so the prior-auth Claim points at resources instead of display-only stubs.
  payer?: string;
  // The eligibility answer already fetched by /api/eligibility, persisted here as the
  // CoverageEligibilityRequest/Response pair. Passed in rather than re-fetched so the chart
  // records the same answer the patient was actually told.
  eligibility?: EligibilitySummary;
  serviceTypeCodes?: string[];
  cluster?: { name: string; ask: string; confidence: number }; // the assembled pattern -> DetectedIssue
  transcript?: string; // raw intake transcript -> DocumentReference (Provenance source)
};

export type CommitResult = { dryRun: boolean; ids: Record<string, string>; note: string; error?: string };

// Writes the whole picture as a transaction. Returns created resource ids (or a dry-run echo).
export async function commitChart(input: ChartInput): Promise<CommitResult> {
  const medplum = await getMedplum();
  if (!medplum) {
    return {
      dryRun: true,
      ids: {},
      note: 'MEDPLUM creds not set — dry run. Set MEDPLUM_CLIENT_ID/SECRET to write real FHIR.',
    };
  }

  // 1. ensure a patient (created up front so the transcript Binary can bind securityContext to it)
  let patient: Patient;
  if (input.patientId) {
    patient = await medplum.readResource('Patient', input.patientId);
  } else if (input.demoPatientId) {
    // The seeded chart, resolved by identifier — see lib/demo-identity.ts. Without this the
    // commit lands on a fresh empty Patient and the assembled record has no history behind it.
    patient = await resolveDemoPatient(medplum, input.demoPatientId, input.patientName);
  } else {
    patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: [input.patientName?.given ?? 'Jane'], family: input.patientName?.family ?? 'Doe' }],
    });
  }
  const patientRef = createReference(patient);
  const ids: Record<string, string> = { [`Patient:${patient.id}`]: patient.id! };

  // 2. store the transcript as a real Binary via DocumentReference (securityContext = patient).
  //    Never base64 into Attachment.data — createDocumentReference does Binary + url + securityContext.
  let transcriptDoc: Reference<DocumentReference> | undefined;
  const transcript = input.transcript ?? (input.symptoms.length ? input.symptoms.join('\n') : undefined);
  if (transcript && typeof (medplum as { createDocumentReference?: unknown }).createDocumentReference === 'function') {
    try {
      const doc = await medplum.createDocumentReference({
        data: transcript,
        contentType: 'text/plain',
        filename: 'thaakat-intake.txt',
        securityContext: patientRef,
        additionalFields: {
          status: 'current',
          subject: patientRef,
          type: { text: 'Thaakat voice-intake transcript' },
        },
      });
      transcriptDoc = createReference(doc);
      ids[`DocumentReference:${doc.id}`] = doc.id!;
    } catch (e) {
      console.warn('[medplum] transcript store failed (continuing):', (e as Error).message);
    }
  }

  // 3. coverage — a real Coverage + payer Organization, and the payer's answer on the record.
  //    Failure here must not lose the clinical write: the assembled picture is the point, the
  //    price is context. Degrade to display-only stubs rather than dropping the whole commit.
  let coverageRef: Reference<Coverage> | undefined;
  let providerRef: Reference<Organization> | undefined;
  if (isPayerKey(input.payer)) {
    try {
      const { coverage, insurer } = await resolveCoverage(medplum, patientRef, input.payer);
      coverageRef = createReference(coverage);
      providerRef = createReference(insurer);
      ids[`Coverage:${coverage.id}`] = coverage.id!;

      if (input.eligibility) {
        const { request, response } = await recordEligibility({
          medplum,
          patient: patientRef,
          coverage,
          insurer,
          result: input.eligibility,
          serviceTypeCodes: input.serviceTypeCodes,
        });
        ids[`CoverageEligibilityRequest:${request.id}`] = request.id!;
        ids[`CoverageEligibilityResponse:${response.id}`] = response.id!;
      }
    } catch (e) {
      console.warn('[medplum] coverage write failed (continuing):', (e as Error).message);
    }
  }

  // 4. build the clinical graph from the structured extraction and commit it atomically.
  const extraction = extractionFromChartInput({ ...input, transcript });
  const bundle = buildChartBundle({
    patient: patientRef,
    extraction,
    transcriptDoc,
    coverage: coverageRef,
    provider: providerRef,
  });
  const result = await medplum.executeBatch(bundle);

  // 5. collect the created ids from the transaction response (location: "Type/{id}/_history/1")
  for (const entry of result.entry ?? []) {
    const loc = entry.response?.location;
    if (!loc) continue;
    const [type, id] = loc.split('/');
    if (type && id) ids[`${type}:${id}`] = id;
  }

  return { dryRun: false, ids, note: 'Wrote FHIR chart to Medplum as one transaction bundle.' };
}
