# Thaakat — the 2-minute demo (run-of-show)

**Setup:** two browser tabs — (1) `thaakat-health.vercel.app`, (2) `/intake`. Screen-record and talk over it. Hard-refresh both first (Cmd+Shift+R). If conference wifi is shaky, use **"Play demo"** (offline-safe replay) instead of the live voice call. Total: ~120 s. Narration ≈ 300 words at a calm pace.

> **The through-line to hold:** it's not "a voice scribe" and it's not "a radiomics tool." It's **the voice-first front door that triages you to the right specialist the first time.** Misrouting is the villain. Radiomics is a supporting act.

---

### 0:00–0:18 · The hook — LAUNCH PAGE (hero)
**[SCREEN]** Land on the hero: *"She wasn't hard to diagnose. She was sent to the wrong doctor — for ten years."*
**[SAY]** "This is the median endometriosis patient. Ten years to a diagnosis, seven doctors. Her GP said cramps, GI said IBS, urology said recurrent UTIs, a radiologist called her scan normal. She wasn't a medical mystery — she was sent to the *wrong* doctor, every single time. One in ten women live this."

### 0:18–0:32 · The insight — scroll to the solution
**[SCREEN]** Scroll past the "Meet Maria" story to the heading *"A voice-first front door that triages you to the right specialist."*
**[SAY]** "Diagnostic delay isn't a knowledge problem — it's a *routing* problem. So we built the voice-first front door: you call, and before you ever see a doctor, Thaakat triages you to the right specialist the first time."

### 0:32–1:20 · The live run — switch to /intake, hit "Play demo"
**[SCREEN]** `/intake`. Click **Play demo**. Let the beats land as you narrate.
**[SAY]** "She just talks — no forms. Deepgram's voice agent charts the conversation into a real medical record as she speaks. It's already read her whole history, so it asks the right thing — *'I can see a CA-125 nobody followed up.'* That lookup is Moss, in eight milliseconds, mid-sentence.
*(triage beat appears)* — Here's the core move: it **triages** her. This is a pattern for an **OB/GYN**, not the GI and urology clinics she keeps getting sent to. *Only because a scan is relevant*, it re-reads the MRI they called 'normal' and flags what a specialist should see. It assembles the pattern nobody put together, checks her real insurance — covered, twenty-five-dollar copay — and writes the whole thing to a real chart, with a plan flagged for a human to peer-review."

### 1:20–1:42 · The proof — back to LAUNCH PAGE, tech section
**[SCREEN]** Scroll to **System architecture** + the **model card** (real ROC curve).
**[SAY]** "None of this is a demo wrapper. Every sponsor does real work: Deepgram's live voice agent, Moss at eight milliseconds, a real radiomics model — 0.966 AUC on real, public data — **sixteen typed FHIR resources** on Medplum with three bots running on their own infrastructure, and Stedi's real eligibility check. It's a chart a hospital can ingest — not a chat log."

### 1:42–2:00 · Impact + close — back to the hero / motto
**[SCREEN]** The motto: *"The answer was already there. Thaakat routes you to it."*
**[SAY]** "Thaakat compresses a decade-long, misrouted odyssey into one conversation. Endometriosis is the proof — the hardest case — but the engine routes *any* misrouted condition to the right specialist. This is the doctor's visit of the future: voice-first, and buildable today. The answer was already there. We route you to it."

---

## If you only get 30 seconds (elevator version)
"Women with endometriosis see seven doctors over ten years — not because it's unknowable, but because they're *misrouted*: GI, urology, psych. Thaakat is the voice-first front door — you talk, and before you see a doctor it charts the conversation, triages you to the right specialist, re-reads the scan they missed, and hands you a covered, peer-reviewed plan. Every sponsor does real work; it writes a real FHIR record. One conversation instead of a decade."

## Beat-by-beat cheat sheet (what's on screen ↔ which sponsor)
| Demo beat | Sponsor doing the work | The line |
|---|---|---|
| She talks; timeline charts itself | **Deepgram** (voice) + **Claude** (reasoning) | "charts the conversation as she speaks" |
| Chart-aware question | **Moss** (~8 ms retrieval) | "a CA-125 nobody followed up" |
| **Triage → route to OB/GYN** | **Claude** (the triage) | "the core move — routed to the right specialist" |
| Re-read the "normal" scan *(conditional)* | radiomics (AUC 0.966) | "only because a scan is relevant" |
| Cost & coverage | **Stedi** (real 270/271 EOB) | "covered, $25 copay" |
| Writes the record + peer-review flag | **Medplum** (16 FHIR resources, bots) | "a real chart, peer-reviewed by a human" |

## Landmines (don't say these)
- Don't call it a "diagnosis" — it **flags / suggests / routes**; the model is **investigational decision-support**.
- Don't lead with radiomics — it's the *supporting* capability, gated behind triage.
- Report the model honestly: "0.966 AUC on real GLENDA data, frame-level, research-grade" — the honesty is the credibility.
