// Medplum FHIR client (server-side, client-credentials) + chart-writing helpers.
// Writes the structured picture Noor builds: Condition, Observations, DiagnosticReport (radiomics),
// ServiceRequest (referral), Coverage, Claim(use="preauthorization"), Task (PA tracking).
// FHIR R4 only. Synthetic data only.

import { MedplumClient, createReference } from '@medplum/core';
import type {
  Patient,
  Condition,
  Observation,
  ServiceRequest,
  DiagnosticReport,
  DetectedIssue,
  Claim,
  Task,
} from '@medplum/fhirtypes';

let cached: MedplumClient | null = null;

export async function getMedplum(): Promise<MedplumClient | null> {
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
  if (!clientId || !clientSecret) return null;
  if (cached) return cached;
  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(clientId, clientSecret);
  cached = medplum;
  return medplum;
}

export type ChartInput = {
  patientId?: string;
  patientName?: { given: string; family: string };
  symptoms: string[]; // plain-language symptom snippets Noor captured
  imagingFindings?: string[]; // radiomics narration lines
  referral?: { specialty: string; imaging?: string; cptCode?: string };
  priorAuthRequired?: boolean;
  cluster?: { name: string; ask: string; confidence: number }; // the assembled pattern -> DetectedIssue
};

// Writes the whole picture as a transaction. Returns created resource ids (or a dry-run echo).
export async function commitChart(input: ChartInput): Promise<{ dryRun: boolean; ids: Record<string, string>; note: string }> {
  const medplum = await getMedplum();
  if (!medplum) {
    return {
      dryRun: true,
      ids: {},
      note: 'MEDPLUM creds not set — dry run. Set MEDPLUM_CLIENT_ID/SECRET to write real FHIR.',
    };
  }

  // ensure a patient
  let patient: Patient;
  if (input.patientId) {
    patient = await medplum.readResource('Patient', input.patientId);
  } else {
    patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: [input.patientName?.given ?? 'Jane'], family: input.patientName?.family ?? 'Doe' }],
    });
  }
  const subject = createReference(patient);
  const ids: Record<string, string> = { Patient: patient.id! };

  // symptoms -> Observations
  for (const s of input.symptoms.slice(0, 12)) {
    const obs = await medplum.createResource<Observation>({
      resourceType: 'Observation',
      status: 'preliminary',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
      code: { text: 'Patient-reported symptom (Noor voice intake)' },
      valueString: s,
      subject,
    });
    ids[`Observation:${obs.id}`] = obs.id!;
  }

  // working problem (decision-support, low certainty)
  const condition = await medplum.createResource<Condition>({
    resourceType: 'Condition',
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
    verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'provisional' }] },
    code: { text: 'Suspected endometriosis — for specialist evaluation (Noor navigator, not a diagnosis)' },
    subject,
  });
  ids['Condition'] = condition.id!;

  // the assembled cross-specialty pattern -> DetectedIssue ("nobody's job was to see this")
  if (input.cluster) {
    const issue = await medplum.createResource<DetectedIssue>({
      resourceType: 'DetectedIssue',
      status: 'preliminary',
      severity: 'moderate',
      code: { text: input.cluster.name },
      detail: input.cluster.ask,
      patient: subject,
    });
    ids['DetectedIssue'] = issue.id!;
  }

  // radiomics report
  if (input.imagingFindings?.length) {
    const report = await medplum.createResource<DiagnosticReport>({
      resourceType: 'DiagnosticReport',
      status: 'preliminary',
      code: { text: 'Pelvic MRI — radiomics decision-support (Noor)' },
      subject,
      conclusion: input.imagingFindings.join(' '),
    });
    ids['DiagnosticReport'] = report.id!;
  }

  // referral
  if (input.referral) {
    const sr = await medplum.createResource<ServiceRequest>({
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      code: {
        text: `${input.referral.imaging ?? 'Specialist referral'} — ${input.referral.specialty}`,
        coding: input.referral.cptCode ? [{ system: 'http://www.ama-assn.org/go/cpt', code: input.referral.cptCode }] : undefined,
      },
      subject,
      reasonReference: [createReference(condition)],
    });
    ids['ServiceRequest'] = sr.id!;

    // prior auth modeled as FHIR (Stedi has no 278 API — this is the spec-correct representation)
    if (input.priorAuthRequired) {
      const claim = await medplum.createResource<Claim>({
        resourceType: 'Claim',
        status: 'active',
        use: 'preauthorization',
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] },
        patient: subject,
        created: new Date().toISOString(),
        priority: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/processpriority', code: 'normal' }] },
        provider: { display: 'Noor (demo provider)' }, // Claim.provider is an org/practitioner ref
        insurance: [{ sequence: 1, focal: true, coverage: { display: 'Demo coverage' } }],
      });
      ids['Claim(preauth)'] = claim.id!;

      const task = await medplum.createResource<Task>({
        resourceType: 'Task',
        status: 'in-progress',
        intent: 'order',
        description: 'Prior authorization submitted for recommended imaging (Noor)',
        for: subject,
        focus: createReference(claim),
      });
      ids['Task(PA)'] = task.id!;
    }
  }

  return { dryRun: false, ids, note: 'Wrote FHIR chart to Medplum.' };
}
