# Noor — Teammate Brief (read this first)

> **Working name:** Noor (swappable). **One line:** *Noor is a voice-first diagnostic navigator for women's health that reads your scan and turns the 7–10 year endometriosis odyssey into one conversation.*
>
> This doc is written so both **you** and **your Claude/Cursor** can get the full picture fast. It's the "why," the "what," and the "how." The build details live in [`BUILD_KIT.md`](./BUILD_KIT.md); the coding rules live in [`../CLAUDE.md`](../CLAUDE.md).

---

## 0. TL;DR (30 seconds)

We're at the **YC × Medplum Agentic Healthcare Hackathon** (Sat Aug 1, YC SF). **1st prize = a YC interview.** Everyone in the room has Claude + the same 4 sponsor tools, so most teams will build the *same* thing: a voice agent that transcribes a patient and fills out a form (an "ambient scribe"). That space is a graveyard of well-funded incumbents — building it = instant loss.

**Our wedge is the one thing 40 other teams can't copy in a day: medical imaging.** Azra does radiomics (AI that reads MRI/ultrasound) on cardio-gynecologic health at RWJ. So Noor isn't "another voice agent" — it's a **multimodal diagnostic navigator** where voice is the sensor and the **radiomics model reading the scan is the moat.** We aim it at **endometriosis**, a condition that takes women **7–10 years and 7+ doctors** to get diagnosed, largely because the signal is missed — both in the patient's spoken story *and* in the imaging.

We use **all four sponsors** where each is genuinely load-bearing (details in §8), and the whole thing maps directly onto **YC's actual "AI Personalized Medicine" request for startups** and **Medplum's #1 2026 bet (prior-auth / interoperability compliance)**.

---

## 1. The problem (the human story + the numbers)

**Endometriosis** affects roughly **1 in 10 women** (~190M globally, ~6.5M in the US). The scandal isn't that it's rare — it's the **diagnostic odyssey**:

- Average **7–10 years** from first symptom to diagnosis.
- Patients see **7+ clinicians** on average before someone takes them seriously.
- The signal is lost in **two** places:
  1. **The spoken story.** The diagnostic clues live in a messy, stigmatized, longitudinal narrative ("stabbing pelvic pain since I was 14, hurts during sex, makes me vomit, 5 doctors said it was normal"). **Intake forms can't capture a narrative, and 8-minute visits don't have time** — plus shame shuts patients down in front of a human.
  2. **The imaging.** Endometriosis, adenomyosis, and deep infiltrating endometriosis (DIE) are **routinely missed on MRI/ultrasound** because standard radiology reads aren't looking for the subtle signs. Specialized protocols + AI (radiomics) can surface what the human eye skips.

So women bounce between GPs for a decade while the answer is often *already sitting in a scan nobody read carefully.* That's the problem Noor attacks.

---

## 2. Market & opportunity

- **Women's health / "femtech"** is one of the fastest-growing, most under-built verticals in healthcare — historically underfunded, now a clear investor focus.
- **Endometriosis is a wedge, not the whole market.** The same engine (voice narrative + imaging + coverage) generalizes to the rest of gynecologic and cardio-gynecologic care — PCOS, fibroids, adenomyosis, fertility workups.
- **Why now (three tailwinds):**
  1. **Voice AI just got good enough** to hold a real, adaptive clinical interview in real time (Deepgram + Claude).
  2. **Real-time retrieval got fast enough** (<10ms, Moss) to make that interview branch like a specialist without dead air.
  3. **Regulation is forcing the plumbing open:** CMS-0057-F requires payers to expose FHIR prior-auth/coverage APIs by **Jan 2027** — the interoperability we need is becoming mandatory.

---

## 3. Competitors & the gap (why the obvious idea loses)

The research is blunt: **the obvious builds are crowded with unicorns. The white space is the vertical + the imaging.**

