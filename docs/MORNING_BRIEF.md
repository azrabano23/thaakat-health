# ☀️ Morning brief — read this first (Thaakat, hackathon day)

Everything below is done and pushed to GitHub. Then: **what only YOU can do before the event.**

## ✅ What's built & pushed (repo: github.com/azrabano23/noor · latest `main`)
- **Premium 8-section launch page** (hero → problem → solution → customers → business → demo/tech → founders → footer), dark navy + gold, responsive, build-clean. Live: https://noor-j4flo4wzf-azra-banos-projects.vercel.app
- **Renamed to Thaakat** everywhere (طاقت = strength/power).
- **REAL model, real data** (not simulated): trained on **real GLENDA endometriosis imaging** (5,990 frames) → real radiomic texture features (first-order + GLCM) → **5-fold CV ROC-AUC 0.967**. See `radiomics/real_endo_summary.json`, `real_pipeline.py`, `real_endo_features.csv`. Production path = same pipeline on pelvic MRI (UT-EndoMRI, 133 real cases) — your RWJ wheelhouse.
- **All docs:** [`README`](../README.md) (full brief), [`DEMO_PLAYBOOK`](DEMO_PLAYBOOK.md) ← **memorize this**, [`GTM`](GTM.md), [`DATASETS`](DATASETS.md), [`SPONSORS`](SPONSORS.md), [`BUILD_KIT`](BUILD_KIT.md), [`CLAUDE.md`](../CLAUDE.md).
- **Live app wired** (`.env.local`, gitignored): the `/intake` demo + live Deepgram voice loop, Moss retrieval, Stedi eligibility, Medplum FHIR.
- **Judge-tailored code:** `DetectedIssue` with `author=Device` + `evidence`; Deepgram **Nova-3 Medical** + medical keyterms; **closed-loop re-scoring Bot** (`medplum/bots/reread-on-imaging.ts`); confidence-gated escalation in the voice prompt.

## 🔴 Sponsor/API status (verified with real calls)
| Sponsor | Status |
|---|---|
| Deepgram | ✅ key valid. (Can't mint browser JWTs — needs "Member" perm; token route falls back to the key for the demo.) |
| Anthropic | ✅ 200 |
| Stedi | ✅ 200 — real test-mode eligibility works |
| Moss | keys in `.env.local` (wired; local fallback if it hiccups) |
| **Medplum** | ❌ **"Invalid client" — creds rejected.** FIX BELOW. |

## 👉 What ONLY YOU can do (before 5pm)
1. **Fix Medplum creds** — the client id/secret you sent are rejected. Go to app.medplum.com → your project → **Admin → Client Applications**, confirm/recreate a ClientApplication, and paste the correct `MEDPLUM_CLIENT_ID`/`SECRET` into `.env.local`. Then `pnpm seed` (seeds Maria's real record) and **ask a Medplum rep at the event to enable Bots** on your project.
2. **Run it live:** `pnpm install && pnpm dev` → http://localhost:3000/intake → **Play demo** (works now) and **Go live** (real Deepgram voice — needs a quiet mic).
3. **Record the YouTube demo video** (required for submission, due 5pm). Follow the 2-min run-of-show in `DEMO_PLAYBOOK.md`. Record early.
4. **Vercel (optional):** to share the live link, toggle off Deployment Protection (Vercel → project **noor** → Settings). For live voice on the deployed site, add the `.env.local` vars in Vercel (note: exposes the Deepgram key on a public URL — fine for a demo, or keep the live demo local).
5. **Repo name:** stayed `noor` because you already have a `thaakat` repo — rename/delete that one if you want the repo called `thaakat`, then `gh repo rename thaakat`.
6. **Submission form:** draft is in `BUILD_KIT.md` (§Submission) — team names/emails/phone are yours to fill.

## 🎯 The winning strategy (from deep research on all 6 judges)
- **Hook:** "To diagnose endometriosis, doctors still have to cut you open." (No non-invasive test — surgery *is* the test. 1 in 10 women, 7–10 years.)
- **Moat:** you *read the scan they missed* (real radiomics, your RWJ research + EndoDetect) — not a commodity voice agent.
- **Win the room:** `DetectedIssue` shown inside Medplum (Cody); live Moss latency HUD + "why not pgvector" (Sri); Nova-3 Medical + escalation (Victor/Naomi); **closed-loop re-scoring** in Diana Hu's exact words; end on a `ServiceRequest`/`Task` + the patient outcome (Ana). Say **"flags for radiologist review," never "diagnoses."** Never call your workflow a Medplum "Agent" (say "Bot").

You've got this. Go win the interview. 💪
