#!/usr/bin/env node
/**
 * UISchema × OpenRouter — Production-Grade Integration Test
 *
 * Features:
 * - Uses our own OpenRouterClient (no external AI SDK)
 * - Persistent result cache: saves progress to .openrouter-results.json
 * - Smart rate-limit handling: parses retry-after, waits full 65s for 1RPM models
 * - Request timeout (90s) to prevent hangs on slow free models
 * - Per-model config: noSystemRole (Gemma), stripThinking (Qwen3)
 * - Sequential model testing with configurable inter-model delay
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --fast     (primary only)
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --resume   (skip done models)
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --model "Gemma 3 27B"
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --reset    (clear cache)
 */

require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { UISchemaDocumentSchema, validateBasicA11y } = require('@uischema/core');
const { renderUISchema } = require('@uischema/react');

// ─── Config ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error('\n  ❌  OPENROUTER_API_KEY not set\n');
  process.exit(1);
}

const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy;
const PROXY_AGENT = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;
const RESULTS_FILE = path.join(__dirname, '.openrouter-results.json');
const REQUEST_TIMEOUT_MS = 90_000;
const MIN_INTERVAL_MS = 1_200;  // between requests to same model
const INTER_MODEL_DELAY_MS = 2_000; // between models (reset per-second limits)

const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const RESUME = args.includes('--resume');
const RESET = args.includes('--reset');
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const MODEL_FILTER = (() => { const i = args.indexOf('--model'); return i !== -1 ? args[i + 1] : null; })();

if (RESET && fs.existsSync(RESULTS_FILE)) {
  fs.unlinkSync(RESULTS_FILE);
  console.log('  🗑️  Result cache cleared.\n');
}

// ─── Model registry ────────────────────────────────────────────────────────────

const MODELS = [
  // ── Primary (larger, more capable) ──────────────────────────────────────────
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 Llama 405B', noSys: false, stripThink: false, maxTok: 2000, tier: 'primary',   reliable: true  },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free',    name: 'Nemotron Super 120B', noSys: false, stripThink: false, maxTok: 2000, tier: 'primary',   reliable: true  },
  { id: 'google/gemma-3-27b-it:free',                name: 'Gemma 3 27B',         noSys: true,  stripThink: false, maxTok: 2000, tier: 'primary',   reliable: true  },
  { id: 'qwen/qwen3-coder:free',                     name: 'Qwen3 Coder',         noSys: false, stripThink: true,  maxTok: 3000, tier: 'primary',   reliable: true  },
  { id: 'qwen/qwen3.6-plus:free',                    name: 'Qwen 3.6 Plus',       noSys: false, stripThink: true,  maxTok: 3000, tier: 'primary',   reliable: true  },
  // ── Secondary (medium) ───────────────────────────────────────────────────────
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free',       name: 'Nemotron Nano 30B',   noSys: false, stripThink: false, maxTok: 2000, tier: 'secondary', reliable: true  },
  { id: 'arcee-ai/trinity-large-preview:free',       name: 'Trinity Large',       noSys: false, stripThink: false, maxTok: 2000, tier: 'secondary', reliable: true  },
  { id: 'stepfun/step-3.5-flash:free',               name: 'Step 3.5 Flash',      noSys: false, stripThink: false, maxTok: 2000, tier: 'secondary', reliable: false },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',     name: 'Llama 3.2 3B',        noSys: false, stripThink: false, maxTok: 2000, tier: 'secondary', reliable: false },
  { id: 'google/gemma-3-4b-it:free',                 name: 'Gemma 3 4B',          noSys: true,  stripThink: false, maxTok: 2000, tier: 'secondary', reliable: false },
  // ── Experimental / small ─────────────────────────────────────────────────────
  { id: 'liquid/lfm-2.5-1.2b-thinking:free',         name: 'LFM 1.2B Thinking',   noSys: false, stripThink: true,  maxTok: 3000, tier: 'secondary', reliable: false },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free',         name: 'LFM 1.2B Instruct',   noSys: false, stripThink: false, maxTok: 2000, tier: 'secondary', reliable: false },
  { id: 'nvidia/llama-nemotron-embed-vl-1b-v2:free', name: 'Nemotron Embed 1B',   noSys: false, stripThink: false, maxTok: 0,    tier: 'secondary', reliable: false, embeddingOnly: true },
];

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

