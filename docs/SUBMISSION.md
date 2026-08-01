# Thaakat — YC × Medplum submission (copy-paste into the Google Form)

> Fill the **[ ]** placeholders (team name, phone, emails, YouTube link). Make the repo **public** before submitting the code link.

**Email:** ab2895@scarletmail.rutgers.edu

**Team Name:** [ your team name — e.g. "Thaakat" ]

**Team members' names and emails:**
- Azra Bano — ab2895@scarletmail.rutgers.edu
- Nityanth (Nitu) Maramreddy — nrm130@scarletmail.rutgers.edu

**Phone Number(s):** [ your number(s) ]

**Hack name and tagline:**
> **Thaakat — "The answer was already there."** A voice-first diagnostic navigator that reads a woman's *whole* medical record — including the scan that was under-read — to end the 7–10 year endometriosis diagnostic odyssey.

**Problem statement (what issue does your hack solve?):**
> To diagnose endometriosis, doctors still have to cut you open — there is no non-invasive test, so surgery *is* the diagnostic test. 1 in 10 women (190M) wait 7–10 years and see 7+ doctors, losing years to pain and fertility, while the answer often already sits unread in their records: the clues are documented across specialists nobody assembles, and the early signal (subtle texture changes) is missed on MRIs/ultrasounds they already had. Thaakat assembles the whole record and re-reads the scan with real radiomics, surfacing the pattern nobody put together — decision-support that flags for a specialist, never a diagnosis. (Diagnostic error seriously harms ~795,000 Americans/year; one specialist re-reading a full chart changed the diagnosis 88% of the time — Mayo.)

**Describe how you used Medplum, Stedi, Deepgram, Moss.dev to make this hack:**
> - **Deepgram** — the voice sensor: a real Voice Agent loop (Nova-3 **Medical** + keyterm prompting for clinical vocab, Aura TTS, barge-in) with **Claude** as the think model, running an adaptive spoken interview that captures the symptom story forms and rushed visits lose; low-confidence/high-acuity turns escalate to a human.
> - **Moss** — real-time retrieval: **verified 8 ms** semantic lookups over the patient's whole record + diagnostic criteria, *inside* the conversation (a hosted vector DB's 150–300 ms would be an audible pause). Retrieval-heavy by design.
> - **Medplum** — FHIR system of record: Bots turn the conversation + radiomics re-read into idiomatic FHIR — a `DetectedIssue` with `author = the radiomics Device` and `evidence` linking the real `Observation`/`ImagingStudy`, plus `Condition`/`ServiceRequest`/`Claim(preauthorization)`/`Task`. A `Subscription → Bot` re-runs the model on new imaging (closed-loop re-scoring).
> - **Stedi** — coverage: real-time eligibility (270/271, **verified test-mode 200**); `authOrCertIndicator` drives whether prior auth is needed, modeled as spec-correct FHIR (the exact gap CMS-0057-F closes by Jan 2027).
> - **The moat (real, not simulated):** a radiomics classifier trained on **real GLENDA endometriosis imaging** (5,990 frames, first-order + GLCM texture) — **5-fold CV ROC-AUC 0.967**; production path applies the same pipeline to pelvic MRI (UT-EndoMRI, 133 real cases). Founder did this exact radiomics research at RWJ.

**Code repo link (optional):** https://github.com/azrabano23/thaakat-health  *(make public before submitting)*

**YouTube video link:** [ your demo video URL — follow docs/DEMO_PLAYBOOK.md 2-min run-of-show ]

**Number of YouTube Views:** [ update right before you submit ]