**Ambient scribes — DO NOT BUILD (capital bloodbath):**
- Abridge **$5.3B**, Ambience **$1.25B**, Hippocratic AI **$3.5B**, Nabla $120M, Suki ~$168M, Nuance/DAX = Microsoft ($19.7B acq). Building another scribe in this room = instant death.

**Voice front-desk / patient access — mostly taken:**
- Assort Health **$1.2B** (patient access, scheduling, eligibility), Infinitus ~$103M (payer phone calls). Horizontal, not clinical.

**Prior-auth / RCM — a knife fight:**
- Cohere Health $200M, Anterior $64M, Latent Health $80M @ $600M (YC-backed), Develop Health, Candid $219M, Akasa $205M, Commure **$7B**, Innovaccer **$3.45B**. All **administrative**, mostly **B2B/payer-facing**.

**Patient-facing / "deep research" health copilots — big and generic:**
- OpenEvidence **$12B** (clinician-facing), plus ChatGPT Health / Claude Health / Perplexity Health all launched 2026. Generic Q&A, not condition-specific navigation.

### The gap (our opening)
Every one of those is **administrative**, **clinician-facing**, or **generic patient chat**. **Nobody owns condition-specific *clinical navigation* — the diagnostic odyssey — and nobody owns women's health.** And critically, **none of them read the imaging.** That intersection is wide open.

---

## 4. Our moat (why we can't be copied in a day — or a quarter)

Three moats, stacked:

1. **A hard modality most teams can't touch: medical imaging / radiomics.** Voice + LLM is commodity — everyone has it. An imaging model that flags the endo signs radiologists miss is *not* commodity, and Claude can't hand another hackathon team a radiomics pipeline in 6 hours. **This is the differentiator that answers "why can't the other 40 teams do this?"**
2. **Encoded domain knowledge.** *Which* signs, *which* MRI protocol, *which* diagnostic criteria — this is Azra's actual RWJ research (radiomics biomarker discovery, MRI/ultrasound AI, cardio-gynecologic risk). Not Google-able under time pressure.
3. **Founder-market fit.** Azra is a repeat medtech founder (~$7M raised), built AI triage/scheduling for women's health before, and did the endo radiomics research. On stage, "I lived this and did the science" makes the pitch *real* — that's what a YC partner underwrites.

> **The mental model:** the voice agent is the commodity wrapper everyone has. **The imaging model + domain expertise + founder is the moat.** We lead with the moat.

---

## 5. Why this gets the YC interview

- **It hits YC's *actual* written RFS.** YC's "AI Personalized Medicine" request asks for agents that *"analyze personalized health data — a diagnostic test, genome scan, EHR — to get highly accurate, user-specific suggestions… n=1… the future of intelligent personalized care."* **A radiomics model reading your scan is a bullseye.** (Note: "prior auth / eligibility" appears *nowhere* in the RFS — which is why coverage is our *supporting* feature, not the headline.)
- **It hits Medplum's #1 2026 bet.** Medplum's flagship push is prior-auth / interoperability compliance for the **CMS-0057-F Jan-2027 mandate.** Our coverage layer speaks directly to that — and to Cody Ebberson, whose *first* startup (MedXT) was **medical imaging.** An imaging project on Medplum FHIR is his origin story.
- **The panel tilts our way.** Of 6 judges: **Cody (Medplum, ex-medical-imaging)**, **Sri (Moss, real-time retrieval)**, and **Diana Hu (YC, technical partner who scores founder-market fit)** all lean toward exactly what we're strong at. Deepgram's two judges (Naomi, Victor) reward deep, real voice engineering, which our adaptive interview delivers.
- **It's a fundable *company*, not a feature.** Vertical wedge (endo) → platform (all of women's health) → the imaging + longitudinal data becomes a defensible data moat over time.

---

## 6. The solution (what Noor actually is)

**Noor is a voice-first, multimodal diagnostic navigator.** A woman talks to Noor before she ever sees a doctor. In one conversation, Noor:

