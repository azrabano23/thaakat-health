# Thaakat 🩺🎙️ — read this first (teammate brief)

> **Thaakat** (نور — Urdu/Arabic for *"strength"*). **One line:**
> **Thaakat is a voice agent that reads a woman's *whole* medical record — including the scan that was under-read — and assembles the picture nobody's job was to see, turning a 7–10 year diagnostic odyssey into one conversation.**
>
> This README is the full brief for the team (human + your Claude/Cursor). Deeper docs: [`docs/BUILD_KIT.md`](docs/BUILD_KIT.md) (build plan), [`docs/SPONSORS.md`](docs/SPONSORS.md) (exact keys/setup), [`CLAUDE.md`](CLAUDE.md) (coding rules).
>
> ⚕️ **Decision-support / navigation — never "diagnosis."** Thaakat surfaces documented findings + a question for a clinician. Synthetic demo data only.

---

## 0. TL;DR (30 seconds)

We're at the **YC × Medplum Agentic Healthcare Hackathon** (Sat Aug 1, YC SF). **1st prize = a YC interview.** Everyone has Claude + the same 4 sponsor tools, so most teams build the *same* thing — a voice scribe that fills a form. That's a graveyard of funded unicorns (Abridge $5.3B, Ambience $1.25B…). Building it = instant loss.

**Thaakat's wedge is two things nobody else combines:**
1. **Record assembly** — diagnostic delay is a *structural* failure: the clues are already in the chart, scattered across specialists, but **nobody's job is to read them together.** Thaakat is the thing that reads everything and assembles the picture.
2. **The imaging moat** — the orphaned clue is often a **scan that was under-read.** Thaakat's radiomics layer re-reads the MRI/ultrasound and catches what a routine read misses. This is Azra's actual research — a hard modality 40 other teams *cannot* replicate in a day.

**Beachhead: endometriosis / women's health** — longest delay, highest stigma, and Azra's domain.

---

## 1. The problem (the human story + the evidence)

A woman drinks four liters of juice a day because her mouth won't make spit; she can't cry because her eyes won't make tears. Over years, an ophthalmologist treats her dry eyes, a dentist treats her dry mouth, a GP treats her fatigue. It was **Sjögren's** — an autoimmune disease. Every clinician did their job. **Nobody's job was to read the documents together.**

Diagnostic delay is usually blamed on "some diseases are hard." It mostly isn't — **the information is already in the chart, sometimes for years.** The failure is structural: nobody is assigned to assemble the patient's picture across specialties, so the patient cycles through specialists, each treating one fragment, each visit billable, and no billing code for "assembly" means no role, no metric, no training.

**The evidence this is real, not a sad anecdote:**
- **Mayo Clinic** re-assembled 286 already-diagnosed records from scratch: 21% got a *completely different* diagnosis, 66% refined — **88% of the time, one person reading everything changed the answer.**
- **Hardeep Singh's group:** 31% of colorectal and 38% of lung cancers had a **red flag already documented and never acted on.** Lung patients with a missed clue: 132 days to diagnosis vs. 19 without.
- **The Sjögren's Foundation** just told dentists + eye doctors "dry eyes + dry mouth, think of this" — average delay fell from ~6 years to 2.8. *Connecting two dots halved a six-year delay.*
- The pattern repeats: **endometriosis 4–11 years (7 doctors first)**, Ehlers-Danlos ~10 years, lupus 6–7 years.
- **~795,000 Americans die or are permanently disabled every year from diagnostic error** (BMJ Quality & Safety, 2023).
- NIH's Undiagnosed Diseases Network does this assembly *by hand*: 35% solve rate, **~$19,000/case.** An LLM assembly pass costs about **$0.40.**
- **Why now:** a 2022 federal rule forces hospitals to expose complete records via patient-access APIs, and CMS-0057-F forces payers to expose FHIR prior-auth/coverage APIs by **Jan 2027.** *The pipes are open. Nobody built the thing that runs on top.*

**And the second failure — imaging:** for endometriosis specifically, the signs (deep infiltrating endometriosis, adenomyosis, endometriomas) are **routinely missed on MRI/ultrasound** because standard reads aren't looking for them. So the answer is often *already sitting in a scan nobody read carefully.* Thaakat catches both halves.

---

## 2. Market & opportunity

