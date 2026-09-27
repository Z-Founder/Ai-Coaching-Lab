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

### V0.2 foundation — current

V0.2 migrates the same product behavior to a maintainable Vite, React, and
TypeScript application. It introduces typed session state, reusable components,
centralized step data, linting, and a production build without changing the
product positioning or adding new product capabilities.

**The application still does not connect to a real AI model.** It has no backend,
database, login, analytics, or third-party SaaS integration. User input remains
in browser memory and is cleared when the page is refreshed or closed.

## Local development

Prerequisite: Node.js 24 LTS with npm.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Project structure

```text
src/
├── components/  # Focused UI panels for the existing product flow
├── data/        # The five reflection steps and their copy
├── types/       # Session state and action types
├── App.tsx      # Session reducer and view orchestration
├── main.tsx     # React entry point
└── styles.css   # Existing visual language, centralized
```

## Status

- **Version:** 0.2 foundation
- **Status:** Early-stage independent research and experimentation
- **Started:** September 2026
- **License:** No formal open-source license has been selected yet
