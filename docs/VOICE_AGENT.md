# Live voice — Deepgram Voice Agent (wired)

The real voice agent is wired. `/intake` has two buttons and a patient switcher:

| Button | What it does |
|---|---|
| 🎙️ **Talk to Thaakat** | Live Deepgram Voice Agent. Real mic → real conversation → drives the real routes. |
| ▶ **Play demo** | The scripted run. This is the on-stage fallback if wifi eats the websocket. |

Both drive the **same** cluster engine, the same API routes and the same cards.

## Setup (the one thing to get right)

Use a `DEEPGRAM_API_KEY` with the **Member** role or higher. Then the browser never sees the key —
it gets a short-lived JWT from `/api/deepgram/token`, and `/v1/auth/grant` requires Member scope.
Create one at console.deepgram.com → Settings → API Keys.

A lower-scoped key still works for raw agent sockets, so this fails *only* in the browser — a
confusing way to lose 20 minutes. When the grant is refused, the route falls back to handing the
browser the raw key so the demo still runs. **That fallback is demo-only**: it does put the key in
the client, which is exactly what `CLAUDE.md` says not to ship.

> **Status of the key currently in `.env`:** `/v1/auth/grant` returns `403 Insufficient
> permissions`, so this project takes the raw-key fallback today. Swap in a Member-scoped key
> before the demo if you want the key off the client.

### The subprotocol trap

Deepgram picks the auth scheme from the websocket subprotocol, and the two are **not**
interchangeable:

| What you have | Subprotocol |
|---|---|
| short-lived JWT (`/v1/auth/grant`) | `['bearer', <jwt>]` |
| raw API key | `['token', <key>]` |

So the route returns a `scheme` field and the client uses it. Hardcoding either one gives you an
integration that works right up until the key type changes, then fails the handshake with no
useful error.

## How it works

```
mic → linear16 PCM ─┐
                    ├─► Deepgram Voice Agent (nova-3-medical STT + Claude think + Aura TTS)
speakers ◄─ PCM ────┘              │
                                   ▼  FunctionCallRequest (client_side: true)
                        lib/voice/tools.ts  ──►  our real routes
                                                 /api/moss/query      (criteria + HER record)
                                                 /api/imaging/analyze (the radiomics re-read)
                                                 lib/clusters.ts      (the cluster engine)
                                                 /api/eligibility     (Stedi test mode)
                                                 /api/medplum/commit  (FHIR write)
                                   ◄── FunctionCallResponse
```

Claude decides *when* to call; the deterministic engines decide *what is true*. The cluster match,
the coverage answer and the FHIR write are never the model's opinion.

### The six tools (`lib/voice/agent-settings.ts`)

| Tool | Runs |
|---|---|
| `retrieve_criteria` | Moss over the criteria corpus **and** her own record, so Thaakat can cite the actual document mid-question. Called every turn — this is the retrieval-heavy story. |
| `record_symptom` | What she says becomes a documented `Finding` on the timeline — voice as the sensor. |
| `analyze_imaging` | Re-reads the scan that was called normal (the moat). Refuses for a patient with no scan on file. |
| `assemble_record` | Runs the cluster engine over historical + live findings. |
| `check_eligibility` | Stedi test-mode coverage + `authOrCertIndicator`. |
| `commit_chart` | Writes the picture to Medplum as FHIR. |

### Files

- `lib/voice/agent-settings.ts` — the `Settings` message + tool schemas + prompt
- `lib/voice/audio.ts` — mic capture (AudioWorklet) + gapless playback + barge-in
- `lib/voice/client.ts` — websocket lifecycle and the function-call loop
- `lib/voice/tools.ts` — executes the tools against the real routes
- `app/intake/LiveVoice.tsx` — the button + status; drives the page's cards

## What was verified against the live API

Run against `wss://agent.deepgram.com/v1/agent/converse` with the key in `.env`, using the exact
`buildSettings()` this repo ships:

- Handshake with subprotocol `['token', <key>]` succeeded.
- `SettingsApplied` — `nova-3-medical` STT, `anthropic`/`claude-haiku-4-5` think, and all six
  function schemas accepted.
- Aura synthesized the greeting (716 binary frames received).
- **Full tool loop:** injected user turn → `FunctionCallRequest(retrieve_criteria,
  client_side:true)` → `FunctionCallResponse` accepted → the agent's next spoken turn **cited the
  record document we returned** ("your records show a high CA-125…") → `FunctionCallRequest
  (record_symptom)` with tags `pelvic-pain, dysmenorrhea, gi-cyclical`.
- Safety framing held: "something I want to take seriously." No condition named.

**Not yet verified:** the same config *in a browser with a real mic*. The probe injects text
rather than speech, so mic capture, playback and barge-in are the least-exercised paths. Do one
live call before demoing, and keep ▶ Play demo as the fallback.

## Notes

- **Barge-in** is real: `UserStartedSpeaking` calls `AudioPlayer.interrupt()`, killing queued TTS.
- **Sample rate**: we send the capture `AudioContext`'s *actual* rate in `Settings`, because
  browsers may ignore a requested rate and a mismatch means chipmunk audio.
- **STT** is `nova-3-medical` + `keyterms` (endometriosis, dyspareunia, CA-125…) so clinical vocab
  doesn't get mangled into a missed cluster tag. Swap to `flux-general-en` + `version: "v2"` in
  `buildSettings` if you want to demo Flux's eager endpointing instead.
- Tools never throw — a failed tool returns an error payload the agent talks around, rather than
  leaving Deepgram waiting on a response that never comes.
- Synthetic patients only. Deepgram BAA is Enterprise-only; never real PHI.
