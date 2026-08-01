# Thaakat — the full demo walkthrough (in-depth, every sponsor)

Two surfaces, two jobs. Know which one you're on at every moment:

- **The launch page** (`thaakat-health.vercel.app`) is the **pitch**: it tells the story — the problem, the solution, the market, the proof, the team. You *talk over* it.
- **The demo** (`/intake`) is the **product**: the clinical console where you *watch the solution actually happen*, live, with every sponsor firing. This is the "show, don't tell."

Deliver in ~2.5–3 min if you go deep on every sponsor; trim the sponsor detail for a tight 2 min (see `docs/DEMO_2MIN.md`).

---

## Act 1 — THE PROBLEM  ·  *on the LAUNCH PAGE*

**[SCREEN: the hero]** — *"She wasn't hard to diagnose. She was sent to the wrong doctor — for ten years."*

> "Meet the median endometriosis patient. Ten years to a diagnosis. Seven doctors. Her GP said period cramps. A gastroenterologist said IBS. Urology said recurrent UTIs. A radiologist called her scan 'normal.' She wasn't a medical mystery — **she was misrouted, every single time.** One in ten women — 190 million — live exactly this."

**[SCREEN: scroll through the "Meet Maria" story + the stat spread]**

> "And here's the insight that changes everything: diagnostic delay isn't a *knowledge* problem — the answer is usually already sitting in her chart. It's a **routing** problem. Nobody's job is to read the whole record and send her to the right place. That's the gap we fill."

---

## Act 2 — THE SOLUTION, AND EVERY SPONSOR'S ROLE  ·  *LAUNCH PAGE, solution + System architecture*

**[SCREEN: the solution heading — "A voice-first front door that triages you to the right specialist"]**

> "Thaakat is the **voice-first front door**. You call, describe what's wrong in plain words, and *before you ever see a doctor* it charts the conversation, deep-researches it against your whole history, and **triages you to the right specialist the first time.** Here's how each piece works — and every one is a sponsor doing real work, not a logo."

**[SCREEN: scroll to the System architecture diagram — point at each node as you go]**

### 🟦 Deepgram — the voice sensor *and* the triage interview
> "The problem: your symptom story is the richest data you have, and forms and seven-minute visits throw most of it away. So Deepgram's **live Voice Agent** runs the whole intake — she just talks. **Nova-3 Medical** transcribes clinical vocabulary, so it actually hears 'CA-125' and 'dyspareunia,' not gibberish; an **empathetic Aura-2 voice** speaks back; barge-in lets her interrupt; and **Claude runs inside it as the reasoning model.** Its function-calling is what triggers every step that follows. The browser never touches a key — it gets a token that expires in five minutes. Deepgram isn't a feature we slapped on; it *is* the front door."

### 🟪 Moss — deep research, inside the turn
> "To ask a smart, chart-aware question *mid-sentence*, Thaakat has to search her entire multi-year record between her words. A normal cloud database takes 150–300 milliseconds — an awkward, conversation-breaking pause. **Moss returns in about 8.** So when she mentions pain, Thaakat can say 'I can see a CA-125 from last year nobody followed up' — inside the turn, not after it. That's the deep research the prompt asks for, made real-time."

### 🟧 Claude (Anthropic) — the reasoning, and the triage decision
> "Somebody has to actually *decide*: which specialist, does she even need a scan, what pattern connects clues scattered across five doctors. That's Claude. It's the brain of the call, it makes the **triage decision** — route her to OB/GYN, not GI or urology — and it turns the whole messy conversation into a structured, coded medical record using **forced tool-use**, so it fills our exact schema and never invents a code."

### 🟩 Medplum — the real, auditable medical record
> "A finding a doctor can't verify is worthless, so nothing here is a chat log. One atomic transaction writes **16 typed FHIR resources**: a **DetectedIssue** authored by the model, a **RiskAssessment** with its confidence, an **n=1 CarePlan**, and a **CommunicationRequest that flags a human specialist to peer-review it** — each carrying a **Provenance** trail proving it came from her transcript. **Three bots run on Medplum's own infrastructure**, an AccessPolicy fences the data, and every code is validated against a real terminology. This is a chart a hospital's EHR can ingest."

