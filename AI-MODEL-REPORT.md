# UISchema × AI Model Integration Report

> Generated: 2026-04-06  
> Test scope: All Groq chat models + 13 OpenRouter free models  
> Testing: UISchema generation (login form, dashboard cards, settings panel + edge cases)

---

## Groq Integration Results

**API**: `https://api.groq.com/openai/v1/chat/completions`  
**Client**: Our own `GroqClient` (zero external SDK dependency)  
**Features**: JSON mode, rate-limit headers, <think>-tag stripping, exponential backoff

| Model | Score | Speed | Tokens/call | Notes |
|-------|-------|-------|-------------|-------|
| `llama-3.3-70b-versatile` | 🟢 **100%** | 0.6–1.5s | ~450–900 | Best all-rounder. JSON mode. |
| `llama-3.1-8b-instant` | 🟡 **90%** | 0.4–0.7s | ~800–1000 | Fastest. Minor failure on complex "all input types" edge case. |
| `meta-llama/llama-4-scout-17b-16e-instruct` | 🟢 **100%** | 0.8–2.0s | ~700–1000 | Great quality, JSON mode. |
| `moonshotai/kimi-k2-instruct` | 🟢 **100%** | 0.5–14s | ~640–750 | Occasionally slow (rate limit pauses). |
| `groq/compound` | 🟢 **100%** | 3–57s | 3870–13367 | **Agentic model** — uses very high tokens (web search). Slow and expensive on tokens. Not recommended for UISchema generation. |
| `groq/compound-mini` | 🟢 **100%** | 2–35s | 2100–2800 | Same as above but smaller. Still high token usage. |
| `qwen/qwen3-32b` | 🟢 **100%** | 0.7–32s | ~830–2500 | **No JSON mode** — uses text parsing + `<think>` stripping. Variable latency (thinking can be long). |
| `allam-2-7b` | 🔴 **0%** | N/A | N/A | **BLOCKED** — org-level access restriction. Arabic-focused model. |

### Groq Summary
- **7/8 models work** (1 blocked by access controls)
- **Top picks**: `llama-3.3-70b-versatile` (quality), `llama-3.1-8b-instant` (speed)
- **Rate limits**: 14,400 req/day, 6,000 TPM (resets every ~6 seconds for tokens)
- Our `GroqClient` handles `x-ratelimit-reset-requests/tokens` headers and auto-retries

---

## OpenRouter Free Model Results

**API**: `https://openrouter.ai/api/v1/chat/completions`  
**Client**: Our own HTTP client (no `@ai-sdk/openrouter`)  
**Note**: Free tier models have severe rate limits (often 1 RPM or 20 RPD per model)

| Model | Score | Notes |
|-------|-------|-------|
| `nvidia/nemotron-3-super-120b-a12b:free` | 🟢 **100%** | Slow (11–45s) but high quality. Best free tier model. |
| `nvidia/nemotron-3-nano-30b-a3b:free` | 🟢 **100%** | Surprisingly fast (4–8s) and accurate. Excellent for free tier. |
| `arcee-ai/trinity-large-preview:free` | 🟢 **100%** | Slow (13–38s) but reliable. Good quality. |
| `qwen/qwen3.6-plus:free` | 🟡 **67%** | Uses many tokens (~2400–3800/test). Rate limited after 2/3 tests. |
| `stepfun/step-3.5-flash:free` | 🔴 **33%** | Mostly empty responses + rate limited. Unreliable. |
| `liquid/lfm-2.5-1.2b-thinking:free` | 🔴 **33%** | Too small (1.2B). Truncates responses. |
| `nousresearch/hermes-3-llama-3.1-405b:free` | 🔴 **0%** | Completely rate limited on free tier (exhausted immediately). |
| `qwen/qwen3-coder:free` | 🔴 **0%** | Rate limited. |
| `meta-llama/llama-3.2-3b-instruct:free` | 🔴 **0%** | Rate limited. |
| `google/gemma-3-27b-it:free` | 🔴 **0%** | Does NOT support `system` role (Google AI Studio backend). Rate limited. Fix: use merged user message. |
| `google/gemma-3-4b-it:free` | 🔴 **0%** | Too small — truncates JSON mid-response. Does not support system role. |
| `liquid/lfm-2.5-1.2b-instruct:free` | 🔴 **0%** | Too small (1.2B) — truncates JSON. |
| `nvidia/llama-nemotron-embed-vl-1b-v2:free` | 🔴 **0%** | **EMBEDDING MODEL** — cannot use with chat completions. Wrong model type. |

### OpenRouter Summary
- **3/13 models work** reliably (Nemotron 120B, Nemotron 30B, Trinity)
- **Free tier caveats**: Most free models have extremely tight rate limits (1 RPM)
- **Key compatibility issues**:
  - Gemma models: no `system` role support — embed system prompt in user message
  - Nemotron Embed: embedding-only, not a chat model
  - Small models (1–4B): truncate complex JSON, insufficient for UISchema generation

---

## Token Efficiency

UISchema is specifically designed to be token-efficient:

| Format | Tokens for a login form | Notes |
|--------|------------------------|-------|
| **UISchema JSON** | ~450–900 tokens | Compact IR, minimal repetition |
| Equivalent HTML | ~1,500–2,500 tokens | Verbose attributes, CSS, boilerplate |
| Equivalent React TSX | ~1,200–2,000 tokens | Import statements, types, props |

**Savings**: UISchema uses **60–80% fewer tokens** than equivalent HTML/React output.

Thinking models (Qwen3 32B) use more tokens due to `<think>` blocks, but our client strips them before returning content.

---

## Recommendations

### For Local Development
```
GROQ_API_KEY=gsk_...     # Free tier, 14,400 req/day
Model: llama-3.3-70b-versatile   # Best quality
Model: llama-3.1-8b-instant      # Fastest (~0.5s/request)
```

### For Production
```
GROQ_API_KEY=...          # Primary: excellent quality + speed
OPENROUTER_API_KEY=...    # Fallback: access to any model (paid tier recommended)
ANTHROPIC_API_KEY=...     # Alternative: Claude for highest quality
```

### For OpenRouter Free Tier
Use `nemotron-3-nano-30b-a3b:free` — best free tier model for UISchema (fast, 100% pass rate).  
Note: all free models have ~1 RPM limits — not suitable for production.

---

## Architecture Decision: No External AI SDK

UISchema uses its own HTTP clients (no `@ai-sdk/groq`, no Vercel AI SDK) because:
1. **Zero dependency footprint** — core packages stay lean
2. **Full control** over rate-limit headers, retry logic, and streaming
3. **Provider-agnostic** — same interface works for Groq, OpenRouter, Anthropic
4. **Our SDK IS the integration layer** — other AI SDKs would be redundant

The CLI, `GroqClient`, and docs-site API route all use native Node.js `https` with `https-proxy-agent` for proxy support.
