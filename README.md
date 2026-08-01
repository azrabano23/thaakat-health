# Thaakat 🩺🎙️ — read this first (teammate brief)

> **Thaakat** (طاقت — Urdu/Arabic for *"strength"*). **One line:**
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

- **Maps to YC's current RFS:** *AI-Native Compliance Infrastructure* (monitoring a scattered record, flagging the anomaly nobody assembled — AI doing a human-bottlenecked task faster/cheaper) and *Multiplayer AI* (a multi-agent system). Ground it in YC's real RFS language, not the (nonexistent) "women's-health RFS."
- **Maps to interoperability's moment:** the record + coverage pipes are open by federal mandate (patient-access APIs; CMS-0057-F prior-auth FHIR by Jan 2027) — the "why now" for a layer that runs on top.
- **Every sponsor is load-bearing, on real infra** (see §7) — this isn't a Claude wrapper with four logos; it's four real integrations plus a trained imaging model in one run.
- **A fundable company, not a feature:** vertical wedge (endo) → platform (any delayed/under-read condition) → the assembled longitudinal + imaging data becomes a defensible data moat that compounds per patient.
- **Founder-market fit is the unfair advantage:** the bottleneck here isn't clinical knowledge (physicians have that) — it's ML + systems (assemble the record, re-read the pixels). Azra did the endometriosis radiomics research; we're not doctors with an idea, we're the people who built the model doctors don't have.

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

## 7. How we use EVERY sponsor — and where to look (sponsors: tell us what to fix)

> **For the Deepgram / Moss / Medplum / Stedi teams:** each integration below points at the exact file and its **verified status** (we called your real APIs, not mocks). We'd genuinely value a "you're using X wrong / you should use Y" — open an issue or tell us at the event. One run of `/intake` exercises all four.

- **🟦 Deepgram** — live **Voice Agent API** (`wss://agent.deepgram.com/v1/agent/converse`) with **Claude as the `think` model** (in a fallback array, so a non-provisioned model id degrades instead of silently erroring on stage), `nova-3-medical` listen + clinical keyterms (endometriosis, dysmenorrhea, dyspareunia, CA-125…), **empathetic Aura-2 voice** (`harmonia`), barge-in. Browser gets a short-lived token minted server-side. Voice is the *sensor* that captures the symptom story a form loses. → `lib/voice/*`, `app/intake/LiveVoice.tsx`, `app/api/deepgram/token/route.ts`. **✅ live.**
- **🟪 Moss** — real-time semantic retrieval over the patient's **whole record** (+ the diagnostic-criteria corpus), so Thaakat's questions are chart-aware *inside* the conversation. Called **server-side** with a warm, reused client (`createIndex`/`loadIndex`/`query`); **~8 ms in-process query** once the index is loaded — which is why a chart-aware question lands in the turn gap. Retrieval-heavy by design; falls back to a local cosine index if keys are absent so the demo never hard-fails. → `lib/moss.ts`, `app/api/moss/query/route.ts`, `pnpm seed:moss`. **✅ live, 8 ms verified.**
- **🟩 Medplum** — FHIR R4 system of record. One **transaction Bundle** writes the whole picture as 16 typed resources: **`DetectedIssue`** (`author` = radiomics `Device`, `implicated` = the cluster), a **`RiskAssessment`** carrying the radiomics probability, a **`ClinicalImpression`**, an **`CarePlan`** (the n=1 plan) and a **`CommunicationRequest`** flagging a human specialist to peer-review it, plus `Condition`/`Observation`/`DiagnosticReport`/`ServiceRequest`/`Claim(use="preauthorization")`/`Task`, and a **`Provenance`** proving each resource is AI-derived from the transcript (stored as a real `Binary`). **3 Bots deployed & executing on real Lambdas** (intake→FHIR via Claude forced tool-use; `Subscription→Bot` closed-loop re-read; eligibility). Local terminology `CodeSystem` + `$validate-code` retires placeholder codes. → `lib/medplum.ts`, `lib/fhir/model.ts`, `lib/fhir/terminology.ts`, `medplum/bots/`, `docs/MEDPLUM_INTEGRATION.md`. **✅ live — 16-resource transaction on each run; bots execute.**
- **🟨 Stedi** — **confirmed sponsor** (named in the judging rubric). Real **270/271 eligibility** (test-mode payers) → the full benefits picture for the confirmatory MRI (service code **62**, not just generic 30): **plan name, copay, coinsurance, deductible, out-of-pocket max**, and `authOrCertIndicator` (absent = *not required*). **Stedi has no 278 API** — we model prior auth as FHIR `Claim(use="preauthorization")` + `Task`, the exact gap CMS-0057-F closes by Jan 2027. → `lib/stedi.ts`, `app/api/eligibility/route.ts`. **✅ live — a real call returns "Gold Plan · $25 copay · $500 deductible · $7k OOP max."**

