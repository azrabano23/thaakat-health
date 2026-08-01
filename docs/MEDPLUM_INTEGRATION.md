# How Thaakat integrates with Medplum

Grounded in the Medplum monorepo (paths cited so anyone can verify). FHIR R4 only. Decision-support, never diagnosis. Synthetic data only.

## 1. Auth — default client + credentials

We authenticate the app server-side with **client credentials** (`lib/medplum.ts`):
```ts
await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET);
```
Every new Medplum project auto-creates a **`<Project> Default Client`** (`packages/server/src/fhir/operations/projectinit.ts`), already restricted to the project. We can drive the app with that default client's id/secret — it has read/write to all resource types out of the box. To constrain it (recommended, and required for multi-tenant), attach an **AccessPolicy** to the client's `ProjectMembership.access[].policy`. Keys stay server-side (`.env.local`, gitignored); the browser never sees them.

## 2. AccessPolicy — least privilege + multi-tenant

- **`medplum/access-policy.thaakat.json`** — fences the client to exactly the resource types Thaakat writes (Patient, Condition, Observation, DocumentReference, DiagnosticReport, DetectedIssue, Device, ServiceRequest, Claim, Task, Binary, Provenance) + read-only ImagingStudy/Subscription. Anything not listed is blocked.
- **`medplum/access-policy.multi-tenant.json`** — one parameterized template (`%organization`) bound to a concrete `Organization` per clinic on the membership, so a client in clinic A can't see clinic B. Tag a Patient into a tenant with `POST Patient/{id}/$set-accounts` (`{accounts: Organization/x, propagate: true}`) — Patient is the only type that propagates to its whole compartment.

## 3. The write — transcript → narrow FHIR set as ONE transaction

`lib/fhir/model.ts` is the shared data model (used by both the API route and the bot):
- A **vetted code table** (SNOMED/LOINC/CPT) the AI *selects* from — it never invents codes. Codes are placeholders flagged `verify: true`.
- `ClinicalExtraction` + `EXTRACTION_TOOL` — the exact contract the AI fills in (forced tool use), so the agent knows the data model instead of guessing at prose.
- `buildChartBundle()` → a `type:"transaction"` Bundle with `urn:uuid` fullUrls + `ifNoneExist` — Medplum rewrites the cross-references on commit (`packages/core/src/client.ts` `executeBatch`). One atomic write produces: Observations, a provisional Condition, the **DetectedIssue** (`author` = radiomics `Device`, `implicated` = the cluster, R4 `patient` field), a radiomics DiagnosticReport, ServiceRequest, `Claim(use="preauthorization")` + Task, and a **Provenance** whose `entity[].what` points at the transcript DocumentReference — proving every resource is AI-derived from that transcript.
- The transcript itself is stored as a real **Binary** via `createDocumentReference` (`securityContext` = patient) — never base64 in `Attachment.data` (per CLAUDE.md; Binary access is gated by securityContext because Binary isn't searchable).

Verified live: one `/api/medplum/commit` call writes **13 resources** atomically.

## 4. Bots + Subscriptions (enabled: bots, cron, ai, ai-realtime)

- **`medplum/bots/intake-to-fhir.ts`** — the same pattern on bot infra: force Claude to return `ClinicalExtraction` via `EXTRACTION_TOOL`, then `buildChartBundle` → `executeBatch`. Anthropic key is a Bot Secret.
- **`medplum/bots/reread-on-imaging.ts`** — the closed loop: a `Subscription` (criteria `ImagingStudy`, `rest-hook` → this bot, `subscription-supported-interaction: create` to avoid loops) re-runs the radiomics read on new imaging and files an updated DetectedIssue. Bot-channel subscriptions run **once, no retry** — the bot is idempotent (`upsertResource`).
- **`medplum/bots/eligibility.ts`** — coverage.
- Deploy (not on Vercel — Medplum's infra): `npx medplum bot deploy *`. `$ai` is available now the `ai` feature is on, but it's OpenAI-shaped — we call Anthropic directly from the bot with a Bot Secret.

## 5. Common-mistake guardrails (followed)

- Transaction (not batch) for cross-references, `urn:uuid` fullUrls.
- Idempotent writes via `ifNoneExist` / `upsertResource`, never search-then-create.
- Files via `createDocumentReference`/Binary + `securityContext`, never base64.
- Subscriptions scoped tightly; bot code idempotent (runs once, no retry).
- SNOMED/LOINC/ICD-10/CPT are placeholders flagged for human verification.
