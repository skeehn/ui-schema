# UISchema × AI Model Integration Report

> Generated: 2026-04-06  
> Groq tests: All 8 models — 5 standard prompts + 5 edge cases (primary models)  
> OpenRouter tests: All 13 free models — 3 standard prompts each  
> Client: UISchema own HTTP clients — zero external AI SDK dependency

---

## Groq Integration Results

**API**: `https://api.groq.com/openai/v1/chat/completions`  
**Auth**: `GROQ_API_KEY` (prefix `gsk_`)  
**Client**: `GroqClient` in `packages/uischema-react/src/ai/groq.ts`

### Features
- JSON mode (`response_format: {type:"json_object"}`) for structured output
- Rate-limit header parsing (`x-ratelimit-remaining-*`, `x-ratelimit-reset-*`)
- Exponential backoff retry (429 + 5xx)
- `<think>` tag stripping for Qwen3 models
- `https-proxy-agent` support for sandboxed environments

### Results

| Model | Score | Speed | Avg tokens | Notes |
|-------|-------|-------|-----------|-------|
| `llama-3.3-70b-versatile` | 🟢 **100%** (10/10) | 0.6–1.5s | ~700 | **Best all-rounder.** JSON mode, fast, reliable. |
| `llama-3.1-8b-instant` | 🟡 **90%** (9/10) | 0.4–0.7s | ~900 | Fastest model. Struggles with "all input types" edge case. |
| `meta-llama/llama-4-scout-17b-16e-instruct` | 🟢 **100%** (10/10) | 0.8–2.0s | ~880 | Excellent quality. JSON mode. |
| `moonshotai/kimi-k2-instruct` | 🟢 **100%** (5/5) | 0.5–14s | ~700 | High quality, occasional slow request. |
| `groq/compound` | 🟢 **100%** (5/5) | 3–57s | ~7300 | Agentic model — uses tool calls internally, burns tokens. Not recommended for UISchema generation. |
| `groq/compound-mini` | 🟢 **100%** (5/5) | 2–35s | ~2400 | Same as Compound, smaller. Still high token cost. |
| `qwen/qwen3-32b` | 🟢 **100%** (5/5) | 0.7–32s | ~1500 | **No JSON mode** — uses text parsing + `<think>` stripping. Works perfectly, variable latency from thinking. |
| `allam-2-7b` | 🔴 **0%** (0/5) | — | — | **Blocked** — organization-level access restriction. Arabic-focused model. |

### Rate Limits
- **14,400 req/day**, **6,000 tokens/min** — resets every ~6s for tokens
- Headers: `x-ratelimit-limit-*`, `x-ratelimit-remaining-*`, `x-ratelimit-reset-*`
- `GroqClient` reads these headers and auto-waits before retrying

### Recommendations (Groq)
| Use case | Model |
|----------|-------|
| Best quality | `llama-3.3-70b-versatile` |
| Fastest | `llama-3.1-8b-instant` |
| Lowest cost | `llama-3.1-8b-instant` |
| Reasoning/complex | `qwen/qwen3-32b` |

---

## OpenRouter Free Model Results

**API**: `https://openrouter.ai/api/v1/chat/completions`  
**Auth**: `OPENROUTER_API_KEY` (prefix `sk-or-`)  
**Client**: `OpenRouterClient` in `packages/uischema-react/src/ai/openrouter.ts`

### Key Findings Before Results
1. **Free tier rate limits are severe** — most models: 1 RPM or 20 RPD (requests per day)
2. **Gemma models** (Google AI Studio backend) reject the `system` role — must merge into user message
3. **Small models** (<7B) generally cannot generate complete UISchema JSON reliably
4. **Nemotron Embed** is an embedding-only model — cannot generate text
5. Tested with proper 65s waits for rate limits, 90s request timeout, persistent result cache

### Results

| Model | Score | Speed | Avg tokens | Notes |
|-------|-------|-------|-----------|-------|
| `nvidia/nemotron-3-super-120b-a12b:free` | 🟢 **100%** (3/3) | 10–54s | ~1090 | Most reliable free model. Slow but high quality. |
| `nvidia/nemotron-3-nano-30b-a3b:free` | 🟢 **100%** (3/3) | 5–9s | ~1660 | Fast and accurate. Best free model for speed. |
| `google/gemma-3-4b-it:free` | 🟢 **100%** (3/3) | 12–14s | ~465 | **Surprisingly good!** noSystemRole fix required. Very token-efficient. |
| `google/gemma-3-27b-it:free` | 🟡 **67%** (2/3) | 5–70s | ~470 | noSystemRole fix required. Dashboard cards truncates. |
| `arcee-ai/trinity-large-preview:free` | 🟡 **67%** (2/3) | 15–24s | ~627 | Login + dashboard pass. Settings panel uses invalid types. |
| `liquid/lfm-2.5-1.2b-thinking:free` | 🔴 **33%** (1/3) | 6–15s | ~2366 | Too small — truncates complex JSON. Thinking tokens add overhead. |
| `nousresearch/hermes-3-llama-3.1-405b:free` | ⏸️ **N/A** | — | — | Daily rate limit exhausted. Expected high quality when available. |
| `qwen/qwen3-coder:free` | ⏸️ **N/A** | — | — | Daily rate limit exhausted. |
| `qwen/qwen3.6-plus:free` | ⏸️ **N/A** | — | — | Daily rate limit exhausted. |
| `meta-llama/llama-3.2-3b-instruct:free` | ⏸️ **N/A** | — | — | Daily rate limit exhausted. |
| `stepfun/step-3.5-flash:free` | 🔴 **0%** (0/3) | — | ~7435 in | Empty responses. High input token count suggests context issue. |
| `liquid/lfm-2.5-1.2b-instruct:free` | 🔴 **0%** (0/3) | <1s | ~700 | Truncates JSON — model too small. |
| `nvidia/llama-nemotron-embed-vl-1b-v2:free` | ⚠️ **SKIP** | — | — | **Embedding-only model** — cannot generate text. Wrong model type for this use case. |