CRITICAL STRUCTURE RULES:
- Every node is: {"type":"ComponentType","props":{...},"children":[...]}
- ALL properties (text, label, variant, level, etc.) go INSIDE "props"
- "children" is ALWAYS an array of node objects, never a string
- NEVER put text/label/level/variant directly on the node — they go in props

Example CORRECT structure:
{"type":"Text","props":{"text":"Hello","level":"h1"}}
{"type":"Button","props":{"text":"Submit","variant":"primary","ariaLabel":"Submit form"}}
{"type":"Input","props":{"placeholder":"Email","ariaLabel":"Email address"}}
{"type":"Container","props":{},"children":[...array of nodes...]}

Component types: Container, Row, Column, Grid, Card, List, ListItem, Text, Image, Icon, Badge, Button, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form, Divider, Spacer.

Rules:
1. All interactive components (Button, Input, Textarea, Select, Checkbox, Switch, Slider, Link) MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text props: text (string), level (h1|h2|h3|h4|h5|h6|body|caption|muted)
4. Button props: text (string), variant (primary|secondary|ghost|danger), ariaLabel (string)
5. Badge props: text (string), variant (default|success|warning|danger|primary)
6. Link props: text (string), href (string), ariaLabel (string)
7. Return valid JSON ONLY — no markdown fences, no explanation, no preamble

