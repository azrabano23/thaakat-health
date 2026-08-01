# Sponsor deep-dives — verified capabilities, ranked upgrades, honesty flags

Distilled from reading each sponsor's real repo + docs (Medplum, Moss, Deepgram) and Stedi's OpenAPI spec. Everything here is verified against source. **Bold = already shipped.** The "honesty flags" are what NOT to overclaim on stage — a sponsor's own engineer is judging.

---

## Medplum (FHIR system of record) — the deepest surface

**Shipped:** transaction-bundle writes (13 resources), `DetectedIssue` (author=Device, implicated=cluster), Provenance from transcript, `RiskAssessment` (carries the radiomics probability we were dropping) + `ClinicalImpression`, AccessPolicy (+ multi-tenant), 3 Bots deployed & **executing on real Lambdas**, local terminology CodeSystem + `$validate-code` helper.

**Highest-leverage remaining (ranked):**
1. **Scheduled (cron) re-score Bot** — a nightly bot searches the panel, re-runs the model, writes updated `RiskAssessment`/`DetectedIssue`. Turns "closed-loop" from slogan → real, without waiting for new imaging. (`cron` feature is enabled.)
2. **`useSubscription` live push** — `useSubscription('DetectedIssue?patient=…')` so the re-read finding pops on the console the instant the bot writes it. Two-line client add.
3. **`Patient/$summary` (IPS)** — one call renders the whole assembled record as a standards-based document (`Composition` + 18 LOINC sections). The literal "assemble the whole record" screen.
4. **`PlanDefinition/$apply` → CarePlan + Tasks** — auto-generate the workup. Medplum's own flagship example does exactly ClinicalImpression → $apply.
5. **MCP server** (`/mcp/stream`) — Claude connects to Medplum over MCP/OAuth and does FHIR natively. We're a Claude team; newest surface.
6. **Bot AuditEvent panel + `_history`** — render `AuditEvent?entity=Patient/{id}` as "what the AI did, when, outcome." Near-free compliance proof.

**Honesty flags:** on hosted `api.medplum.com`, per-request read/write AuditEvents are log-only (only Bot/Subscription events are queryable). `$ai` is OpenAI-shaped (Claude via LiteLLM `LLM_BASE_URL` or direct fetch). Loading a CodeSystem / setting ProjectSecrets needs a **project-admin** credential (our ClientApplication is non-admin — a human adds the `ANTHROPIC_API_KEY` secret + loads `codesystem.thaakat.json`).

---

## Deepgram (voice) — verified against @deepgram/sdk@5.7.0 types

**Shipped:** Voice Agent (`agent/converse`), Claude as `think` model + **fallback array so a bad model id can't silently kill live voice**, `nova-3-medical` + clinical keyterms, **empathetic `aura-2-harmonia-en` voice** (was the energetic thalia), barge-in, client-side function loop, server-minted token.

**Highest-leverage remaining:**
1. **Surface `LatencyReport`** — Deepgram hands per-stage timings (`stt_latency`, `ttt_tool_latency`, `tts_latency`, `total_latency`); we drop them. Put the end-to-end number on the HUD next to Moss's 8 ms — it's *their* metric.
2. **Flux eager-EOT "fast lane"** (`model:'flux-general-en'`, `eager_eot_threshold:0.4`) — the only way to truly start retrieval *before she finishes*; hot-swap via `sendUpdateListen` to show you command both. Keeps keyterms.
3. **`InjectAgentMessage(behavior:"queue")`** before the two slow tools (radiomics, commit) — "let me pull that scan up," instant, bypasses the LLM. Deepgram's own recommended pattern.
4. Numbers/units prompting (say "C-A one twenty-five", "one and a half centimeters", "March 2024") for lab/imaging readback; expand keyterms to ~30–40.