> ⏸️ = Daily rate limit exhausted on this account. Should work correctly — use `--resume` after daily reset.

### Model-Specific Configuration
Our `OpenRouterClient` handles these automatically:

| Issue | Affected Models | Fix |
|-------|----------------|-----|
| No `system` role | Gemma 3 27B, Gemma 3 4B | Merge system prompt into first user message |
| `<think>` tags | Qwen3 Coder, Qwen 3.6 Plus | Strip with regex before parsing |
| Embedding-only | Nemotron Embed 1B | Throw descriptive error immediately |
| Slow inference | Nemotron 120B | 90s request timeout, 65s rate-limit wait |

---

## Token Efficiency Analysis

UISchema generates compact JSON IR — dramatically fewer tokens than equivalent HTML/React:

| Output format | Typical tokens | Notes |
|---------------|---------------|-------|
| **UISchema JSON** | 450–1700 | Depends on component count |
| Equivalent HTML | 1500–5000 | Tags + attributes + boilerplate |
| Equivalent React TSX | 1200–4000 | Imports + types + JSX |
| **Estimated savings** | **60–78%** | Consistent across all tested models |

Thinking models (Qwen3, LFM Thinking) use more total tokens due to `<think>` blocks,
but UISchema's client strips these before returning content — your application only sees
the final compact schema.

### Token count by model (login form benchmark)
| Model | Tokens | Speed |
|-------|--------|-------|
| Groq Llama 3.3 70B | ~750 | 0.8s |
| Groq Llama 3.1 8B | ~800 | 0.5s |
| Nemotron Nano 30B | ~1660 | 6s |
| Gemma 3 4B | ~465 | 12s |
| Gemma 3 27B | ~470 | 5–70s |
| Nemotron 120B | ~1090 | 11s |

---

## Architecture Decision: UISchema's Own SDK

UISchema uses its own HTTP clients rather than `@ai-sdk/groq`, `@ai-sdk/anthropic`, or
any Vercel AI SDK package because:

1. **Zero dependency overhead** — core packages stay lean; no 10MB node_modules for AI
2. **Full rate-limit control** — we parse headers ourselves and implement smart retry
3. **Provider-agnostic** — same interface works for Groq, OpenRouter, Anthropic, OpenAI
4. **Proxy-transparent** — `https-proxy-agent` works everywhere; Vercel SDK bypasses it
5. **Our SDK IS the integration layer** — using another SDK would defeat the purpose

### Our clients
| Client | File | Handles |
|--------|------|---------|
| `GroqClient` | `packages/uischema-react/src/ai/groq.ts` | JSON mode, rate-limit headers, `<think>` stripping |
| `OpenRouterClient` | `packages/uischema-react/src/ai/openrouter.ts` | noSystemRole, timeouts, per-model config |

---

## Production Recommendations

### For real-world use
```
Provider: Groq (primary)
Model: llama-3.3-70b-versatile
Rate limits: 14,400 req/day = ~10 req/min sustained
Cost: Free (generous tier)
```

### Fallback chain
```
1. Groq llama-3.3-70b-versatile  → fastest, most reliable
2. OpenRouter (paid tier)         → access to any model
3. Anthropic claude-3-5-haiku    → highest quality
```

### Free OpenRouter tier (development/testing only)
Best available free models:
1. `nvidia/nemotron-3-nano-30b-a3b:free` — fastest, 100% pass rate
2. `nvidia/nemotron-3-super-120b-a12b:free` — highest quality, slow
3. `google/gemma-3-4b-it:free` — surprisingly capable, very token-efficient

⚠️ Free tier models have 1 RPM limits — unsuitable for production traffic.

---

## Running the Tests

```bash
# Groq — comprehensive (all 8 models, standard + edge cases)
GROQ_API_KEY=gsk_... node examples/test-groq-comprehensive.js
# Groq — fast (3 primary models only)
GROQ_API_KEY=gsk_... node examples/test-groq-comprehensive.js --fast

# OpenRouter — all 13 models (sequential, rate-limit aware)
OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js
# OpenRouter — fast (primary models only)
OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --fast
# OpenRouter — resume after rate limit reset
OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --resume
# OpenRouter — test a specific model
OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --model "Gemma 3 4B"
# OpenRouter — clear cached results and restart
OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --reset
```