Output format:
{"schemaVersion":"0.1.0","root":{"type":"Container","props":{"ariaLabel":"..."},"children":[...]},"meta":{"name":"...","description":"..."}}`;

// ─── Test prompts ──────────────────────────────────────────────────────────────

const TEST_PROMPTS = [
  {
    name: 'Login form',
    prompt: 'Create a login form with email and password input fields and a submit button.',
    validate: (doc) => { const t = collectTypes(doc.root); return t.includes('Input') && t.includes('Button'); },
  },
  {
    name: 'Dashboard cards',
    prompt: 'Create a dashboard with 3 metric cards showing revenue, users, and conversion rate.',
    validate: (doc) => { const t = collectTypes(doc.root); return t.includes('Card') && t.includes('Text'); },
  },
  {
    name: 'Settings panel',
    prompt: 'Create a settings panel with a notifications toggle switch, a theme select dropdown, and a save button.',
    validate: (doc) => { const t = collectTypes(doc.root); return (t.includes('Switch') || t.includes('Select')) && t.includes('Button'); },
  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

function collectTypes(node, acc = []) {
  if (!node) return acc;
  acc.push(node.type);
  (node.children || []).forEach(c => collectTypes(c, acc));
  return acc;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractJson(text) {
  let t = text.trim();
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (t.startsWith('{')) return t;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const obj = t.match(/(\{[\s\S]*\})/);
  if (obj) return obj[1];
  return t;
}

function parseResetMs(v) {
  if (!v) return 65_000;
  const s = v.trim().toLowerCase();
  if (s.endsWith('ms')) return parseFloat(s);
  if (s.endsWith('m')) return parseFloat(s) * 60_000;
  if (s.endsWith('s')) return parseFloat(s) * 1_000;
  return parseFloat(s) * 1_000;
}

function fmt(ms) { return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's'; }

// ─── Result persistence ────────────────────────────────────────────────────────

function loadResults() {
  try { return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch { return {}; }
}

function saveResult(modelId, data) {
  const all = loadResults();
  all[modelId] = data;
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(all, null, 2));
}

// ─── OpenRouter HTTP client ────────────────────────────────────────────────────

let lastRequestAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - elapsed);
  lastRequestAt = Date.now();
}

async function callOpenRouter(modelId, messages, opts = {}) {
  const { maxTokens = 2000, maxRetries = 3, noSys = false } = opts;

  // Models that don't support system role (Gemma via Google AI Studio)
  let effectiveMessages = messages;
  if (noSys) {
    const sys = messages.find(m => m.role === 'system');
    const rest = messages.filter(m => m.role !== 'system');
    if (sys && rest.length > 0) {
      effectiveMessages = [
        { role: 'user', content: `${sys.content}\n\nTask: ${rest[0].content}\n\nRespond with ONLY raw JSON, no markdown fences:` },
        ...rest.slice(1),
      ];
    }
  }

  const body = JSON.stringify({
    model: modelId,
    messages: effectiveMessages,
    max_tokens: maxTokens,
    temperature: 0.2,
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();

    let result;
    try {
      result = await new Promise((resolve, reject) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          req.destroy();
          reject(new Error(`Timeout after ${REQUEST_TIMEOUT_MS / 1000}s`));
        }, REQUEST_TIMEOUT_MS);

        const req = https.request({
          hostname: 'openrouter.ai',
          path: '/api/v1/chat/completions',
          method: 'POST',
          agent: PROXY_AGENT,
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'HTTP-Referer': 'https://github.com/skeehn/ui-schema',
            'X-Title': 'UISchema',
          },
        }, res => {
          let raw = '';
          const headers = {};
          for (const [k, v] of Object.entries(res.headers)) headers[k] = Array.isArray(v) ? v[0] : v;
          res.on('data', c => { raw += c; });
          res.on('end', () => {
            if (timedOut) return;
            clearTimeout(timer);
            try { resolve({ status: res.statusCode, headers, data: JSON.parse(raw) }); }
            catch { reject(new Error(`Non-JSON (${res.statusCode}): ${raw.slice(0, 200)}`)); }
          });
        });
        req.on('error', e => { if (!timedOut) { clearTimeout(timer); reject(e); } });
        req.write(body);
        req.end();
      });
    } catch (err) {
      if (attempt < maxRetries) { await sleep(Math.min(2000 * (attempt + 1), 10000)); continue; }
      throw err;
    }

    if (result.status === 429) {
      // Parse wait time — free tier typically 1 RPM = 60s window
      const retryAfter = result.headers['retry-after'];
      const rlReset = result.headers['x-ratelimit-reset-requests'] || result.headers['x-ratelimit-reset-tokens'];
      let waitMs = 65_000; // default: wait 65s for 1 RPM limit
      if (retryAfter) waitMs = parseFloat(retryAfter) * 1_000;
      else if (rlReset) waitMs = parseResetMs(rlReset);

      // Detect daily-limit exhaustion (retry-after > 10 min = skip)
      const errMsg = result.data?.error?.message ?? '';
      const isDailyLimit = waitMs > 600_000 || errMsg.toLowerCase().includes('daily') || errMsg.toLowerCase().includes('quota');
      if (isDailyLimit) {
        throw new Error(`Daily rate limit exhausted for ${modelId}. Reset tomorrow.`);
      }

      if (attempt < maxRetries) {
        if (VERBOSE) process.stdout.write(`\n│     ↻ Rate limited. Waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1})...`);
        else process.stdout.write(` [waiting ${Math.round(waitMs / 1000)}s]`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`Rate limit: ${errMsg || 'too many requests'} (exhausted ${maxRetries} retries)`);
    }

    if (result.status === 402) throw new Error('Insufficient credits on OpenRouter account');
    if (result.status >= 500) {
      if (attempt < maxRetries) { await sleep(Math.min(3000 * (attempt + 1), 15000)); continue; }
      throw new Error(`Server error ${result.status}`);
    }
    if (result.status >= 400) {
      const msg = result.data?.error?.message ?? JSON.stringify(result.data).slice(0, 200);
      throw new Error(`API error ${result.status}: ${msg}`);
    }

    const content = result.data?.choices?.[0]?.message?.content ?? '';
    const usage = result.data?.usage ?? {};
    if (content === null) throw new Error('Null content in response (model may not support this prompt type)');

    return {
      content,
      model: result.data?.model ?? modelId,
      tokens: { prompt: usage.prompt_tokens ?? 0, completion: usage.completion_tokens ?? 0, total: usage.total_tokens ?? 0 },
    };
  }
  throw new Error('Max retries exceeded');
}

// ─── Single test runner ────────────────────────────────────────────────────────

async function runTest(model, testCase) {
  const start = Date.now();
  if (model.embeddingOnly) {
    return { pass: false, error: 'Embedding-only model — cannot generate text', ms: 0 };
  }

  let apiResult;
  try {
    apiResult = await callOpenRouter(model.id, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: testCase.prompt },
    ], { maxTokens: model.maxTok, maxRetries: 3, noSys: model.noSys });
  } catch (err) {
    return { pass: false, error: err.message, ms: Date.now() - start };
  }

  if (!apiResult.content || apiResult.content.trim() === '') {
    return { pass: false, error: 'Empty response', ms: Date.now() - start, tokens: apiResult.tokens };
  }

  const jsonText = extractJson(apiResult.content);
  let doc;
  try { doc = JSON.parse(jsonText); }
  catch {
    return { pass: false, error: `JSON parse failed. Got: ${apiResult.content.slice(0, 100)}`, ms: Date.now() - start, tokens: apiResult.tokens };
  }

  const validation = UISchemaDocumentSchema.safeParse(doc);
  if (!validation.success) {
    const errs = validation.error.errors.slice(0, 2).map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { pass: false, error: `Schema invalid: ${errs}`, tokens: apiResult.tokens, ms: Date.now() - start };
  }

  const a11yIssues = validateBasicA11y(validation.data.root);

  try { if (!renderUISchema(validation.data)) throw new Error('null'); }
  catch (err) { return { pass: false, error: `Render failed: ${err.message}`, tokens: apiResult.tokens, ms: Date.now() - start }; }

  const customPass = testCase.validate ? testCase.validate(validation.data) : true;
  if (!customPass) {
    return {
      pass: false,
      warning: `Expected types missing. Got: ${[...new Set(collectTypes(validation.data.root))].join(', ')}`,
      a11yIssues,
      tokens: apiResult.tokens,
      ms: Date.now() - start,
    };
  }

  return { pass: true, a11yIssues, tokens: apiResult.tokens, componentCount: collectTypes(validation.data.root).length, ms: Date.now() - start };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(72));
  console.log('  🧪  UISchema × OpenRouter — Production Integration Test');
  console.log('  Key: ' + API_KEY.slice(0, 14) + '...' + API_KEY.slice(-6));
  if (FAST_MODE) console.log('  Mode: FAST (primary models only)');
  if (RESUME) console.log('  Mode: RESUME (skipping completed models)');
  if (MODEL_FILTER) console.log('  Filter: ' + MODEL_FILTER);
  console.log('═'.repeat(72) + '\n');

  const cachedResults = loadResults();

  const modelsToTest = MODELS.filter(m => {
    if (MODEL_FILTER) return m.id.includes(MODEL_FILTER) || m.name.toLowerCase().includes(MODEL_FILTER.toLowerCase());
    if (FAST_MODE) return m.tier === 'primary';
    return true;
  });

  const allResults = [];

  for (let mi = 0; mi < modelsToTest.length; mi++) {
    const model = modelsToTest[mi];

    // Resume: skip if already tested
    if (RESUME && cachedResults[model.id]) {
      const cached = cachedResults[model.id];
      console.log(`⟳  Skipping ${model.name} — cached: ${cached.score}% (${cached.passCount}/${cached.totalCount})`);
      allResults.push(cached);
      continue;
    }

    console.log('┌─ ' + model.name + ' (' + model.id + ')');
    if (model.embeddingOnly) {
      console.log('│  ⚠️  Embedding-only model — skipping (cannot generate text)\n└─\n');
      const r = { model, tests: [], passCount: 0, totalCount: 3, score: 0, totalMs: 0, totalTokens: 0, skipReason: 'embedding-only' };
      saveResult(model.id, r);
      allResults.push(r);
      continue;
    }

    const noSysTag = model.noSys ? ' (no system role)' : '';
    const thinkTag = model.stripThink ? ' (strip thinking)' : '';
    console.log(`│  Config: ${noSysTag || thinkTag ? noSysTag + thinkTag : 'standard'}`);

    const modelResults = { model, tests: [], passCount: 0, totalCount: TEST_PROMPTS.length, score: 0, totalMs: 0, totalTokens: 0 };

    for (const testCase of TEST_PROMPTS) {
      process.stdout.write('│  …  ' + testCase.name.padEnd(28));
      const result = await runTest(model, testCase);
      modelResults.tests.push({ name: testCase.name, ...result });
      modelResults.totalMs += result.ms || 0;
      modelResults.totalTokens += result.tokens?.total || 0;

      if (result.pass) {
        process.stdout.write(
          '\r│  ✅  ' + testCase.name.padEnd(28) +
          ' ' + fmt(result.ms).padStart(7) +
          ' ' + String(result.tokens?.total ?? '?').padStart(5) + ' tok' +
          (result.a11yIssues?.length ? '  ⚠️  ' + result.a11yIssues.length + ' a11y' : '') +
          '\n'
        );
        modelResults.passCount++;
      } else {
        process.stdout.write('\r│  ❌  ' + testCase.name.padEnd(28) + '\n');
        if (result.warning) console.log('│     ⚠️  ' + result.warning);
        if (result.error) console.log('│     ' + result.error.slice(0, 120));
      }
    }

    modelResults.score = Math.round((modelResults.passCount / modelResults.totalCount) * 100);
    const icon = modelResults.score === 100 ? '🟢' : modelResults.score >= 67 ? '🟡' : '🔴';
    console.log(`└─ ${icon} Score: ${modelResults.score}% (${modelResults.passCount}/${modelResults.totalCount}) │ ${fmt(modelResults.totalMs)} │ ${modelResults.totalTokens} tok\n`);

    saveResult(model.id, modelResults);
    allResults.push(modelResults);

    // Inter-model delay (reset short-window rate limits)
    if (mi < modelsToTest.length - 1) await sleep(INTER_MODEL_DELAY_MS);
  }

  // ─── Summary ───────────────────────────────────────────────────────────────────
  console.log('═'.repeat(72));
  console.log('  📊  Results Summary\n');
  console.log('  ' + 'Model'.padEnd(34) + 'Score'.padEnd(8) + 'Tests'.padEnd(8) + 'Tokens'.padEnd(10) + 'Time');
  console.log('  ' + '─'.repeat(68));

  let grandPass = 0, grandTotal = 0, grandTokens = 0, grandMs = 0;

  for (const r of allResults) {
    const icon = r.score === 100 ? '🟢' : r.score >= 67 ? '🟡' : '🔴';
    const skip = r.skipReason ? ` (${r.skipReason})` : '';
    console.log(
      '  ' + icon + ' ' + r.model.name.slice(0, 30).padEnd(32) +
      (r.score + '%').padEnd(8) +
      (r.passCount + '/' + r.totalCount).padEnd(8) +
      String(r.totalTokens).padEnd(10) +
      (r.totalMs ? fmt(r.totalMs) : '—') + skip
    );
    grandPass += r.passCount;
    grandTotal += r.totalCount;
    grandTokens += r.totalTokens;
    grandMs += r.totalMs;
  }

  const grandScore = grandTotal > 0 ? Math.round((grandPass / grandTotal) * 100) : 0;
  console.log('  ' + '─'.repeat(68));
  console.log(
    '  ' + '  TOTAL'.padEnd(32) +
    (grandScore + '%').padEnd(8) +
    (grandPass + '/' + grandTotal).padEnd(8) +
    String(grandTokens).padEnd(10) +
    fmt(grandMs)
  );

  const avgTok = grandTotal > 0 ? Math.round(grandTokens / grandTotal) : 0;
  if (avgTok > 0) {
    console.log('\n  💡  Token efficiency:');
    console.log(`     Average: ${avgTok} tok/schema | Est. HTML equivalent: ${Math.round(avgTok * 3.5)} tok (${Math.round((1 - 1/3.5) * 100)}% savings)`);
  }

  console.log('\n  📄  Results saved to: ' + RESULTS_FILE);
  console.log('      Tip: use --resume to skip completed models on next run\n');
  console.log('═'.repeat(72) + '\n');

  process.exit(grandScore >= 50 ? 0 : 1);
}

main().catch(err => {
  console.error('\n  ❌  Unexpected error:', err.message);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
