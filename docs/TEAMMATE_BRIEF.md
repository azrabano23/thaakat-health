# Noor — concept & positioning (the "why")

> **The full team brief is now the [README](../README.md)** (problem, evidence, market, competitors, sponsors — everything). This doc is the tight version of the *concept* so it's easy to align on. Execution lives in [`BUILD_KIT.md`](./BUILD_KIT.md); coding rules in [`../CLAUDE.md`](../CLAUDE.md).

## One line
**Noor reads a woman's *whole* medical record — including the scan that was under-read — and assembles the picture nobody's job was to see, turning a 7–10 year diagnostic odyssey into one conversation.** ("Noor" = *light*.)

## The merged concept (why it's stronger than either half)
We combined two ideas into one:
1. **Record assembly** (the structural insight): diagnostic delay isn't a knowledge problem, it's an *assembly* problem — the clues are already documented across specialists, but **nobody's job is to read them together.** Backed by hard evidence (Mayo: one person re-reading changed 88% of diagnoses; a third of missed cancers had the red flag already in the chart; ~795k Americans die/disabled per year from diagnostic error; assembly costs a physician-hour → now ~$0.40). Why now: the 2022 patient-access API rule + CMS-0057-F opened the pipes.
2. **The imaging moat** (our defensibility): the orphaned clue is often a **scan that was under-read.** Noor's radiomics layer re-reads the MRI/ultrasound and catches the endometriosis/adenomyosis signs a routine read misses. This is Azra's actual research — a hard modality other teams **can't** replicate in a day.

**Beachhead:** endometriosis / women's health (longest delay, highest stigma, Azra's domain).

## Why the moat matters
Text-record RAG is commodity — that's literally OpenEvidence ($12B), ChatGPT Health, Claude Health. If we only did record assembly, a judge asks *"isn't this just a health copilot?"* The **radiomics re-read is the answer** — we read the pixels a radiologist skipped. Plus founder-market fit (Azra: repeat medtech founder, ~$7M raised, built women's-health triage, did the endo radiomics research) and Cody Ebberson (judge) being an ex-medical-imaging founder.

## Why it wins the room
- **YC RFS "AI Personalized Medicine"** — "analyze a diagnostic test / EHR for n=1 suggestions." Bullseye.
- **Medplum's #1 2026 bet** — prior-auth / interoperability (CMS-0057-F). Our coverage layer + FHIR-native design speak to it.
- **Panel tilt:** Cody (imaging), Sri (real-time retrieval), Diana Hu (founder-fit) all lean our way; Deepgram's judges reward real voice engineering.
- **A company, not a feature:** endo wedge → any delayed/under-read condition → assembled longitudinal + imaging data = a real data moat.

## The safety rule (also our answer to judges)
Noor **never names a condition to the patient.** It surfaces **documented findings + a recognized cluster + a question for the clinician**, who can check every source (Provenance links). Decision-support, not diagnosis. This is non-negotiable in copy, prompts, and code.

## The "generalizable, not hardcoded" proof
We ship **3 cluster definitions** (endometriosis + Sjögren's + celiac) in `lib/clusters.ts`, not 1. When a judge asks "does this only work for endo?", we flip to the config and show it matching a different pattern. Three is the difference between "demo" and "system."
