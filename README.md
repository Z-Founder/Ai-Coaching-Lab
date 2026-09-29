# AI Coaching Lab

> AI as a Cognitive Partner — an independent research and experimentation project.

AI Coaching Lab explores a simple question: what if AI could help people think
better, rather than simply think for them?

The product framework remains:

**Observe → Ask → Reflect → Dispute → Act**

The human remains the decision-maker. The tool provides a structured space for
reflection, not diagnosis, treatment, or a replacement for human judgment.

## Version history

### V0.1 — static experiment

V0.1 was a zero-build, single-file static prototype. It established the core
five-step reflection flow, summary, pause/resume, and review experience. That
baseline is preserved in Git tag `v0.1.0`.

### V0.2 foundation

V0.2 migrates the same product behavior to a maintainable Vite, React, and
TypeScript application. It introduces typed session state, reusable components,
centralized step data, linting, and a production build without changing the
product positioning or adding new product capabilities.

### V0.3 — Coaching Engine (Step 7)

V0.3 adds a modular, provider-neutral local Coaching Engine. Step 7 is the
development step, not a product version called V0.7. The original five-step
reflection remains available through the mode switch.

**The application still does not connect to a real AI model.** Mock responses are
explicitly labelled. There is no production backend, login, external analytics
transport or automatic third-party contact. Raw conversation stays in page memory.
Only user-confirmed strategy notes are cached in IndexedDB after explicit opt-in;
they survive refresh and can be edited or deleted. This cache is not a cloud backup.
Research consent and proactive care stay OFF. Optional content-free counters remain
in page memory and are cleared on opt-out or reload.

Read [V0.3 Architecture](docs/V0.3_ARCHITECTURE.md),
[implementation and evaluation report](docs/V0.3_IMPLEMENTATION_REPORT.md), and
[phase progress](docs/STEP7_PROGRESS.md) before extending the engine.

## Local development

Prerequisite: Node.js 24 LTS with npm.

```bash
npm install
npm run dev
```

### Founder-only model integration (prepared, not live-verified)

The default remains the local Mock. The optional local service binds only to
`127.0.0.1:8787` and forwards to OpenAI's Responses API; the credential is read
from the server process, never from Vite or browser code. In an OpenAI-supported
location with an authorized API account and billing, provide `OPENAI_API_KEY` to
the server process through a secure local environment mechanism. Then use two
terminals:

```text
Terminal 1: npm run dev:api
Terminal 2: enable VITE_MODEL_MODE=local-openai for Vite, then npm run dev
```

Do not place the key in `.env`, a screenshot, a browser field, or the repository.
Without a key or when the provider fails, the UI falls back to a labelled local
response. This has only been tested with a fake provider; no billed OpenAI call has
been made. Use synthetic inputs while developing. The present local safety router
is not sufficient for external participants or clinical claims. Bedrock is an
optional later adapter, not a workaround for OpenAI's geographic terms.

Quality checks:

```bash
npm run lint
npm test
npm run build
```

## Project structure

```text
src/
├── coaching/    # Policy, orchestration, model boundary, memory and measurement
├── knowledge/   # Evidence-labelled interventions and original resource catalog
├── components/  # Focused UI panels for the existing product flow
├── data/        # Storage contracts, IndexedDB cache, original step copy
├── types/       # Session state and action types
├── App.tsx      # V0.3 / original reflection mode switch
├── LegacyReflection.tsx # Preserved V0.2 reducer and view orchestration
├── main.tsx     # React entry point
└── styles.css   # Existing visual language, centralized
```

## Status

- **Version:** 0.3 (local Mock implementation)
- **Status:** Early-stage independent research and experimentation
- **Started:** September 2026
- **License:** No formal open-source license has been selected yet
