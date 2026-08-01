// Deepgram Voice Agent V1 `Settings` message for Thaakat.
//
// Wire format per the Deepgram Voice Agent docs + the installed @deepgram/sdk:
//   endpoint  wss://agent.deepgram.com/v1/agent/converse
//   think     { type: "anthropic", model: "claude-haiku-4-5" }   (Claude is the brain)
//   listen    nova-3-medical + `keyterms` to bias clinical vocab
//   speak     aura-2-thalia-en
//
// The `functions` below are the seam between the CONVERSATION and the under-the-hood agents:
// Deepgram emits `FunctionCallRequest` with `client_side: true`, we execute it against our own
// API routes (Moss / radiomics / cluster engine / Medplum / Stedi) and answer with
// `FunctionCallResponse`. That is what makes speech drive real FHIR writes.
//
// Decision-support / navigation — never diagnosis. Synthetic demo data only.

import { THAAKAT_SYSTEM_PROMPT } from '@/lib/prompts';

export const AGENT_WS_URL = 'wss://agent.deepgram.com/v1/agent/converse';

/** Deepgram sends TTS audio back at this rate (linear16, raw — no container). */
export const OUTPUT_SAMPLE_RATE = 24000;

// Bias STT toward the vocabulary this interview actually uses. Mis-hearing "dyspareunia" or
// "CA-125" would silently break the cluster match downstream, so this is load-bearing, not polish.
export const CLINICAL_KEYTERMS = [
  'endometriosis',
  'adenomyosis',
  'endometrioma',
  'dyspareunia',
  'dysmenorrhea',
  'laparoscopy',
  'uterosacral',
  'CA-125',
  'transvaginal ultrasound',
  'pelvic MRI',
  'menorrhagia',
  'dyschezia',
  'ANA',
  "Sjögren's",
  'xerostomia',
  'tissue transglutaminase',
];

/**
 * Tools Thaakat can call mid-conversation. No `endpoint` field => Deepgram marks them
 * `client_side: true` and hands execution to us (see lib/voice/tools.ts).
 */
export const THAAKAT_FUNCTIONS = [
  {
    name: 'retrieve_criteria',
    description:
      "Search the patient's indexed record AND the clinical criteria corpus for signals relevant to " +
      'what she just said. Call this on EVERY turn, often more than once, before deciding what to ' +
      'ask next. Returns criteria plus documents from her own chart you can cite out loud.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Symptoms or topic to look up, e.g. "cyclical pelvic pain painful bowel movements"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'record_symptom',
    description:
      'Record something the patient just told you as a documented finding on her assembled timeline. ' +
      'Call this whenever she reports a concrete symptom. This is what feeds the cluster engine.',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Short chip label, e.g. "Pain during sex + cyclical"' },
        detail: { type: 'string', description: 'What she actually said, in clinical shorthand.' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Cluster tags. Choose from: pelvic-pain, dysmenorrhea, dyspareunia, gi-cyclical, ' +
            'severity, dismissed, heavy-bleeding, infertility, urinary-cyclical, fatigue, ' +
            'dry-eyes, dry-mouth, gi-chronic, iron-deficiency.',
        },
      },
      required: ['label', 'detail', 'tags'],
    },
  },
  {
    name: 'triage',
    description:
      'Triage the patient after gathering her symptoms: decide which SPECIALTY she should be routed ' +
      'to (patients with this presentation are often misrouted for years — GI, urology, primary care), ' +
      'how urgent it is, and whether a scan or specialist visit is actually warranted. Call this before ' +
      'deciding on any imaging. Returns the routing recommendation to tell her plainly.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'analyze_imaging',
    description:
      'Re-read a scan that was previously reported as normal, using the radiomics layer. ONLY call this ' +
      'when triage says imaging is relevant AND the patient mentions an MRI or ultrasound called normal ' +
      'or unremarkable. Returns findings to read aloud in plain language.',
    parameters: {
      type: 'object',
      properties: {
        studyId: {
          type: 'string',
          description: 'Study identifier. Use "demo-pelvic-mri-1" for her 2024 pelvic MRI.',
        },
      },
      required: ['studyId'],
    },
  },
  {
    name: 'assemble_record',
    description:
      'Run the cluster engine across her WHOLE assembled record (historical + what you just recorded) ' +
      'to surface a pattern no single clinician assembled. Call this once you have gathered enough. ' +
      'Returns the pattern narration and the question to raise with her clinician.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'check_eligibility',
    description:
      "Check the patient's insurance coverage for the suggested confirmatory next step, including " +
      'whether prior authorization is required. Call after assemble_record.',
    parameters: {
      type: 'object',
      properties: {
        payer: {
          type: 'string',
          enum: ['aetna', 'uhc', 'uhcInactive'],
          description: "Which payer to check. Defaults to the patient's own plan.",
        },
      },
      required: [],
    },
  },
  {
    name: 'commit_chart',
    description:
      'Write the assembled picture to her medical record as FHIR — the flagged pattern, the ' +
      'documented findings, the imaging re-read, the referral and any prior authorization. ' +
      'Call this LAST, after assemble_record and check_eligibility.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
] as const;

