# Testing UISchema

All test commands run from the repository root. Build first — tests run against the compiled packages:

```bash
npm install
npm run build
```

## Core test suite (no API keys required)

```bash
npm test
```

This runs:

1. **Unit tests** (`npm run test:unit`) — `node --test` suite in [`tests/`](../tests) covering every package:
   - `tests/core.test.js` — Zod schema validation and basic accessibility checks
   - `tests/compressed.test.js` — shorthand parsing, expansion, coarse-to-fine pipeline
   - `tests/protocol.test.js` — JSON Pointer patches, JSONL streaming, events, widget state
   - `tests/bridges.test.js` — Open-JSON-UI round-trips, AG-UI events, MCP Apps HTML escaping
   - `tests/react.test.js` — renderer output, component registry, prop sanitization
   - `tests/eval.test.js` / `tests/dom.test.js` — WCAG preflight/audit and the jsdom DOM adapter
2. **Smoke test** (`npm run smoke`) — end-to-end check that validates the hello-world example, expands shorthand, and renders with the React adapter.

Other non-AI commands:

| Command | What it does |
| --- | --- |
| `npm run test:unit` | Unit tests only |
| `npm run smoke` | Smoke test only |
| `npm run test:all` | Legacy comprehensive script (file structure + integration checks) |
| `npm run test:simple` | File-structure sanity check (works before `npm install`) |
| `npm run verify:build` | Verifies every package produced `dist/` output |
| `npm run type-check` | TypeScript `--noEmit` check |
| `npm run test:cli` | Validates the hello-world example via the CLI |

## AI integration tests (API key required)

These call real model APIs to generate schemas and validate the results.

```bash
cp .env.example .env   # then add your key(s)
```

| Command | Provider / key |
| --- | --- |
| `npm run test:ai` | Groq (`GROQ_API_KEY`) — generation pipeline suite |
| `npm run test:ai:simple` | Groq (`GROQ_API_KEY`) — single quick scenario |
| `npm run test:ai:live` | Groq (`GROQ_API_KEY`) — 10 live scenarios: generate → validate → patch → render → bridge |
| `npm run test:openai` | OpenAI (`OPENAI_API_KEY`) |
| `npm run test:vercel-ai` | OpenAI via Vercel AI SDK (`OPENAI_API_KEY`) |
| `npm run test:everything` | Runs everything, skipping AI tests when keys are missing |

Never commit `.env` — it is gitignored.

## CI

GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) runs install, build, type-check, and `npm test` on Node 20 and 22 for every push and pull request.
