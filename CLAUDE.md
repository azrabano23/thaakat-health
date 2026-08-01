# CLAUDE.md — Agent rules for the Noor repo

You are helping build **Noor**, a voice-first, multimodal diagnostic navigator for women's health (endometriosis-first), for the **YC × Medplum Agentic Healthcare Hackathon**. Read [`docs/TEAMMATE_BRIEF.md`](docs/TEAMMATE_BRIEF.md) for the full why/what and [`docs/BUILD_KIT.md`](docs/BUILD_KIT.md) for the build plan before making changes in an area.

## What we're building (context)
Noor assembles a woman's WHOLE longitudinal record across specialists, **re-reads the under-read scan**, and surfaces the pattern nobody assembled. Flow: Deepgram voice → Claude brain → Moss (<10ms retrieval over the whole record) → **cluster engine (`lib/clusters.ts`)** → Medplum (`DetectedIssue` + Dossier FHIR) → Stedi (coverage). The **moat is the imaging/radiomics re-read + the record assembly**; voice is the sensor. **Decision-support, never diagnosis.** Keep all four sponsors load-bearing. The demo lives in `app/intake/page.tsx` (scripted → swap in live voice).

## Golden rules
- **FHIR R4 only.** Type every FHIR object with `@medplum/fhirtypes`. Do **not** invent fields, search params, or operations — LLMs routinely blend in R5/deprecated fields; that's a silent bug. If unsure, check the Medplum docs before writing.
- **Synthetic data only.** Never use real patient data. Moss HIPAA / Deepgram BAA are Enterprise-only; free tiers are not for PHI. All demo patients are fake.
- **Clinical framing:** this is **decision-support / navigation, never "diagnosis."** Comments, UI copy, and prompts must say "flag / suggest / consistent with," not "diagnose."
- **Secrets:** never hardcode API keys. Use env vars (`.env.local`, see `.env.example`). Never ship a key to the browser — mint short-lived tokens server-side (Deepgram) and keep Stedi/Medplum/Anthropic keys in API routes / bots only.
- **Keep it demo-able.** Every feature must survive a live demo. Prefer a working scoped version + a clean "swap in the real thing" seam over an ambitious thing that breaks on stage.

## Stack & conventions
- **Next.js (App Router) + TypeScript**, deployed on **Vercel**. UI in `app/`, server logic in `app/api/*/route.ts`, shared code in `lib/`.
- **Package manager: pnpm.** (`pnpm install`, `pnpm dev`, `pnpm build`.)
- Medplum **Bots** live in `medplum/bots/` and deploy via the Medplum CLI (NOT Vercel) — they run on Medplum's infra.
- Prefer real Medplum patterns over generic FHIR. Reuse `@medplum/core` helpers (`createReference`, `getQuestionnaireAnswers`, etc.) and `@medplum/react` components (`QuestionnaireForm`, `ResourceTable`, `DiagnosticReportDisplay`) instead of hand-rolling.

## Sponsor integration cheat-sheet (verified)
- **Deepgram Voice Agent API:** WS `wss://agent.deepgram.com/v1/agent/converse`. `think.provider.type: "anthropic"` with `model: "claude-haiku-4-5"` (or `claude-sonnet-5`). Browser auth = short-lived token via `POST https://api.deepgram.com/v1/auth/grant` (mint in an API route). Barge-in = handle `UserStartedSpeaking` / interrupt playback. STT model `flux-general-en`; TTS `aura-2-thalia-en` (or `aura-2-andromeda-en`, the healthcare persona).
- **Moss:** `@moss-dev/moss` (or `pip install moss`). `new MossClient(projectId, projectKey)` → `createIndex` → `loadIndex` → `query(indexName, text, {topK, alpha})`. Use it **retrieval-heavy** (many lookups/turn). **Fallback:** if Moss keys are absent, use an in-memory cosine-similarity search over `lib/criteria.ts` with local embeddings so the demo never hard-fails.
- **Medplum:** hosted at `https://api.medplum.com/fhir/R4`. `MedplumClient` from `@medplum/core`; client-credentials via `startClientLogin(id, secret)`. Bots: `handler(medplum, event)` → `medplum.createResource(...)`. Call Claude from a bot via the built-in `$ai` op **or** just `fetch` `https://api.anthropic.com/v1/messages` with a bot secret. ⚠️ Bots must be **enabled** on the project (paid feature — confirm at the event).
- **Stedi:** eligibility `POST https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3`, header `Authorization: <test-key>`. **Test-mode mock payers** (exact values required): Aetna `tradingPartnerServiceId:"60054"` (Jane Doe, DOB `20040404`, member `AETNA12345`); UHC `"87726"` (Jane Doe, DOB `19710101`, member `UHC123456`; `UHCINACTIVE` for the decline path). Read `benefitsInformation[].authOrCertIndicator` (Y/N/U) for prior-auth-required. **Stedi has NO 278 API** — model prior auth as FHIR `Claim(use="preauthorization")` + `Task` in Medplum; simulate approval.

## Common Medplum mistakes to avoid
- Bundles that cross-reference need `type: "transaction"` + `urn:uuid` fullUrls, not `batch`.
- Idempotent writes: use conditional create keyed on `identifier` (`createResourceIfNoneExist`), never search-then-create.
- Files/images: use `createBinary`/`createAttachment` → `Binary/{id}` url + `securityContext`; never base64 in `Attachment.data`.
- Subscriptions: scope `criteria` tightly; Bot-channel subscriptions run **once, no retry** — make bot code idempotent.
- Codes (SNOMED/LOINC/ICD-10/CPT): agents hallucinate these — use a clearly-marked placeholder and flag for human verification.

## Before you finish a change
- Re-check against the rules above.
- `pnpm build` (or `tsc --noEmit`) must pass — a hallucinated field on a typed FHIR resource becomes a compile error, which is the point.
- Keep conversations scoped to one task; re-read the relevant doc if context was summarized.
