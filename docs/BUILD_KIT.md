# Thaakat — Build Kit (the execution plan)

Everything you need to go from clone → working demo in one day. Read [`TEAMMATE_BRIEF.md`](./TEAMMATE_BRIEF.md) for the why, [`SPONSORS.md`](./SPONSORS.md) for exact keys/setup, and [`../CLAUDE.md`](../CLAUDE.md) for coding rules.

---

## First 30 minutes (do these before writing feature code)

1. **Medplum:** sign in at app.medplum.com, create a project, create a `ClientApplication` (grab `client_id`/`client_secret`). **CONFIRM BOTS ARE ENABLED** — ask a Medplum rep / in Discord. Bots are off by default and are the core of our build.
2. **Deepgram:** sign up → **$200 credit is automatic** → create an API key.
3. **Stedi:** create a sandbox at stedi.com/create-sandbox → generate a **Test** API key. Ask a rep to confirm test-mode eligibility is live.
4. **Moss:** sign up at moss.dev → get `project_id`/`project_key`. **Find Sri (Moss founder, he's a judge) and ask about hackathon credits + the fastest SDK path.**
5. `cp .env.example .env.local`, paste all keys, `pnpm install`, `pnpm dev`. Open `/intake`, hit **Play demo** — the scripted flow should run end-to-end against the real API routes.

---

## Architecture recap

```
Browser (Next.js/Vercel)  ──►  Deepgram Voice Agent (STT+TTS, think=Claude)
        │                              │ function calls
        │  every turn (retrieval-heavy)▼
        ├──►  Moss  <10ms  ── retrieve over the WHOLE record   (/api/moss/query, local fallback)
        ├──►  Radiomics  ── re-reads the under-read scan (MOAT) (/api/imaging/analyze)
        ├──►  Cluster engine ── assemble findings → match      (lib/clusters.ts)
        ├──►  Medplum  ── DetectedIssue + Dossier + referral   (/api/medplum/commit + bots/)
        └──►  Stedi  ── real-time eligibility (test mode)      (/api/eligibility)
```

What's already scaffolded in this repo:
- `app/intake` — the **record-assembly demo**: records connect → timeline assembles live → chart-aware Q → radiomics re-reads the under-read MRI → cluster lights up → Dossier / The Ask / The Cost.
- `app/api/*` — working routes: Deepgram token, Moss retrieval (+local fallback), imaging (radiomics stub), Stedi eligibility (test mode), Medplum write (DetectedIssue + chart + referral + PA).
- `lib/clusters.ts` — **the cluster engine**: the pre-seeded longitudinal record + 3 cluster definitions (endo / Sjögren's / celiac) + a transparent matcher.
- `lib/*` — sponsor clients + endo/imaging criteria corpus (Moss) + Thaakat prompts.
- `medplum/bots/*` — the two Bots (intake→FHIR via Claude, eligibility via Stedi).

---

## Suggested split (2 people)

**Person A — Voice + Retrieval (the "sensor"):**
- Wire the real **Deepgram Voice Agent** (`wss://agent.deepgram.com/v1/agent/converse`), `think.provider.type: "anthropic"`, model `claude-haiku-4-5`. Auth via the `/api/deepgram/token` route. Handle barge-in (`UserStartedSpeaking`).
- Define the agent's **client-side functions** (`retrieve_criteria`, `analyze_imaging`, `check_eligibility`, `commit_chart`) that call our API routes.
- Make retrieval **heavy**: fire several Moss lookups per turn (symptoms + history + imaging signals). Surface the `retrieval Nms` badge — it's the Moss+Deepgram co-dependency story.

**Person B — Record + Cluster + Coverage + Imaging (the "moat" + output):**
- Own the **cluster engine** (`lib/clusters.ts`): tune the seeded record + the 3 cluster definitions so endo lights up cleanly and the others stay quiet (specificity is the demo).
- Own the **imaging re-read**: sample pelvic MRI + radiomics overlay (`lib/imaging.ts`). If Azra drops in a real feature-extraction step, wire it behind `/api/imaging/analyze`; else the curated findings are demo-ready. Frame as decision-support.
- Deploy the Medplum **Bots**; verify `/api/medplum/commit` writes real resources incl. the **`DetectedIssue`** (check the Medplum app). Add `Provenance` links per finding if time allows.
- Wire **Stedi** test-mode eligibility for real; confirm `authOrCertIndicator`; build the "The Cost" panel.
- Own the **timeline-assembles** UI polish — that live build is the hero visual.

Converge by ~3pm on one clean end-to-end run. Record the video early.

---

## The demo (2–3 minutes, the winning run)

1. **Cold open (15s):** "A woman saw 5 doctors over 3 years. Every one did their job. Nobody's job was to read it all together." Open `/intake`, hit Play.
2. **Records assemble (25s):** Maria's record connects "via the patient-access APIs" and a **timeline assembles itself** — GP 2022, GI 2023, an *unremarkable* ultrasound, an **orphaned CA-125 nobody followed up**, an MRI called normal. Let the judges watch it build.
3. **Chart-aware interview (25s):** Thaakat asks about *her actual record* ("I see a CA-125 that was never followed up…") — Moss retrieved over the whole record in <10ms (point at the badge). She mentions pain during sex; it lands on the timeline.
4. **The imaging moment — THE gasp (30s):** "That MRI they called normal — let me look myself." → the **radiomics re-read lights up a deep-infiltrating-endometriosis nodule** and drops onto the timeline as *surfaced by Thaakat*.
5. **The pattern nobody assembled (20s):** the **cluster card lights up** — Endometriosis pattern, XX% match — with **The Ask** (a question for the clinician, never a diagnosis) and **The Cost** (live Stedi: covered, ~$210, prior auth started). FHIR incl. a `DetectedIssue` writes to Medplum.
6. **Close (20s):** "Reading a whole chart used to cost a physician-hour, so it was nobody's job. It now costs forty cents — and Thaakat caught the scan they missed." → founder line: *"I did the radiomics research on this. I know why women wait a decade — and I built the fix."*
7. **The "only endo?" back-pocket:** flip to `lib/clusters.ts`, show the Sjögren's + celiac definitions matching. 10 seconds = "system, not hardcoded."

**Demo-hardening:** rehearse with the exact Stedi test values (`docs/SPONSORS.md`); keep the local Moss fallback on so retrieval can't fail; pre-load the sample MRI; have the `UHCINACTIVE` decline path ready as an "intentional" negative case.

---

## Submission form draft (fill/trim day-of)

- **Team name:** _(yours)_
- **Hack name + tagline:** **Thaakat — bringing what's hidden into the light. A voice-first diagnostic navigator that reads your scan and turns the 7–10 year endometriosis odyssey into one conversation.**
- **Problem:** Diagnostic delay is a *structural* failure — the clues are already documented across specialists, but nobody's job is to read them together, and the confirming sign is often in a scan that was under-read. Thaakat assembles the whole record and re-reads the imaging, turning a 7–10 year odyssey (endometriosis first) into one conversation.
- **How we used each sponsor:**
  - **Deepgram** — Voice Agent API (Flux STT + Aura TTS + barge-in, Claude as the think model) runs the adaptive clinical interview that captures the narrative. Voice is the *sensor*, not a wrapper.
  - **Moss** — retrieval-heavy: every turn we do multiple <10ms lookups (diagnostic criteria + patient history) so the interview branches like a specialist with zero dead air.
  - **Medplum** — FHIR system of record; Bots turn the conversation + radiomics into `Condition`/`Observation`/`DiagnosticReport`/`ServiceRequest`/`Claim(preauthorization)`/`Task`; imaging stored as `ImagingStudy`/`DiagnosticReport`.
  - **Stedi** — real-time eligibility (test mode); `authOrCertIndicator` tells us prior auth is required, which we model as spec-correct FHIR (the exact interoperability gap CMS-0057-F closes by Jan 2027).
- **Repo:** _(GitHub link)_
- **YouTube demo:** _(link — record early!)_ · **Views:** _(update before submit)_

---

## Risks & fallbacks (so nothing breaks on stage)

| Risk | Fallback |
|---|---|
| Medplum Bots not enabled | `/api/medplum/commit` writes via client-credentials directly (already implemented); bots are a bonus |
| Moss SDK shape/keys | local retrieval fallback is automatic (`lib/moss.ts`) — demo still shows <10ms-class latency |
| Live Deepgram voice flaky | `/intake` scripted `Play demo` runs the whole flow against real routes |
| Radiomics model not ready | curated findings + overlay in `lib/imaging.ts`; frame as decision-support demo model |
| Stedi eligibility not enabled | `/api/eligibility` returns demo coverage if key absent; swap to real test key when live |
| Slow real payer (up to 60s) | use **test mode** (near-instant) for the live demo, not a real payer |
