# Thaakat — Demo Playbook (how we win THIS panel)

The hackathon publishes **no rubric** — all 6 judges score on personal taste. This is what each of their tastes actually is (from their own work), and the 6 moves that hit them. Optimize the 2-minute demo for these, in this order.

## The judges, in one line each
- **Diana Hu (YC Partner, ex-Escher/Niantic CV):** just taught "AI-Native Company" — **closed-loop** systems that re-check themselves, not one-shot features. Wants technical depth + founder honesty.
- **Cody Ebberson (Medplum CTO, ex-MedXT medical imaging):** idiomatic FHIR (right resource, referenced right), real architecture, PHI/BAA awareness. **Pet peeve: calling your workflow a Medplum "Agent"** (that's their on-prem HL7 bridge) — say "Bot" / "voice agent."
- **Ana Yoon Faria de Lima (Pavoot, ex-ETH XAI lab):** "fragmented → unified → actioned" + **explainable** AI (a legible "why," not a black-box verdict).
- **Naomi Carrigan (Deepgram DevRel, accessibility):** does the product actually work for a real, anxious woman? Human-centered, not jargon.
- **Victor Wang (Deepgram staff eng, ex-AWS):** production-grade voice — **Nova-3 Medical, keyterms, confidence-gated escalation to a human**, correct integrations.
- **Sri Raghu Malireddi (Moss, ex-Grammarly ML):** a **real, reproducible latency number** and a precise answer for *where* retrieval happens (not pgvector + a network hop).

## The 6 winning moves (each mapped to judges)
1. **Show the evidence as a real FHIR `DetectedIssue`** — `author` = the radiomics `Device`, `evidence` → the real `Observation`/`ImagingStudy`, viewed *inside Medplum* (GraphQL/resource viewer), not a chat bubble. Say "DetectedIssue" out loud. → **Cody, Diana, Ana.** (Done in `lib/medplum.ts`.)
2. **Live Moss latency HUD** — on screen each retrieval: "Moss: ~8ms" (**verified live with our keys — real, reproducible**). Say: a hosted vector DB here is 150–300ms and audible; this wasn't. → **Sri, Victor, Naomi.** (Badge in `app/intake`.)
3. **Coverage via Medplum's canonical pattern** — `CoverageEligibilityRequest` → Insurance Eligibility Bot → `CoverageEligibilityResponse` on Stedi (from `medplum-eligibility-demo`); show the `insurance.item` payload, not a yes/no. → **Cody, Victor.**
4. **Deepgram's own healthcare doctrine, visibly** — **Nova-3 Medical + keyterms** (endometrioma, dysmenorrhea, dyspareunia…); show a confidence score on a critical field; when ambiguous, Thaakat says so and **escalates to a human with the transcript**. → **Victor, Naomi.** (Model + keyterms set in `lib/useVoiceAgent.ts`.)
5. **Frame the re-read as a closed loop (Diana's exact thesis)** — a Medplum `Subscription` → Bot re-runs radiomics whenever new imaging/chart data lands, so prior charts get silently re-scored as the model improves. Use her words: "closed loop, not open loop; queryable, not siloed."
6. **End on a structured, actioned output** — after `DetectedIssue`, generate a FHIR `ServiceRequest`/`Task` (confirmatory read + specialist referral) with the coverage result attached, read back conversationally. Close on *what the patient now knows and what happens next* — not the sponsor logos. → **Ana, Naomi, Diana.**

## The real-model line (say this, it's true)
"We trained a real radiomic classifier on **real endometriosis imaging (GLENDA, 5,990 frames)** — first-order + GLCM texture features — at **0.967 cross-validated AUC**. The production path runs the same pipeline on pelvic MRI (**UT-EndoMRI**, 133 real cases). Decision-support that flags for radiologist review — never a diagnosis."

## 2-minute run-of-show
- **0:00–0:20** Problem, cold open: "To diagnose endometriosis, they still cut you open. No non-invasive test." Scattered record + under-read scan; 7–10 year delay.
- **0:20–0:50** Live voice intake: Nova-3 Medical, **Moss latency HUD visible**, one confidence-gated escalation moment.
- **0:50–1:30** The reveal: radiomics re-read → `DetectedIssue` w/ evidence, shown **inside Medplum**, narrated as a **closed loop**.
- **1:30–1:50** Coverage fires via canonical Stedi/`CoverageEligibilityResponse` → attached to a generated `ServiceRequest`/`Task`.
- **1:50–2:00** Close on the patient outcome + founder line: "I did the radiomics research on this at RWJ — I know why women wait a decade, and I built the fix."

## What LOSES this panel (avoid at all costs)
1. Calling our workflow a Medplum **"Agent"** (say Bot / voice agent).
2. Saying Thaakat **diagnoses** or replaces the radiologist — say **"flags for radiologist review."**
3. A thin toy chart (Cody benchmarks 131k-resource charts) — use the rich synthetic record.
4. Not being able to say what Moss retrieves / why not pgvector.
5. Skipping PHI/BAA hygiene — say one sentence: "in production PHI never reaches the LLM vendor without a BAA, so we scope the access policy."
6. A live voice mishear of a medical term with no recovery — rehearse the vocabulary; keep a backup recording.
7. A shallow 4-logo tour instead of depth on the radiomics re-read.
8. A latency/accuracy number you can't reproduce live.

## Real-world "why now" proof
SimonMed + Matricis.ai are running a **live 2026 clinical pilot of AI-assisted endometriosis MRI reads** — the category is real and moving now, not speculative.
