# Sponsor setup & verified reference (keys, endpoints, gotchas)

Synthetic data only. Never put real PHI through free tiers (Moss/Deepgram BAA are Enterprise-only).

## 🟦 Deepgram (voice)
- **Sign up:** https://console.deepgram.com/signup → **$200 credit auto-applied**, no card. Create an API key.
- **Env:** `DEEPGRAM_API_KEY` (server only). Browser gets a short-lived token via `/api/deepgram/token` (`POST https://api.deepgram.com/v1/auth/grant`, 30s–3600s TTL).
- **Voice Agent API:** `wss://agent.deepgram.com/v1/agent/converse`. Configure via a `Settings` message:
  - `agent.listen.provider`: `{ type: "deepgram", model: "flux-general-en", version: "v2" }`
  - `agent.think.provider`: `{ type: "anthropic", model: "claude-haiku-4-5" }` (Claude is natively supported!)
  - `agent.speak.provider`: `{ type: "deepgram", model: "aura-2-thalia-en" }` (or `aura-2-andromeda-en` = healthcare persona)
  - `agent.think.functions[]`: define `retrieve_criteria`, `analyze_imaging`, `check_eligibility`, `commit_chart` (omit `endpoint` → handled client-side via `FunctionCallRequest`).
- **Barge-in:** handle `UserStartedSpeaking` → stop playback. SDKs: `@deepgram/sdk` (stable) or `@deepgram/agents` (browser, higher-level).
- **Fork for plumbing:** `github.com/deepgram-devs/medplum-patient-intake-deepgram` (official Medplum+Deepgram voice intake — everyone will fork it; differentiate on top).

## 🟪 Moss (real-time retrieval)
- **Sign up:** https://moss.dev → `project_id` + `project_key` (free tier, $5/mo credits). **Ask Sri (founder/judge) for hackathon credits.**
- **Env:** `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`.
- **SDK:** `pnpm add @moss-dev/moss` (or `pip install moss`). `new MossClient(id, key)` → `createIndex(name, docs)` → `loadIndex(name)` → `query(name, text, {topK, alpha})`. `alpha` 1.0=semantic, 0.0=keyword.
- **REST:** base `https://service.usemoss.dev/v1`, header `x-project-key`.
- **Use it heavy:** many small lookups per turn — that's the whole point (<10ms, no dead air). `lib/moss.ts` already wraps this **with an automatic local fallback** so the demo never fails if keys/SDK aren't ready.

## 🟩 Medplum (FHIR + bots)
- **Sign up:** https://app.medplum.com/register → create project. Create `ClientApplication` at `/admin/clients` → `client_id`/`client_secret`.
- **Env:** `NEXT_PUBLIC_MEDPLUM_BASE_URL=https://api.medplum.com/`, `MEDPLUM_CLIENT_ID`, `MEDPLUM_CLIENT_SECRET`.
- **⚠️ Bots are OFF by default (paid feature)** — confirm enabled on the hackathon project (Discord / a rep). Our build has a non-bot fallback (`/api/medplum/commit` writes via client-credentials), so bots are a bonus, not a blocker.
- **Deploy bots:**
  ```bash
  npm i -g @medplum/cli
  medplum login
  cd medplum
  # set the Bot ids in medplum.config.json, then:
  npx medplum bot deploy noor-intake-to-fhir
  npx medplum bot deploy noor-eligibility
  ```
  Store secrets on each Bot (Project Admin → Secrets): `ANTHROPIC_API_KEY`, `STEDI_API_KEY`.
- **Seed data:** clone `medplum-eligibility-demo` / `medplum-patient-intake-demo` and use their "Upload Core/Example data" buttons for instant Patient + Coverage + Questionnaire.
- **Imaging deep-cut:** store the scan as `ImagingStudy` + `Binary` (DICOM via the Medplum Agent if you want the flex), radiomics features as `Observation`s on a `DiagnosticReport`.

## 🟨 Stedi (eligibility / coverage)
- **Sign up:** https://stedi.com/create-sandbox (no card) → generate a **Test** API key.
- **Env:** `STEDI_API_KEY`.
- **Eligibility endpoint:** `POST https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3`, header `Authorization: <test-key>`.
- **Exact test-mode identities (must match exactly):**
  | Payer | tradingPartnerServiceId | Subscriber |
  |---|---|---|
  | Aetna | `60054` | Jane Doe, DOB `20040404`, member `AETNA12345` |
  | UnitedHealthcare | `87726` | Jane Doe, DOB `19710101`, member `UHC123456` |
  | UHC (inactive) | `87726` | Jane Doe, DOB `19710101`, member `UHCINACTIVE` |
  | Cigna | `62308` | James Jones, DOB `19910202`, member `23456789100` |
- **Prior auth:** read `benefitsInformation[].authOrCertIndicator` (`Y`/`N`/`U`). **Stedi has NO 278 submission API** — model the PA request as FHIR `Claim(use="preauthorization")` + `Task` in Medplum (already done in `lib/medplum.ts`).
- **Gotchas:** payer IDs are strings (keep leading zeros); send only required fields; 276/277 claim status is NOT in test mode.
- **Optional accelerator:** Stedi ships an **MCP server** (`eligibility_check`, `search_for_payer`) you can add to Claude Code: `claude mcp add --transport http stedi-healthcare https://mcp.us.stedi.com/2025-07-11/mcp --header "Authorization: $STEDI_API_KEY"`.