- **Women's health / femtech** — one of the fastest-growing, most under-built verticals; endometriosis alone affects ~1 in 10 women (~190M globally, ~6.5M US).
- **Endo is the wedge, not the market.** The same engine (assemble the record + read the imaging + voice) generalizes to any multi-system, delayed, or under-read condition — the record-assembly layer is horizontal, the imaging deepens the moat.
- **Why now (three tailwinds):** (1) voice AI can finally hold a real adaptive clinical interview; (2) real-time retrieval (<10ms, Moss) makes it happen *inside* the conversation; (3) the record + coverage pipes are now open by federal mandate.

---

## 3. Competitors & our gap

**The obvious builds are crowded with unicorns:**
- **Ambient scribes — DO NOT BUILD:** Abridge $5.3B, Ambience $1.25B, Hippocratic $3.5B, Nabla $120M, Suki ~$168M, Nuance/DAX = Microsoft.
- **Voice front-desk / access:** Assort $1.2B, Infinitus ~$103M — horizontal, administrative.
- **Prior-auth / RCM:** Cohere $200M, Anterior $64M, Latent $80M@$600M, Candid $219M, Commure $7B, Innovaccer $3.45B — all admin, B2B/payer-facing.
- **Record-reading copilots:** OpenEvidence $12B (clinician-facing) + ChatGPT Health / Claude Health / Perplexity Health (2026) — **generic Q&A over records.**

**Our gap:** every one of them is administrative, clinician-facing, or generic chat — and **none of them read the imaging, and none own a stigmatized vertical.** The intersection of *patient-facing record assembly + radiomics re-read + women's health* is open. Crucially, it's what separates us from the record-copilots: they can read text; **we read the pixels a radiologist skipped**, and that's not commodity.

---

## 4. Our moat (why we can't be copied in a day — or a quarter)

