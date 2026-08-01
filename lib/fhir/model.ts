// The Thaakat clinical data model — how a voice transcript becomes a NARROW, correct set of FHIR R4
// resources. This is the single source of truth shared by the API route (lib/medplum.ts) and the
// Medplum Bot (medplum/bots/intake-to-fhir.ts), so "what the agent extracts" and "what we write to
// FHIR" can never drift apart.
//
// Three parts:
//   1. CODES  — a VETTED code table the AI *selects* from (it must never invent SNOMED/LOINC/CPT).
//   2. ClinicalExtraction + EXTRACTION_TOOL — the exact contract the AI fills in from the transcript.
//   3. buildChartBundle — assembles a `type: "transaction"` Bundle (urn:uuid cross-refs, ifNoneExist),
//      the idiomatic Medplum way to write a cross-referenced graph atomically.
//
// Decision-support / navigation — never diagnosis. Codes below are PLACEHOLDERS flagged for human
// verification (verify: true) per CLAUDE.md; the point is that the agent chooses from a vetted list
// instead of hallucinating a code.

import { randomUUID } from 'node:crypto';
import { createReference } from '@medplum/core';
import type {
  Bundle,
  BundleEntry,
  Patient,
  Condition,
  Observation,
  DiagnosticReport,
  DetectedIssue,
  RiskAssessment,
  ClinicalImpression,
  Device,
  ServiceRequest,
  Claim,
  Task,
  Provenance,
  DocumentReference,
  Reference,
  CodeableConcept,
} from '@medplum/fhirtypes';

/* ────────────────────────────────────────────────────────────────────────────
   1. Vetted code table — the agent SELECTS a key; we own the actual code.
   `verify: true` = confirm the exact code with a human before any real clinical use.
   ──────────────────────────────────────────────────────────────────────────── */

export const SYSTEMS = {
  snomed: 'http://snomed.info/sct',
  loinc: 'http://loinc.org',
  icd10: 'http://hl7.org/fhir/sid/icd-10-cm',
  cpt: 'http://www.ama-assn.org/go/cpt',
  obsCategory: 'http://terminology.hl7.org/CodeSystem/observation-category',
  condClinical: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  condVerStatus: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  claimType: 'http://terminology.hl7.org/CodeSystem/claim-type',
  processPriority: 'http://terminology.hl7.org/CodeSystem/processpriority',
} as const;

type CodeDef = { system: string; code: string; display: string; verify?: boolean };

// Conditions (SNOMED CT) the cluster engine can raise. Provisional, decision-support only.
export const CONDITION_CODES = {
  endometriosis: { system: SYSTEMS.snomed, code: '129103003', display: 'Endometriosis (disorder)', verify: true },
  adenomyosis: { system: SYSTEMS.snomed, code: '79924004', display: 'Adenomyosis', verify: true },
  sjogrens: { system: SYSTEMS.snomed, code: '83901003', display: "Sjögren's syndrome", verify: true },
  celiac: { system: SYSTEMS.snomed, code: '396331005', display: 'Coeliac disease', verify: true },
} satisfies Record<string, CodeDef>;
export type ConditionCodeKey = keyof typeof CONDITION_CODES;

