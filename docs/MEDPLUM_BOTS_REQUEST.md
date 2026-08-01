# Message to Medplum — request to enable Bots (copy-paste / send ASAP)

> Send to the Medplum reps at the event or in the Medplum Discord (#hackathon or support). Bots are a paid feature that must be enabled per-project, so this needs a human on the Medplum side. Fill the **[ ]** if our project id changes.

**Subject:** YC × Medplum hackathon — please enable Bots on our project (Thaakat)

Hi Medplum team — we're **Thaakat** at the YC × Medplum Agentic Healthcare Hackathon.

Could you please **enable Bots** on our project?
- **Project:** `noor` — `Project/44e3b340-dd51-4608-92ce-12093106f8f6`
- **ClientApplication:** `Thaakat` — `a3011b26-3c7f-4a51-b3aa-7663dee4d1f9`
- **Account email:** ab2895@scarletmail.rutgers.edu

**Why we need it:** we're already writing real FHIR on every demo run (a `DetectedIssue` authored by a radiomics `Device` with `evidence` → `Condition`, plus `Observation`/`DiagnosticReport`/`ServiceRequest`/`Claim(use="preauthorization")`/`Task`). We want to close the loop the way you'd actually deploy it: a **`Subscription` → Bot** that re-runs our imaging model when a new `ImagingStudy`/`Binary` lands and files an updated `DetectedIssue`. That's the "closed-loop re-scoring" beat in our demo, and it only works with Bots enabled.

We have a non-bot fallback (`/api/medplum/commit`) so the demo is safe either way — but Bots would let us show the real production pattern. Anything you need from us (billing confirmation, a call), just say.

Thank you!
— Azra Bano & Nityanth Maramreddy · Thaakat