1. **A hard modality: radiomics / imaging.** Text-record RAG is commodity (that's why OpenEvidence/ChatGPT Health exist). An imaging model that flags the endo signs a routine read misses is *not* — and Claude can't hand another team a radiomics pipeline in 6 hours.
2. **Encoded domain knowledge** — *which* signs, *which* MRI protocol, *which* criteria. Azra's actual RWJ research (radiomics biomarker discovery, MRI/ultrasound AI, cardio-gynecologic risk).
3. **Founder-market fit** — Azra: repeat medtech founder (~$7M raised), built AI triage/scheduling for women's health, did the endo radiomics research. "I lived this and did the science" is what a YC partner underwrites.

> **Mental model:** the record-assembly + voice is the beautiful, generalizable engine (steal the framing from every great diagnostic-delay pitch). **The imaging + domain + founder is the defensible moat.** We lead with the moat.

---

## 5. Why this gets the YC interview

- **Hits YC's actual RFS ("AI Personalized Medicine"):** *"analyze personalized health data — a diagnostic test, genome scan, EHR — for highly accurate, user-specific suggestions… n=1."* A radiomics re-read + record assembly is a bullseye.
- **Hits Medplum's #1 2026 bet:** prior-auth / interoperability compliance (CMS-0057-F, Jan 2027) — our coverage layer speaks to it, and to **Cody Ebberson, whose first startup (MedXT) was medical imaging.**
- **The panel tilts our way:** Cody (Medplum, ex-imaging), Sri (Moss, real-time retrieval), Diana Hu (YC, scores founder-fit) all lean toward our strengths; Deepgram's judges (Naomi, Victor) reward real voice engineering.
- **A fundable company, not a feature:** vertical wedge (endo) → platform (any delayed/under-read condition) → the assembled longitudinal + imaging data becomes a defensible data moat.

---

## 6. The solution + the flow (the demo)

**Thaakat reads everything and assembles the picture.** Demo (2–3 min):

```
1. Patient ("Maria") connects her records — pre-seeded, framed as via the federal patient-access APIs.
2. She talks to Thaakat. Questions are CHART-AWARE:
   "I see a pelvic ultrasound from last year and an ANA lab nobody followed up — tell me about the pain."
   (Moss retrieves over her whole record in <10ms, so Thaakat asks the right thing INSIDE the conversation.)
3. THE MOMENT — a timeline assembles itself on screen: dental note, ultrasound 2024,
   an orphaned positive lab from 2025 nobody acted on, today's story. A cluster card lights up.
4. THE IMAGING MOMENT (our moat): "That pelvic MRI they called normal — let me look myself."
   The radiomics layer lights up a uterosacral nodule: "signs consistent with deep infiltrating
   endometriosis that routine reads miss." (the gasp)
5. Sixty seconds later, three outputs:
   • The Dossier — a one-page clinician brief; every claim links to its source document (Provenance).
   • The Ask — "worth discussing a laparoscopy referral / endo-protocol MRI" — a question, never a diagnosis.
   • The Cost — live Stedi check: "$38 on your plan, deductible met."
6. Close: "Reading a whole chart used to cost a physician-hour, so it was nobody's job.
   It now costs forty cents — and Thaakat caught the scan they missed. Seven to ten years… in one conversation."
```

**Safety rule (non-negotiable, and our answer to judges):** Thaakat never names a condition to the patient. It surfaces **documented findings + a recognized cluster + a question for the clinician**, who can independently check every source. That keeps us in clinical-decision-support territory, not diagnosis.

---

## 7. How we use EVERY sponsor (all load-bearing — the submission form scores this)

- **🟦 Deepgram** — Voice Agent API (Nova-3/Flux STT tuned on clinical vocab so it won't mangle "furosemide," Aura TTS, barge-in), **Claude as the `think` model.** We tune `eager_eot_threshold` so retrieval starts *before* Maria finishes her sentence — no awkward pause. Voice is the *sensor* that captures what the chart doesn't have.
- **🟪 Moss** — the whole multi-year record indexed **in-browser**, sub-10ms, no network hop. This is what physically makes "chart-aware questions in real time" possible (a cloud vector DB is too slow for the turn gap). Bonus talking point: **the record never leaves the device.** Use it retrieval-heavy — many lookups per turn.
- **🟩 Medplum** — the record IS FHIR (`Encounter`/`Observation`/`DocumentReference`/`ImagingStudy`/the orphaned lab). Bots + the `$ai` op (with `fhir_request` tools) write `DetectedIssue` + the Dossier + `DocumentReference`, each with a `Provenance` link; prior auth as `Claim(use="preauthorization")`. Clinician view from `@medplum/react`. ⚠️ Bots are OFF by default — confirm enabled at the event (we have a non-bot fallback).
- **🟨 Stedi** — `CoverageEligibilityRequest` → real 270/271 eligibility (test mode) → the copay for the confirmatory test/imaging. Closes the loop from "pattern found" to "actionable step with a price." **Stedi has no 278 API** — we model prior auth as FHIR (the exact gap CMS-0057-F closes by 2027 = a *stronger* story than faking it).

**The "generalizable, not hardcoded" tell:** we ship **3 cluster definitions** (endometriosis + Sjögren's + one more), not 1 — that's the difference between "demo" and "system" when a judge asks.

---

## 8. Honest notes (don't get burned)

- **Stedi has no prior-auth (278) API** — model PA as FHIR `Claim(use="preauthorization")` + `Task`.
- **Medplum Bots are OFF by default (paid feature)** — confirm enabled TODAY / first thing tomorrow. Non-bot fallback exists (`/api/medplum/commit`).
- **Synthetic data only** — Moss HIPAA / Deepgram BAA are Enterprise-only; never real PHI on free tiers.
- **Radiomics in 6 hrs is the risk** — curated findings + overlay on a sample MRI, with a clean "swap in the real model" seam (`lib/imaging.ts`). Frame as decision-support.
- **FHIR R4 only** — LLMs hallucinate R5 fields; `CLAUDE.md` guards this. Type everything with `@medplum/fhirtypes`.

---

## 9. Quickstart

```bash
pnpm install
cp .env.example .env.local   # fill keys — see docs/SPONSORS.md
pnpm dev                     # http://localhost:3000  →  /intake  →  "Play demo"
```

Medplum bots (deploy separately, not on Vercel): `cd medplum && npx medplum bot deploy *`

## 10. Repo layout

- `app/` — Next.js UI + API routes (Deepgram token, Moss retrieval+fallback, imaging, Stedi eligibility, Medplum write)
- `lib/` — sponsor clients, endo/cluster criteria corpus, Thaakat prompts
- `medplum/bots/` — Medplum Bots (deploy via Medplum CLI)
- `docs/` — build kit, sponsor setup, extended brief · `CLAUDE.md` — coding rules

**One-liner to remember:** *"Everyone's building the scribe. We built the thing that reads your whole record — including the scan they missed — and turns a decade of being dismissed into one conversation. Thaakat: bringing what's hidden into the light."*