**The "generalizable, not hardcoded" tell:** we ship **3 cluster definitions** (endometriosis + Sjögren's + celiac) and **2 seeded patients** you can switch between live — the same engine fires a *different* pattern, which is the difference between "demo" and "system."

---

## 8. The datasets (real, public)

All patient data in the demo is **synthetic**. The imaging **model is trained on real, public data**:

- **GLENDA v1.5** — Gynecologic Laparoscopy ENdometriosis DAtaset (Leibetseder et al., ITEC/Klagenfurt): real laparoscopy frames, endometriosis pathology vs. no-pathology. We use **5,990 frames** (500 pathology / 5,490 no-pathology). → what the shipped classifier is trained on.
- **UT-EndoMRI** (Zenodo) — 133 real pelvic-MRI cases with endometriosis annotations → the **production path**: the same texture pipeline applied to patient-level MRI (the real product surface).
- **MMOTU** — multi-modal ovarian tumor ultrasound → generalization / ultrasound arm.

See [`radiomics/`](radiomics/) and [`docs/DATASETS.md`](docs/DATASETS.md).

## 9. The model (real numbers — report AUC *with* n)

`lib/radiomics-model.json` + `radiomics/real_endo_summary.json` are generated by the pipeline, not hand-written.

- **Features:** scikit-image **GLCM + first-order texture** (12 features) — the same texture family PyRadiomics computes, without its fragile C build.
- **Classifier:** RandomForest (300 trees, class-weight balanced), **5-fold stratified CV**, out-of-fold scoring (no leakage).
- **Result:** pooled OOF **ROC-AUC 0.966** (per-fold 0.967 ± 0.012), **average precision 0.864** at 8.35% prevalence. Top features: `fo_entropy`, `glcm_homogeneity`, `fo_p10`.
- **Honest caveats (we say these first):** frame-level not patient-level, single dataset, no external validation yet. Endometriosis radiomics is **research-grade** across the literature — we frame the re-read as **investigational decision-support (SaMD)**, never autonomous diagnosis. Full sourcing + the regulatory framing in [`docs/EVIDENCE.md`](docs/EVIDENCE.md).

## 10. Honest notes (don't get burned)

- **Regulatory precision:** the **record-assembly layer is decision-support** (surfaces documented findings + a question); the **imaging re-read is investigational SaMD** (FDA CDS Criterion 1 — anything that analyzes an image is a device). Never call the image tool "non-device CDS." See `docs/EVIDENCE.md §5`.
- **Every stat is sourced** in `docs/EVIDENCE.md`. The "88% of diagnoses changed" figure (Mayo, Van Such 2017) is a **selected referral population, n=286** — attribute it that way. Avoid the round "7 doctors."
- **Stedi has no prior-auth (278) API** — model PA as FHIR `Claim(use="preauthorization")` + `Task`.
- **Medplum Bots are OFF by default (paid feature)** — the non-bot fallback (`/api/medplum/commit`) is what writes on stage; bots add the closed-loop `Subscription`.
- **Privacy / HIPAA:** synthetic data only (Moss HIPAA / Deepgram BAA are Enterprise-only — never real PHI on free tiers); keys are server-side (`.env.local`, gitignored), the browser only ever gets a short-lived Deepgram token; production posture = Medplum (HIPAA-eligible) as system of record, FHIR `Provenance`/`AuditEvent` for the audit trail, encryption in transit + at rest.
- **FHIR R4 only** — LLMs hallucinate R5 fields; `CLAUDE.md` guards this. Type everything with `@medplum/fhirtypes`.

---

## 11. Quickstart

```bash
pnpm install
cp .env.example .env.local   # fill keys — see docs/SPONSORS.md
pnpm seed:moss               # build the Moss retrieval index (once, and after criteria/record edits)
pnpm dev                     # http://localhost:3000  →  /intake  →  "Play demo" or "Talk to Thaakat"
```

> ⚠️ **Don't leave blank keys in `.env.local`.** Next loads `.env.local` *over* `.env`, so an
> unfilled copy of `.env.example` shadows every real key with an empty string — and Moss, Stedi
> and Medplum all degrade silently to their offline fallbacks while the UI still looks fine.
> Delete the lines you haven't filled in. Live voice: see [`docs/VOICE_AGENT.md`](docs/VOICE_AGENT.md).

Medplum bots (deploy separately, not on Vercel): `cd medplum && npx medplum bot deploy *`

## 12. Repo layout

- `app/` — Next.js UI + API routes (Deepgram token, Moss retrieval+fallback, imaging, Stedi eligibility, Medplum write)
- `lib/` — sponsor clients, endo/cluster criteria corpus, Thaakat prompts
- `medplum/bots/` — Medplum Bots (deploy via Medplum CLI)
- `docs/` — build kit, sponsor setup, extended brief · `CLAUDE.md` — coding rules

**One-liner to remember:** *"Everyone's building the scribe. We built the thing that reads your whole record — including the scan they missed — and turns a decade of being dismissed into one conversation. Thaakat: bringing what's hidden into the light."*