// Observations — labs (LOINC) + patient-reported findings (a survey Observation carries valueString).
export const OBSERVATION_CODES = {
  patientReported: { system: SYSTEMS.loinc, code: '75325-1', display: 'Symptom', verify: true },
  ca125: { system: SYSTEMS.loinc, code: '10334-1', display: 'Cancer Ag 125 [Units/vol] in Serum or Plasma', verify: true },
  hemoglobin: { system: SYSTEMS.loinc, code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood', verify: true },
  ferritin: { system: SYSTEMS.loinc, code: '2276-4', display: 'Ferritin [Mass/volume] in Serum or Plasma', verify: true },
  crp: { system: SYSTEMS.loinc, code: '1988-5', display: 'C reactive protein [Mass/volume] in Serum or Plasma', verify: true },
  ana: { system: SYSTEMS.loinc, code: '5048-4', display: 'Antinuclear Ab [Titer] in Serum by IF', verify: true },
} satisfies Record<string, CodeDef>;
export type ObservationCodeKey = keyof typeof OBSERVATION_CODES;

// Confirmatory next steps (CPT) a ServiceRequest can order.
export const PROCEDURE_CODES = {
  pelvicMriEndo: { system: SYSTEMS.cpt, code: '72197', display: 'MRI pelvis without and with contrast', verify: true },
  ssaSsbPanel: { system: SYSTEMS.cpt, code: '86235', display: 'Extractable nuclear antigen antibody (anti-Ro/La)', verify: true },
  ttgIga: { system: SYSTEMS.cpt, code: '83516', display: 'Tissue transglutaminase IgA', verify: true },
} satisfies Record<string, CodeDef>;
export type ProcedureCodeKey = keyof typeof PROCEDURE_CODES;

function concept(def: CodeDef | undefined, text?: string): CodeableConcept | undefined {
  if (!def) return text ? { text } : undefined;
  return { coding: [{ system: def.system, code: def.code, display: def.display }], text: text ?? def.display };
}

/* ────────────────────────────────────────────────────────────────────────────
   2. The extraction contract — what the AI pulls from the transcript, and the
   tool schema that tells it EXACTLY what shape to return (so it can't freelance).
   ──────────────────────────────────────────────────────────────────────────── */

export type ExtractedFinding = {
  text: string; // the documented finding, in the patient's / chart's words
  kind: 'symptom' | 'sign' | 'lab' | 'history';
  observationKey?: ObservationCodeKey; // agent selects from OBSERVATION_CODES; omit if none fits
  value?: string; // for labs: "48 U/mL"; for symptoms: severity phrasing
  onset?: string; // e.g. "since age 12" or an ISO date
  severity?: 'mild' | 'moderate' | 'severe';
  bodySite?: string;
};

export type ClinicalExtraction = {
  chiefComplaint?: string;
  findings: ExtractedFinding[];
  imagingFindings?: string[]; // radiomics narration lines (from the re-read)
  cluster?: { name: string; ask: string; confidence: number; conditionKey?: ConditionCodeKey };
  referral?: { specialty: string; procedureKey?: ProcedureCodeKey; display?: string };
  priorAuthRequired?: boolean;
  transcript?: string; // raw transcript → DocumentReference (Provenance source)
};

// The Anthropic tool the extraction agent must call. Passing this as `tools` forces Claude to return
// the ClinicalExtraction shape above — the agent knows the data model instead of guessing at prose.
export const EXTRACTION_TOOL = {
  name: 'record_clinical_findings',
  description:
    'Extract discrete clinical findings from a patient intake transcript into a structured, ' +
    'decision-support record. Never diagnose. Select an observationKey / conditionKey / procedureKey ' +
    'ONLY from the provided enums; if nothing fits, omit it (do not invent codes).',
  input_schema: {
    type: 'object',
    properties: {
      chiefComplaint: { type: 'string', description: 'One-line presenting problem in the patient’s words.' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            kind: { type: 'string', enum: ['symptom', 'sign', 'lab', 'history'] },
            observationKey: { type: 'string', enum: Object.keys(OBSERVATION_CODES) },
            value: { type: 'string' },
            onset: { type: 'string' },
            severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
            bodySite: { type: 'string' },
          },
          required: ['text', 'kind'],
        },
      },
    },
    required: ['findings'],
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
   3. Transaction-Bundle builder. Every cross-reference is a urn:uuid fullUrl that
   Medplum rewrites to a real id on commit; the whole graph writes atomically.
   The Patient and the (optional) transcript DocumentReference are created BEFORE
   this bundle (the transcript needs Binary + securityContext, which is its own
   flow — see lib/medplum.ts), and passed in as references.
   ──────────────────────────────────────────────────────────────────────────── */

export type ChartBundleInput = {
  patient: Reference<Patient>;
  extraction: ClinicalExtraction;
  transcriptDoc?: Reference<DocumentReference>; // Provenance source, if the transcript was stored
};

const urn = () => `urn:uuid:${randomUUID()}`;

export function buildChartBundle({ patient, extraction, transcriptDoc }: ChartBundleInput): Bundle {
  const entries: BundleEntry[] = [];
  const provenanceTargets: Reference[] = [];
  const add = (resource: BundleEntry['resource'], url: string, ifNoneExist?: string): string => {
    const fullUrl = urn();
    entries.push({ fullUrl, resource, request: { method: 'POST', url, ifNoneExist } });
    provenanceTargets.push({ reference: fullUrl });
    return fullUrl;
  };

  // symptoms / signs / labs → Observations (survey category; labs carry a coded LOINC + value)
  const implicated: Reference[] = [];
  for (const f of extraction.findings.slice(0, 16)) {
    const codeDef = f.observationKey ? OBSERVATION_CODES[f.observationKey] : undefined;
    const obs: Observation = {
      resourceType: 'Observation',
      status: 'preliminary',
      category: [{ coding: [{ system: SYSTEMS.obsCategory, code: f.kind === 'lab' ? 'laboratory' : 'survey' }] }],
      code: concept(codeDef, f.text)!,
      valueString: f.value ?? f.text,
      subject: patient,
      ...(f.bodySite ? { bodySite: { text: f.bodySite } } : {}),
    };
    const ref = add(obs, 'Observation');
    implicated.push({ reference: ref });
  }

  // working problem — provisional, low certainty (decision-support, never a diagnosis)
  const clusterCode = extraction.cluster?.conditionKey ? CONDITION_CODES[extraction.cluster.conditionKey] : undefined;
  const conditionUrn = add(
    {
      resourceType: 'Condition',
      clinicalStatus: { coding: [{ system: SYSTEMS.condClinical, code: 'active' }] },
      verificationStatus: { coding: [{ system: SYSTEMS.condVerStatus, code: 'provisional' }] },
      code: concept(clusterCode, extraction.cluster?.name ?? 'Suspected condition — for specialist evaluation (not a diagnosis)'),
      subject: patient,
    } as Condition,
    'Condition',
  );
  implicated.push({ reference: conditionUrn });

  // the assembled cross-specialty pattern → DetectedIssue.
  // R4-correct: author = the radiomics Device, patient (NOT subject), implicated[] = the resources
  // that form the cluster, evidence.detail → the Condition. This is "nobody's job was to see this."
  if (extraction.cluster) {
    const deviceUrn = add(
      { resourceType: 'Device', status: 'active', deviceName: [{ name: 'Thaakat radiomics decision-support model', type: 'model-name' }] } as Device,
      'Device',
    );
    add(
      {
        resourceType: 'DetectedIssue',
        status: 'preliminary',
        severity: 'moderate',
        code: { text: extraction.cluster.name },
        detail: extraction.cluster.ask,
        patient,
        author: { reference: deviceUrn },
        implicated,
        evidence: [{ detail: [{ reference: conditionUrn }] }],
      } as DetectedIssue,
      'DetectedIssue',
    );
  }

  // radiomics re-read → DiagnosticReport (conclusion carries the narration lines)
  let imagingReportUrn: string | undefined;
  if (extraction.imagingFindings?.length) {
    imagingReportUrn = add(
      {
        resourceType: 'DiagnosticReport',
        status: 'preliminary',
        code: { text: 'Pelvic MRI — radiomics decision-support (Thaakat, investigational)' },
        subject: patient,
        conclusion: extraction.imagingFindings.join(' '),
      } as DiagnosticReport,
      'DiagnosticReport',
    );
  }

  // numeric radiomics/cluster score → RiskAssessment (the 0..1 confidence finally has a home), and the
  // assembled cross-specialty pattern → ClinicalImpression (its semantic home). Decision-support, never
  // diagnosis. RiskAssessment is added first so the ClinicalImpression can point its prognosis at it.
  if (extraction.cluster) {
    const riskUrn = add(
      {
        resourceType: 'RiskAssessment',
        status: 'preliminary',
        subject: patient,
        occurrenceDateTime: new Date().toISOString(),
        method: { text: 'Thaakat radiomics texture classifier (investigational)' },
        basis: [{ reference: imagingReportUrn ?? conditionUrn }],
        prediction: [
          {
            outcome: { text: extraction.cluster.name },
            probabilityDecimal: extraction.cluster.confidence,
            rationale: extraction.cluster.ask,
          },
        ],
      } as RiskAssessment,
      'RiskAssessment',
    );

    add(
      {
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: patient,
        date: new Date().toISOString(),
        summary: `${extraction.cluster.name} — ${extraction.cluster.ask}`,
        investigation: [{ code: { text: 'Assembled cross-specialty record' }, item: implicated }],
        finding: [{ itemReference: { reference: conditionUrn } }],
        prognosisReference: [{ reference: riskUrn }],
      } as ClinicalImpression,
      'ClinicalImpression',
    );
  }

  // referral → ServiceRequest, with prior auth modeled as Claim(preauthorization) + Task
  if (extraction.referral) {
    const proc = extraction.referral.procedureKey ? PROCEDURE_CODES[extraction.referral.procedureKey] : undefined;
    const srUrn = add(
      {
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'order',
        code: concept(proc, `${extraction.referral.display ?? 'Specialist referral'} — ${extraction.referral.specialty}`),
        subject: patient,
        reasonReference: [{ reference: conditionUrn }],
      } as ServiceRequest,
      'ServiceRequest',
    );

    if (extraction.priorAuthRequired) {
      const claimUrn = add(
        {
          resourceType: 'Claim',
          status: 'active',
          use: 'preauthorization',
          type: { coding: [{ system: SYSTEMS.claimType, code: 'professional' }] },
          patient,
          created: new Date().toISOString(),
          priority: { coding: [{ system: SYSTEMS.processPriority, code: 'normal' }] },
          provider: { display: 'Thaakat (demo provider)' },
          insurance: [{ sequence: 1, focal: true, coverage: { display: 'Demo coverage' } }],
          diagnosis: [{ sequence: 1, diagnosisReference: { reference: conditionUrn } }],
        } as Claim,
        'Claim',
      );
      add(
        {
          resourceType: 'Task',
          status: 'in-progress',
          intent: 'order',
          description: 'Prior authorization submitted for recommended imaging (Thaakat)',
          for: patient,
          focus: { reference: claimUrn },
          basedOn: [{ reference: srUrn }],
        } as Task,
        'Task',
      );
    }
  }

  // Provenance — prove every resource above is AI-derived from THIS transcript (audit trail).
  const provenance: Provenance = {
    resourceType: 'Provenance',
    target: provenanceTargets,
    recorded: new Date().toISOString(),
    activity: { text: 'Thaakat voice-intake extraction (decision-support)' },
    agent: [
      {
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type', code: 'assembler' }] },
        who: { display: 'Thaakat AI extraction agent' },
      },
    ],
    ...(transcriptDoc ? { entity: [{ role: 'source', what: transcriptDoc }] } : {}),
  };
  entries.push({ fullUrl: urn(), resource: provenance, request: { method: 'POST', url: 'Provenance' } });

  return { resourceType: 'Bundle', type: 'transaction', entry: entries };
}

// Map the demo's loose Finding/cluster shape into the structured ClinicalExtraction contract.
// (The live voice path produces this directly via the EXTRACTION_TOOL; this adapter keeps the
// scripted demo and the older API payloads flowing through the same builder.)
export function extractionFromChartInput(input: {
  symptoms: string[];
  imagingFindings?: string[];
  referral?: { specialty: string; imaging?: string; cptCode?: string };
  priorAuthRequired?: boolean;
  cluster?: { name: string; ask: string; confidence: number };
  transcript?: string;
}): ClinicalExtraction {
  const inferCondition = (name?: string): ConditionCodeKey | undefined => {
    const n = (name ?? '').toLowerCase();
    if (n.includes('endometrios')) return 'endometriosis';
    if (n.includes('sjög') || n.includes('sjog')) return 'sjogrens';
    if (n.includes('celiac') || n.includes('coeliac')) return 'celiac';
    return undefined;
  };
  const inferProcedure = (cpt?: string): ProcedureCodeKey | undefined => {
    if (cpt === '72197') return 'pelvicMriEndo';
    if (cpt === '86235') return 'ssaSsbPanel';
    if (cpt === '83516') return 'ttgIga';
    return undefined;
  };
  return {
    findings: input.symptoms.map((s) => ({ text: s, kind: 'symptom' as const })),
    imagingFindings: input.imagingFindings,
    cluster: input.cluster
      ? { ...input.cluster, conditionKey: inferCondition(input.cluster.name) }
      : undefined,
    referral: input.referral
      ? { specialty: input.referral.specialty, display: input.referral.imaging, procedureKey: inferProcedure(input.referral.cptCode) }
      : undefined,
    priorAuthRequired: input.priorAuthRequired,
    transcript: input.transcript,
  };
}