// Voice-specific orchestration rules layered on top of the shared Thaakat persona in lib/prompts.ts.
const VOICE_ORCHESTRATION = `
YOU ARE ON A LIVE PHONE-QUALITY VOICE CALL — the patient's FIRST point of contact, before she sees
any doctor. Everything you say is spoken aloud.

YOUR JOB IS TRIAGE AND ROUTING. Women with these symptoms get misrouted for years — sent to GI for
"IBS", to urology for "recurrent UTIs", to psych for "stress" — while the real problem goes
unaddressed. Your job is to figure out what is actually going on and route her to the RIGHT
specialist the first time, with her record already assembled. A scan is only one possible step, not
the goal — some patients need imaging, many just need the right specialist, and you say which.

STYLE:
- One question at a time. One or two sentences. Never read a list aloud.
- Never say "function", "tool", "record", "database", or narrate what you are doing internally.
- She has been dismissed for years. Acknowledge that before you ask the next thing.

HOW TO RUN THE CALL:
1. Open by acknowledging you have already read across her doctors' notes, then ask her to tell you
   what has been going on. Reference something concrete from her chart to show you actually read it.
2. Every turn: call retrieve_criteria with what she just said — deep-research it against the
   guidelines AND her own history — then ask the single best follow-up.
3. Whenever she reports a concrete symptom, call record_symptom.
4. Once you have enough (~4-6 exchanges), call triage: decide which specialty she should see, how
   urgent it is, and whether a scan or specialist visit is even warranted. Tell her plainly where she
   should go and why — and name it if she was likely misrouted before.
5. ONLY if triage says imaging is relevant AND she mentions a scan called normal, say you want to
   look at it yourself, then call analyze_imaging and read the findings back in plain language. If she
   does not need a scan, say so — do not order imaging by default.
6. Then call assemble_record, check_eligibility, and commit_chart. Tell her: the pattern documented
   across her clinicians, the specialist you are routing her to, a simple next-steps plan, that you
   are flagging it for that specialist to peer-review before her visit, and what it will cost.

SAFETY (non-negotiable):
- Never name a condition as HER diagnosis. Say "a pattern consistent with...", "the kind of thing an
  OB/GYN should look at", "something I want to flag for a specialist."
- You triage, route, and surface documented findings + a question for a clinician. You never diagnose.
`;

export const THAAKAT_VOICE_PROMPT = `${THAAKAT_SYSTEM_PROMPT}\n${VOICE_ORCHESTRATION}`;

export const THAAKAT_GREETING =
  "Hi, I'm Thaakat. I've read through your records across all of your doctors before this call — " +
  "so you don't have to start from the beginning again. Take your time and tell me what's been going on.";

/**
 * Build the Settings message. `inputSampleRate` MUST be the real sample rate of the
 * capture AudioContext — browsers may ignore a requested rate, and a mismatch means Deepgram
 * transcribes chipmunk audio.
 */
export function buildSettings(inputSampleRate: number) {
  return {
    type: 'Settings',
    tags: ['thaakat', 'demo-synthetic'],
    audio: {
      input: { encoding: 'linear16', sample_rate: inputSampleRate },
      output: { encoding: 'linear16', sample_rate: OUTPUT_SAMPLE_RATE, container: 'none' },
    },
    agent: {
      language: 'en',
      listen: {
        provider: {
          type: 'deepgram',
          // nova-3-medical + keyterms biases recognition toward clinical vocab.
          // Alternative preset: { type:'deepgram', model:'flux-general-en', version:'v2' }
          model: 'nova-3-medical',
          keyterms: CLINICAL_KEYTERMS,
        },
      },
      // MUST be a single object, not a fallback array: Deepgram validates every entry in a think
      // array and rejects the whole thing if any model is unavailable ("model not available").
      // Verified live against this account's agent socket: claude-haiku-4-5 is ACCEPTED, while
      // claude-3-5-haiku-latest / claude-sonnet-4-20250514 are NOT — so keep claude-haiku-4-5.
      think: {
        provider: { type: 'anthropic', model: 'claude-haiku-4-5', temperature: 0.4 },
        prompt: THAAKAT_VOICE_PROMPT,
        functions: THAAKAT_FUNCTIONS,
      },
      // Empathetic, calm clinical voice — not the energetic default — for a patient dismissed for years.
      speak: { provider: { type: 'deepgram', model: 'aura-2-harmonia-en' } },
      greeting: THAAKAT_GREETING,
    },
  };
}