1. **Listens** — conducts a warm, adaptive spoken interview that pulls out the real symptom narrative (the part forms and rushed visits lose).
2. **Reasons** — maps what she says against real endometriosis diagnostic criteria (ACOG/ESHRE), branching its questions like a specialist would.
3. **Reads the scan** — if she has a pelvic MRI/ultrasound, Noor's radiomics layer flags the findings a standard read misses, and explains them in plain language.
4. **Builds the chart** — writes a structured, physician-ready workup as real FHIR (the picture + the recommended next imaging/specialist).
5. **Clears the path** — checks in real time whether the recommended imaging is covered and what it'll cost, and whether prior auth is needed — so she actually goes.

Output: a decade-long odyssey compressed into **one 3-minute conversation** that hands both patient and doctor a clear, coded, coverage-checked next step.

> **Positioning guardrail:** Noor is **decision-support / navigation**, never "diagnosis." It flags, structures, and routes — a clinician decides. Say it this way on stage and in the code comments; it keeps us clinically and legally clean.

---

## 7. The flow (the demo, step by step)

This is also the demo script skeleton (full version in `BUILD_KIT.md`):

```
1. Patient opens Noor (browser). Clicks the mic.
   "Hi, I'm Noor. Tell me what's been going on."

2. She describes pelvic pain. Noor ADAPTS in real time —
   pulls the next best question from endo criteria via Moss (<10ms):
   "Is the pain cyclical — worse around your period? Any pain during sex?"
   → (the judges HEAR it think and branch)

3. As she talks, the on-screen "clinical picture" fills in live
   (symptoms → structured FHIR Observations/Condition via a Medplum bot).

4. "I actually had an MRI last month." → she drops in the scan.
   Noor's radiomics layer lights up the region a standard read missed:
   "I'm seeing signs consistent with deep infiltrating endometriosis here."
   → (THE gasp — no voice-agent team can show this)

5. Noor writes the workup + a ServiceRequest for the right specialist MRI,
   then checks coverage live via Stedi:
   "Good news — that MRI is covered under your plan, about $210 out of pocket,
    and it needs prior authorization, which I've started for you."

6. Screen shows the FHIR chart + referral + prior-auth Task populating in Medplum.
   Tagline: "Seven to ten years… in one conversation."
```

---

## 8. How we use EVERY sponsor (each is load-bearing, not bolted on)

The submission form literally asks how we used **Medplum, Stedi, Deepgram, Moss** — and each (except Stedi) has a judge. Here's the honest map:

### 🟦 Deepgram — the voice layer (the *sensor*)
- **Voice Agent API** (Flux STT + Aura TTS + barge-in), with **Claude as the "think" model** (Deepgram supports `anthropic` natively).
- **Why it's load-bearing, not a gimmick:** the diagnostic signal lives in the spoken narrative that forms/rushed visits destroy. Voice isn't the interface — it's how we *capture the data that makes everything else possible.* Delete voice → no narrative → no navigation.
- Free **$200 credit** on signup. There's an official `deepgram-devs/medplum-patient-intake-deepgram` reference app to fork for the plumbing (but everyone will fork it — we differentiate on top).

### 🟪 Moss — real-time retrieval (the thing most teams under-use)
- **<10ms in-process semantic search**, no vector DB. SDK: `@moss-dev/moss`.
- **Use it *deeply*, not as one RAG call.** Moss's pitch: "agents make dozens of lookups per turn; latency kills them." So every conversational turn, Noor retrieves **many** things at once — endo diagnostic criteria, prior similar imaging findings, the patient's longitudinal FHIR history, payer policy — all <10ms so the voice never lags.
- **This is the Deepgram↔Moss co-dependency** that wins *both* Sri and the Deepgram judges: low-latency voice is only possible with low-latency retrieval.

