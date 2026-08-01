// Medplum Bot: turns a voice-intake transcript into a NARROW, correct set of FHIR R4 resources.
//
// The AI layer is the interesting part: instead of asking Claude for free-text symptoms, we force
// it to call ONE tool (EXTRACTION_TOOL) whose JSON schema IS our data model — so it returns the
// ClinicalExtraction shape, selecting codes from a vetted table rather than inventing them. We then
// write the whole cross-referenced graph as a single transaction Bundle (see lib/fhir/model.ts),
// with a Provenance proving every resource is AI-derived from this transcript.
//
// Deploy with the Medplum CLI (Bots must be ENABLED — they are). Store the Anthropic key as a Bot
// Secret named ANTHROPIC_API_KEY. Decision-support / navigation — never diagnosis. Synthetic only.
import { BotEvent, MedplumClient, getQuestionnaireAnswers, createReference } from '@medplum/core';
import type { QuestionnaireResponse, Patient, DocumentReference, Reference } from '@medplum/fhirtypes';
import { EXTRACTION_TOOL, buildChartBundle, type ClinicalExtraction } from '../../lib/fhir/model';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<any> {
  const answers = getQuestionnaireAnswers(event.input);
  const transcript = answers['transcript']?.valueString ?? '';

  // 1. resolve the patient (from the QuestionnaireResponse.subject, or create a synthetic one)
  let patientRef = event.input.subject as Reference<Patient> | undefined;
  if (!patientRef) {
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: ['Jane'], family: 'Doe' }],
    });
    patientRef = createReference(patient);
  }

  // 2. store the raw transcript as a real Binary via DocumentReference (securityContext = patient)
  let transcriptDoc: Reference<DocumentReference> | undefined;
  if (transcript) {
    try {
      const doc = await medplum.createDocumentReference({
        data: transcript,
        contentType: 'text/plain',
        filename: 'thaakat-intake.txt',
        securityContext: patientRef,
        additionalFields: { status: 'current', subject: patientRef, type: { text: 'Thaakat voice-intake transcript' } },
      });
      transcriptDoc = createReference(doc);
    } catch (e) {
      console.warn('[intake-to-fhir] transcript store failed (continuing):', (e as Error).message);
    }
  }

  // 3. the AI layer: force Claude to return the ClinicalExtraction structure via tool use.
  let extraction: ClinicalExtraction = { findings: [], transcript };
  const anthropicKey = event.secrets['ANTHROPIC_API_KEY']?.valueString;
  if (anthropicKey && transcript) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: 'tool', name: EXTRACTION_TOOL.name },
        messages: [
          {
            role: 'user',
            content:
              'Extract discrete clinical findings from this patient intake transcript into the ' +
              'structured record. Decision-support only — never diagnose. Only select an ' +
              'observationKey from the provided enum; omit it if nothing fits.\n\nTranscript:\n' +
              transcript,
          },
        ],
      }),
    }).then((r) => r.json());
    const toolUse = (res?.content ?? []).find((c: { type?: string }) => c.type === 'tool_use') as
      | { input?: Partial<ClinicalExtraction> }
      | undefined;
    if (toolUse?.input?.findings?.length) {
      extraction = { ...(toolUse.input as ClinicalExtraction), transcript };
    }
  }

  // 4. write the whole graph atomically (Observations, Condition, DetectedIssue, Provenance, …)
  const bundle = buildChartBundle({ patient: patientRef, extraction, transcriptDoc });
  const result = await medplum.executeBatch(bundle);
  const written = (result.entry ?? []).map((e) => e.response?.location).filter(Boolean);

  return { findingCount: extraction.findings.length, written };
}