### 🟨 Stedi — cost and coverage, so the next step actually happens
> "Finding the answer isn't enough if she can't afford it. **Stedi runs a real insurance eligibility check** — the 270/271 exchange — for the *specific* test, and returns the full picture: plan, copay, coinsurance, deductible, out-of-pocket max, and whether prior authorization is required. There's no prior-auth API in the industry, so we model that as FHIR too. The run ends with a **covered, priced, scheduled step** — not another 'come back later.'"

---

## Act 3 — WATCH IT HAPPEN  ·  *switch to the DEMO (`/intake`)*

**[SCREEN: `/intake` — the clinical console. Point out the patient banner first.]**

> "This is the clinician's console. Up top is her real chart — vitals, labs, history — with the **CA-125 flagged 'never followed up.'** The little diagram shows the flow: **patient call → Deepgram → Thaakat, which is Claude plus Moss → the clinical console.** Let me run it." **[Click ▶ Play demo]**

Narrate as the beats land (this is where the story becomes proof):
> "She talks; the **Dossier assembles itself** on the left — every note across every specialist *(Deepgram + Claude charting)*. It asks a chart-aware question — *that lookup is Moss, 8 milliseconds* — see the retrieval time on the panel. *(triage beat)* **Here's the core move: it triages her — this is an OB/GYN pattern, not GI or urology.** *Only because a scan is relevant*, it re-reads the MRI they called normal. The **pattern nobody assembled** lights up with a confidence score. It checks her insurance — *Stedi, real* — covered, $25 copay. And it **writes the whole thing to Medplum** — you'll see 'wrote 15+ FHIR resources, including the DetectedIssue.'"

---

## Act 4 — IMPACT + CLOSE  ·  *back to the LAUNCH PAGE (the tech proof, then the motto)*

**[SCREEN: the model card — real ROC curve — then scroll to the "Handling" security section]**

> "And it's honest: a real radiomics model, **0.966 AUC on real, public data**, reported as investigational decision-support — never a diagnosis. Keys never reach the browser, egress is pinned to the four sponsors, the record lives encrypted in Medplum."

**[SCREEN: the hero motto — "The answer was already there. Thaakat routes you to it."]**

> "Thaakat compresses a decade-long, misrouted odyssey into one conversation. Endometriosis is the proof — the hardest case — but the engine routes **any** misrouted condition to the right specialist. This is the doctor's visit of the future: voice-first, and buildable today. The answer was already there. We route you to it."

---

## One-glance sponsor table (for Q&A)
| Sponsor | The problem it solves | What it does (in depth) | Where you see it |
|---|---|---|---|
| **Deepgram** | The story is lost to forms & rushed visits | Live Voice Agent (`agent/converse`): Nova-3 Medical STT + clinical keyterms, Aura-2 voice, barge-in, Claude think-model (fallback), function-calling drives the flow; browser gets a 5-min token only | Launch: architecture · Demo: the live "Talk to Thaakat" call + call-flow diagram |
| **Moss** | Can't search the whole record mid-sentence without a stall | Retrieval-heavy `query` over record + criteria, warm in-process, ~8 ms; local cosine fallback | Demo: the "Moss retrieval 8 ms" HUD |
| **Claude / Anthropic** | Someone must *decide* the routing + structure the record | Think-model in the agent; the triage decision; cluster assembly; forced-tool-use FHIR extraction (never invents codes) | Both: it's the reasoning behind every beat |
| **Medplum** | A chat log isn't a medical record | 16-resource FHIR transaction (DetectedIssue/RiskAssessment/CarePlan/CommunicationRequest/Provenance…); 3 bots on real Lambdas; AccessPolicy; terminology `$validate-code` | Demo: "wrote N FHIR resources" line |
| **Stedi** | The answer is useless if she can't afford the next step | Real 270/271 eligibility for STC-62 (MRI); full EOB (copay/coinsurance/deductible/OOP) + auth indicator; prior auth as FHIR | Demo: "The Cost — live eligibility" panel |

**Never say "diagnosis."** It flags / suggests / routes. The model is investigational decision-support. Radiomics is the supporting act, gated behind triage — don't lead with it.