### 🟩 Medplum — the system of record (+ the imaging deep-cut)
- **FHIR datastore** for the whole chart: `Patient`, `Condition`, `Observation`, **`ImagingStudy` + `DiagnosticReport`** (radiomics output), `ServiceRequest` (referral), `Coverage`, `Task`, `Claim`.
- **Bots** (serverless TS) = the agent's hands — run Claude, write structured FHIR.
- **The deep cut:** ingest the scan via **Medplum's DICOM path** and store radiomics features as FHIR `Observation`s on a `DiagnosticReport`. Almost no team touches Medplum's imaging surface — and it's literally Cody's background.
- **Access policies + AuditEvent** = the "AI guardrails" story Medplum evangelizes. Put it in the pitch.
- ⚠️ **Bots are OFF by default / a paid feature** — we must confirm they're enabled on our hackathon project (see first-30-min in `BUILD_KIT.md`).

### 🟨 Stedi — the coverage / money layer (used honestly)
- **Real-time eligibility (270/271)** in free **test mode** with exact mock payers (Aetna/UHC/Cigna) that return real active-coverage responses instantly.
- The 271 response's **`authOrCertIndicator` (Y/N/U)** field tells us *whether a service needs prior auth* — a real, live payer signal that triggers our PA flow.
- **IMPORTANT — Stedi has NO prior-auth (278) submission API.** We do **not** fake one. Instead: Stedi tells us PA is *required* → **Medplum models the PA request as spec-correct FHIR** (`Claim(use="preauthorization")` + `Task`) → we simulate approval after a beat. The *reason* we can't submit it live is the exact gap **CMS-0057-F closes by Jan 2027** — which is a *stronger, more credible* story than pretending, and it flatters Medplum's whole roadmap.
- Bonus: Stedi ships an **MCP server** (`eligibility_check`, `search_for_payer`) Claude Code can call directly, and a `Stedi/amazon-connect-health-stedi` voice+eligibility reference repo.

---

## 9. Honest technical notes (don't get burned)

- **Stedi has no 278 API** — model prior auth as FHIR in Medplum (see §8). Don't claim a live Stedi PA call.
- **Medplum Bots are off by default (paid feature)** — confirm enabled on our project TODAY / first thing tomorrow.
- **Use SYNTHETIC data only.** Moss HIPAA and Deepgram BAA are Enterprise-only; never push real PHI through free tiers. All demo patients are fake.
- **Radiomics in 6 hours is the risk.** Plan: a believable, scoped imaging step (pre-computed findings + overlay on a sample pelvic MRI, with a clean "swap in the real model" seam). Even a scoped version wins on differentiation because *no one else has imaging at all.* Frame as detection/decision-support.
- **FHIR R4 only.** Claude/Cursor love to hallucinate R5 fields — the `CLAUDE.md` rules guard against this. Type everything with `@medplum/fhirtypes`.

---

## 10. What you (teammate) need to do

- **Read** this brief + `BUILD_KIT.md` + `CLAUDE.md`. Point your Claude/Cursor at `CLAUDE.md`.
- **Suggested split:** one of us owns **voice + retrieval** (Deepgram Agent + Moss + the interview logic), the other owns **FHIR + coverage + imaging panel** (Medplum bots + Stedi + the radiomics stub/UI). We converge on the demo.
- **First 30 minutes at the event** (critical, see `BUILD_KIT.md`): ① confirm Medplum **Bots enabled** ② grab Deepgram **$200 credit** ③ get **Stedi test-mode** key ④ get **Moss** keys + ask the founders (Sri's there) about credits.
- **Submission (due 5pm):** team name, problem statement, "how we used Medplum/Stedi/Deepgram/Moss," code repo link, and a **YouTube demo video** (required). Record the demo early — don't leave it to 4:55.

---

## 11. The one-liner to remember

> *"Everyone's building the voice scribe. We built the thing they can't: an AI that actually reads the scan — and turns a woman's 7-to-10-year diagnostic nightmare into one conversation."*
