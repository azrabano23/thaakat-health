# Noor 🩺🎙️

**A voice-first, multimodal diagnostic navigator for women's health.** Noor conducts an adaptive spoken interview, reads your pelvic MRI/ultrasound with a radiomics layer that catches what standard reads miss, builds a physician-ready FHIR chart, and checks your coverage in real time — turning the **7–10 year endometriosis diagnostic odyssey into one conversation.**

Built for the **YC × Medplum Agentic Healthcare Hackathon** (Aug 1, 2026).

> ⚕️ **Decision-support / navigation, not diagnosis.** Noor flags, structures, and routes; a clinician decides. Synthetic demo data only.

---

## The stack (all four sponsors, load-bearing)

| Layer | Sponsor | Role |
|---|---|---|
| Voice (the sensor) | **Deepgram** | Voice Agent API — adaptive spoken interview, Claude as the brain |
| Real-time retrieval | **Moss** | <10ms lookups of diagnostic criteria + patient history, every turn |
| Imaging (the moat) | *(our radiomics)* | Reads the scan for signs standard reads miss |
| System of record | **Medplum** | FHIR datastore + Bots write the structured chart |
| Coverage / cost | **Stedi** | Real-time eligibility; prior-auth modeled as FHIR |

See [`docs/TEAMMATE_BRIEF.md`](docs/TEAMMATE_BRIEF.md) for the full why, [`docs/BUILD_KIT.md`](docs/BUILD_KIT.md) for the build plan, and [`docs/SPONSORS.md`](docs/SPONSORS.md) for exact setup.

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # fill in keys (see docs/SPONSORS.md)
pnpm dev                     # http://localhost:3000
```

Medplum bots (deploy separately, not on Vercel):

```bash
npm i -g @medplum/cli
medplum login
cd medplum && npx medplum bot deploy *
```

## Architecture

```
Browser (Next.js on Vercel)
  │  mic audio                       ┌──────────────┐
  ├─────────────────────────────────▶  Deepgram    │  STT + TTS + barge-in
  │  short-lived token (/api/deepgram/token)        │  think = Claude
  │                                  └──────┬───────┘
  │  every turn: retrieve criteria +        │ function calls
  │  patient history <10ms                  ▼
  │                                  ┌──────────────┐
  ├──────────────────────────────────▶  Moss       │  /api/moss/query (+ local fallback)
  │                                  └──────────────┘
  │  scan upload → radiomics         ┌──────────────┐
  ├──────────────────────────────────▶ /api/imaging │  (stub → real model seam)
  │                                  └──────────────┘
  │  write chart / referral / PA     ┌──────────────┐
  ├──────────────────────────────────▶  Medplum     │  FHIR + Bots (ImagingStudy,
  │                                  └──────┬───────┘  DiagnosticReport, ServiceRequest,
  │  coverage check                         │           Coverage, Claim(preauth), Task)
  │                                  ┌──────▼───────┐
  └──────────────────────────────────▶  Stedi       │  /api/eligibility (test mode)
                                     └──────────────┘
```

## Repo layout

- `app/` — Next.js UI + API routes
- `lib/` — sponsor clients (medplum, moss, stedi), prompts, criteria corpus
- `medplum/bots/` — Medplum Bots (deploy via Medplum CLI)
- `docs/` — teammate brief, build kit, sponsor setup
- `CLAUDE.md` — coding rules for Claude/Cursor
