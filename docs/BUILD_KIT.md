# Noor — Build Kit (the execution plan)

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
        ├──►  Moss  <10ms  ── criteria + patient history      (/api/moss/query, local fallback)
        ├──►  Radiomics  ── reads the scan (THE MOAT)          (/api/imaging/analyze)
        ├──►  Medplum  ── Bots write FHIR chart + referral     (/api/medplum/commit + bots/)
        └──►  Stedi  ── real-time eligibility (test mode)      (/api/eligibility)
```

What's already scaffolded in this repo:
- `app/intake` — the live demo UI (scripted flow → swap in live voice).
- `app/api/*` — working routes for Deepgram token, Moss retrieval (+fallback), imaging (stub), Stedi eligibility, Medplum write.
- `lib/*` — sponsor clients + the endo criteria corpus + prompts.
- `medplum/bots/*` — the two Bots (intake→FHIR via Claude, eligibility via Stedi).

---

## Suggested split (2 people)

**Person A — Voice + Retrieval (the "sensor"):**
- Wire the real **Deepgram Voice Agent** (`wss://agent.deepgram.com/v1/agent/converse`), `think.provider.type: "anthropic"`, model `claude-haiku-4-5`. Auth via the `/api/deepgram/token` route. Handle barge-in (`UserStartedSpeaking`).
- Define the agent's **client-side functions** (`retrieve_criteria`, `analyze_imaging`, `check_eligibility`, `commit_chart`) that call our API routes.
- Make retrieval **heavy**: fire several Moss lookups per turn (symptoms + history + imaging signals). Surface the `retrieval Nms` badge — it's the Moss+Deepgram co-dependency story.

**Person B — FHIR + Coverage + Imaging (the "record" + the moat):**
- Deploy the Medplum **Bots**; seed a synthetic patient + a `Coverage`. Verify `/api/medplum/commit` writes real resources (check the Medplum app).
- Wire **Stedi** test-mode eligibility for real; confirm `authOrCertIndicator` reads correctly; build the "covered / $X / prior-auth started" panel.
- Own the **imaging panel**: display a sample pelvic MRI with the radiomics overlay (regions from `lib/imaging.ts`). If Azra can drop in a real feature-extraction step, wire it behind `/api/imaging/analyze`; otherwise the curated findings are demo-ready. Frame as decision-support.

Converge by ~3pm on one clean end-to-end run. Record the video early.

---

## The demo (2 minutes, the winning run)

1. **Cold open (10s):** "Endometriosis takes 7–10 years to diagnose. Meet Noor." Open `/intake`.
2. **Voice interview (40s):** patient describes pelvic pain → Noor **adapts live**, pulling the next question from criteria via Moss (<10ms — point at the latency badge). The clinical picture fills in on screen.
3. **The scan — THE moment (30s):** "I had an MRI, they said it was normal." → Noor reads it and the overlay lights up: *"I'm seeing signs consistent with deep infiltrating endometriosis that routine reads miss."* Let it land.
4. **Clear the path (25s):** Noor checks coverage via Stedi live — "covered, ~$210, and I've started your prior auth" — and the FHIR chart + referral + PA Task populate in Medplum.
5. **Close (15s):** "Seven to ten years… in one conversation. Noor brings what's hidden into the light." → founder line: *"I did the radiomics research on this. I know why women wait a decade — and I built the fix."*

**Demo-hardening:** rehearse with the exact Stedi test values (`docs/SPONSORS.md`); keep the local Moss fallback on so retrieval can't fail; pre-load the sample MRI; have the `UHCINACTIVE` decline path ready as an "intentional" negative case.

---

## Submission form draft (fill/trim day-of)

- **Team name:** _(yours)_
- **Hack name + tagline:** **Noor — bringing what's hidden into the light. A voice-first diagnostic navigator that reads your scan and turns the 7–10 year endometriosis odyssey into one conversation.**
- **Problem:** Endometriosis takes women 7–10 years and 7+ doctors to diagnose. The signal is lost twice — in a spoken story that forms and rushed visits can't capture, and in imaging where the signs are routinely missed. Noor recovers both.
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
