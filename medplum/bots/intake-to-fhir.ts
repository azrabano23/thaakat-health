// Medplum Bot: turns a voice-intake QuestionnaireResponse into structured FHIR using Claude.
// Deploy with the Medplum CLI (see docs/SPONSORS.md). Bots must be ENABLED on the project.
// Store the Anthropic key as a Bot Secret named ANTHROPIC_API_KEY.
import { BotEvent, MedplumClient, getQuestionnaireAnswers, createReference } from '@medplum/core';
import type { QuestionnaireResponse, Patient, Condition, Observation } from '@medplum/fhirtypes';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<any> {
  const response = event.input;
  const answers = getQuestionnaireAnswers(response);
  const transcript = answers['transcript']?.valueString ?? '';

  // Ask Claude to structure the free-text narrative into discrete symptoms (decision-support).
  const anthropicKey = event.secrets['ANTHROPIC_API_KEY']?.valueString;
  let symptoms: string[] = [];
  if (anthropicKey && transcript) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content:
              'Extract discrete patient-reported symptoms from this intake transcript as a JSON array of short strings. Do NOT diagnose. Transcript:\n' +
              transcript,
          },
        ],
      }),
    }).then((r) => r.json());
    try {
      const text = res?.content?.[0]?.text ?? '[]';
      symptoms = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    } catch {
      symptoms = transcript ? [transcript] : [];
    }
  } else {
    symptoms = transcript ? [transcript] : [];
  }

  const patient = await medplum.createResource<Patient>({
    resourceType: 'Patient',
    name: [{ given: ['Jane'], family: 'Doe' }],
  });
  const subject = createReference(patient);

  for (const s of symptoms.slice(0, 12)) {
    await medplum.createResource<Observation>({
      resourceType: 'Observation',
      status: 'preliminary',
      code: { text: 'Patient-reported symptom (Noor voice intake)' },
      valueString: s,
      subject,
    });
  }

  await medplum.createResource<Condition>({
    resourceType: 'Condition',
    verificationStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'provisional' }],
    },
    code: { text: 'Suspected endometriosis — for specialist evaluation (Noor navigator, not a diagnosis)' },
    subject,
  });

  return { patientId: patient.id, symptomCount: symptoms.length };
}