**Honesty flags:** **`claude-haiku-4-5` is NOT in Deepgram's enumerated managed Anthropic list** (`claude-3-5-haiku-latest`, `claude-sonnet-4-20250514`) — verify at the venue via `settings.think.models.list()`; our fallback array covers it. **`eager_eot` / "before she finishes" is Flux-only, impossible on nova-3-medical** — don't claim eager-EOT while running Nova. The managed agent gives no partial/interim transcripts (no word-by-word captions). Flux *TTS* voices are Early-Access — demo on Aura-2 only.

---

## Moss (real-time retrieval) — real, YC-backed (InferEdge), Rust core via NAPI

**Shipped:** `MossClient` → createIndex/loadIndex/query over the record + criteria corpus, server-side, ~8 ms, local cosine fallback if keys absent.

**Verified API:** `query(index, text, {topK, alpha, filter, embedding})`. **`alpha` = semantic↔BM25 weight (1.0 semantic, 0.0 keyword, default 0.8).** Full metadata filter operators (`$eq/$gt/$in/$and/$or/$near`). `query_multi_index` (record + criteria in one call, tagged by source). `SessionIndex` (local per-visit memory, `push_index()` for handoff). Ambient-retrieval pattern (query every turn *before* the LLM).

**Highest-leverage remaining:**
1. **Alpha tuning by query type** — drop alpha (~0.3–0.5, BM25 weight) for exact clinical terms (CA-125, ICD codes, "endometrioma"); keep high (~0.85) for symptom narrative. Catnip for a retrieval judge.
2. **One index per patient** (not one big index + `user_id` filter) — retrieval cost decoupled from patient-base size; swap on patient change.
3. **`query_multi_index`** across record-index + criteria-index in a single call → straight into the cluster engine.
4. **Metadata filters** (`modality ∈ {MRI,US}`, date ≥ …) to power the under-read-scan re-read.
5. **SessionIndex** for live-visit memory + cross-clinician handoff.

**Honesty flags (important):** the ~8 ms is **query-only, warm, post-`loadIndex`, pure-semantic, on a laptop** (Moss's own benchmark: P50 3.1 ms). State the condition: "8 ms is the in-process query once the patient's index is loaded; the one-time load is a separate network pull." Moss is a **native NAPI addon → cannot run on Vercel Edge**, and on Node serverless each cold start re-loads the runtime — so **hold the index in a warm long-lived process / module singleton**, not a cold lambda per turn, or the 8 ms evaporates. If index isn't loaded, `query()` silently falls back to a slower cloud HTTP call. No built-in re-ranking/streaming. The index artifact lives on Moss Cloud — synthetic data only.

---

## Stedi (eligibility) — **CONFIRMED sponsor** (named in the judging rubric)

Verified against Stedi's OpenAPI spec. **Sponsor status: confirmed** — the Medplum announcement lists Stedi as a hackathon technology *and names it in the scored judging criteria*.

**Shipped:** real 270/271 eligibility (test-mode Aetna 60054 / UHC 87726 — all our values verified correct), `authOrCertIndicator` → PA modeled as FHIR `Claim(preauthorization)`+`Task`. **Fixed two real bugs:** `planName` read a non-existent field (`b.planCoverage`); `priorAuthRequired` defaulted to "unknown" when Stedi says absent = **N (not required)**. Now also checks **STC 62 (MRI)**, not just generic 30.

**Highest-leverage remaining:** richer cost parse (coinsurance `A`/`benefitPercent`, out-of-pocket `G`, deductible remaining via `timePeriodQualifierCode` 23-vs-29), in-network filtering (`inPlanNetworkIndicatorCode==='Y'`), the **Stedi MCP server** (`mcp.us.stedi.com`) to back the voice agent's `check_eligibility`.

**Honesty flags:** **NO 278 prior-auth API exists** (verified — Stedi routes real PA to third-party vendors / Da Vinci CRD); our FHIR Claim(preauth)+Task model is the correct answer, not a shortcut. Auth header: bare key works (verified 200); if a live call 401s, try the `Key ` prefix. `UHCINACTIVE` exact string unverified — confirm in the portal before demoing the decline path.
