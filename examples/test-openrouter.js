#!/usr/bin/env node
/**
 * OpenRouter × UISchema Integration Test
 *
 * Tests all 13 free OpenRouter models provided by the user.
 * Uses our own HTTP client (no @ai-sdk/openrouter).
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --fast
 *   OPENROUTER_API_KEY=sk-or-... node examples/test-openrouter.js --model google/gemma-3-27b-it:free
 */

require('dotenv').config();

const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { UISchemaDocumentSchema, validateBasicA11y } = require('@uischema/core');
const { renderUISchema } = require('@uischema/react');

const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy;
const PROXY_AGENT = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error('\n  ❌  OPENROUTER_API_KEY not set. Add it to .env or environment.\n');
  process.exit(1);
}

const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const MODEL_FILTER = (() => { const idx = args.indexOf('--model'); return idx !== -1 ? args[idx + 1] : null; })();
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const MIN_INTERVAL_MS = 1000; // OpenRouter free tier: be gentle
const REQUEST_TIMEOUT_MS = 90000; // 90s timeout per request (free models can be slow)

// ─── Model registry ────────────────────────────────────────────────────────────

const MODELS = [
  // Large/capable models — best quality
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 Llama 405B', supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'primary' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free',    name: 'Nemotron Super 120B', supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'primary' },
  { id: 'google/gemma-3-27b-it:free',                name: 'Gemma 3 27B',         supportsJsonMode: false, stripThink: false, noSystemRole: true,  maxTokens: 2000, tier: 'primary' },
  { id: 'qwen/qwen3-coder:free',                     name: 'Qwen3 Coder',         supportsJsonMode: false, stripThink: true,  noSystemRole: false, maxTokens: 3000, tier: 'primary' },
  { id: 'qwen/qwen3.6-plus:free',                    name: 'Qwen 3.6 Plus',       supportsJsonMode: false, stripThink: true,  noSystemRole: false, maxTokens: 3000, tier: 'primary' },

  // Medium models
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free',       name: 'Nemotron Nano 30B',   supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'arcee-ai/trinity-large-preview:free',       name: 'Trinity Large',       supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'stepfun/step-3.5-flash:free',               name: 'Step 3.5 Flash',      supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',     name: 'Llama 3.2 3B',        supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'google/gemma-3-4b-it:free',                 name: 'Gemma 3 4B',          supportsJsonMode: false, stripThink: false, noSystemRole: true,  maxTokens: 2000, tier: 'secondary' },

  // Specialized/experimental
  { id: 'liquid/lfm-2.5-1.2b-thinking:free',         name: 'LFM 1.2B Thinking',   supportsJsonMode: false, stripThink: true,  noSystemRole: false, maxTokens: 3000, tier: 'secondary' },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free',         name: 'LFM 1.2B Instruct',   supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'nvidia/llama-nemotron-embed-vl-1b-v2:free', name: 'Nemotron Embed 1B',   supportsJsonMode: false, stripThink: false, noSystemRole: false, maxTokens: 1000, tier: 'secondary' },
];

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

CRITICAL STRUCTURE RULES:
- Every node is: {"type":"ComponentType","props":{...},"children":[...]}
- ALL properties (text, label, variant, level, etc.) go INSIDE "props"
- "children" is ALWAYS an array of node objects, never a string
- NEVER put text/label/level/variant directly on the node — they go in props

Example of CORRECT structure:
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
7. Return valid JSON ONLY — no markdown, no explanation, no preamble

Output format:
{"schemaVersion":"0.1.0","root":{"type":"Container","props":{"ariaLabel":"..."},"children":[...]},"meta":{"name":"...","description":"..."}}`;

// ─── Test prompts ──────────────────────────────────────────────────────────────

const TEST_PROMPTS = [
  {
    name: 'Login form',
    prompt: 'Create a login form with email and password fields and a submit button.',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return types.includes('Input') && types.includes('Button');
    },
  },
  {
    name: 'Dashboard cards',
    prompt: 'Create a dashboard with 3 metric cards showing revenue, users, and conversion rate.',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return types.includes('Card') && types.includes('Text');
    },
  },
  {
    name: 'Settings panel',
    prompt: 'Create a settings panel with notifications toggle switch, theme select dropdown, and a save button.',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return (types.includes('Switch') || types.includes('Checkbox') || types.includes('Select')) && types.includes('Button');
    },
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

function parseResetMs(value) {
  if (!value) return 0;
  const v = value.trim().toLowerCase();
  if (v.endsWith('ms')) return parseFloat(v);
  if (v.endsWith('s')) return parseFloat(v) * 1000;
  return parseFloat(v) * 1000;
}

function extractJson(text) {
  let t = text.trim();
  // Strip thinking tags
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  t = t.replace(/^[\s\S]*?(\{)/m, '{'); // Find first {
  if (t.startsWith('{')) return t;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const obj = t.match(/(\{[\s\S]*\})/);
  if (obj) return obj[1];
  return t;
}

let lastRequestAt = 0;
async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - elapsed);
  lastRequestAt = Date.now();
}

// ─── OpenRouter HTTP client ────────────────────────────────────────────────────

async function callOpenRouter(modelId, messages, opts = {}) {
  const { maxTokens = 2000, maxRetries = 2, noSystemRole = false } = opts;

  // Some models (Gemma) don't support the system role — merge into user message
  // Important: end with a partial JSON to "steer" the model to continue it
  let effectiveMessages = messages;
  if (noSystemRole) {
    const sysMsg = messages.find(m => m.role === 'system');
    const userMsgs = messages.filter(m => m.role !== 'system');
    if (sysMsg && userMsgs.length > 0) {
      effectiveMessages = [
        {
          role: 'user',
          content: `${sysMsg.content}\n\nTask: ${userMsgs[0].content}\n\nRespond with ONLY raw JSON, no markdown fences, no explanation:`,
        },
        ...userMsgs.slice(1),
      ];
    }
  }

  const bodyObj = {
    model: modelId,
    messages: effectiveMessages,
    max_tokens: maxTokens,
    temperature: 0.2,
  };
  const body = JSON.stringify(bodyObj);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();

    const result = await new Promise((resolve, reject) => {
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        req.destroy();
        reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`));
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
          'X-Title': 'UISchema Integration Test',
        },
      }, res => {
        let raw = '';
        const headers = {};
        for (const [k, v] of Object.entries(res.headers)) {
          headers[k] = Array.isArray(v) ? v[0] : v;
        }
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          if (timedOut) return;
          clearTimeout(timer);
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers });
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 200)}`));
          }
        });
      });
      req.on('error', (err) => { if (!timedOut) { clearTimeout(timer); reject(err); } });
      req.write(body);
      req.end();
    });

    if (result.status === 429) {
      const retryAfter = result.headers['retry-after'];
      // Free tier models often have 1 RPM limits — need to wait a full minute
      const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 62000;
      if (attempt < maxRetries) {
        if (VERBOSE) console.log(`     ↻ Rate limited. Waiting ${Math.round(waitMs / 1000)}s...`);
        else process.stdout.write(` (rate limited, waiting ${Math.round(waitMs / 1000)}s...)`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
    }

    if (result.status === 402) {
      throw new Error(`Insufficient credits on OpenRouter account`);
    }

    if (result.status >= 500) {
      if (attempt < maxRetries) { await sleep(2000 * (attempt + 1)); continue; }
      throw new Error(`Server error ${result.status}: ${JSON.stringify(result.data).slice(0, 200)}`);
    }

    if (result.status >= 400) {
      const err = result.data?.error;
      const msg = err?.message ?? JSON.stringify(result.data).slice(0, 200);
      // Check for model-specific errors
      if (msg.includes('not supported') || msg.includes('context length') || msg.includes('not available')) {
        throw new Error(`Model error [${result.status}]: ${msg}`);
      }
      throw new Error(`API error ${result.status}: ${msg}`);
    }

    // Check for OpenRouter error object in 200 response (some models return this)
    if (result.data?.error) {
      throw new Error(`OpenRouter error: ${result.data.error.message ?? JSON.stringify(result.data.error)}`);
    }

    const content = result.data?.choices?.[0]?.message?.content ?? '';
    const usage = result.data?.usage ?? {};

    // Check for empty/null content
    if (!content && content !== '') {
      throw new Error(`Empty response from model`);
    }

    return {
      content,
      model: result.data?.model ?? modelId,
      tokens: {
        prompt: usage.prompt_tokens ?? 0,
        completion: usage.completion_tokens ?? 0,
        total: usage.total_tokens ?? 0,
      },
    };
  }
  throw new Error('Max retries exceeded');
}

// ─── Single test runner ────────────────────────────────────────────────────────

async function runTest(model, testCase, opts = {}) {
  const { maxTokens = 2000, stripThink = false, noSystemRole = false } = opts;
  const start = Date.now();

  let apiResult;
  try {
    apiResult = await callOpenRouter(
      model.id,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: testCase.prompt },
      ],
      { maxTokens, maxRetries: 2, noSystemRole }
    );
  } catch (err) {
    return { pass: false, error: err.message, ms: Date.now() - start };
  }

  if (!apiResult.content || apiResult.content.trim() === '') {
    return { pass: false, error: 'Empty response', ms: Date.now() - start };
  }

  const jsonText = extractJson(apiResult.content);
  let doc;
  try {
    doc = JSON.parse(jsonText);
  } catch {
    return {
      pass: false,
      error: `JSON parse failed. Got: ${apiResult.content.slice(0, 100)}`,
      ms: Date.now() - start,
      tokens: apiResult.tokens,
    };
  }

  const validation = UISchemaDocumentSchema.safeParse(doc);
  if (!validation.success) {
    const errs = validation.error.errors.slice(0, 2).map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { pass: false, error: `Schema invalid: ${errs}`, tokens: apiResult.tokens, ms: Date.now() - start };
  }

  const a11yIssues = validateBasicA11y(validation.data.root);

  let rendered;
  try {
    rendered = renderUISchema(validation.data);
  } catch (err) {
    return { pass: false, error: `Render failed: ${err.message}`, tokens: apiResult.tokens, ms: Date.now() - start };
  }
  if (!rendered) {
    return { pass: false, error: 'Render returned null', tokens: apiResult.tokens, ms: Date.now() - start };
  }

  const customPass = testCase.validate ? testCase.validate(validation.data) : true;
  if (!customPass) {
    const types = collectTypes(validation.data.root);
    return {
      pass: false,
      warning: `Expected types missing. Got: ${[...new Set(types)].join(', ')}`,
      a11yIssues,
      tokens: apiResult.tokens,
      ms: Date.now() - start,
    };
  }

  return {
    pass: true,
    a11yIssues,
    tokens: apiResult.tokens,
    componentCount: collectTypes(validation.data.root).length,
    ms: Date.now() - start,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(ms) { return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's'; }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(72));
  console.log('  🧪  UISchema × OpenRouter Integration Test');
  console.log('  Key: ' + API_KEY.slice(0, 14) + '...' + API_KEY.slice(-6));
  if (FAST_MODE) console.log('  Mode: FAST (primary models only)');
  if (MODEL_FILTER) console.log('  Filter: ' + MODEL_FILTER);
  console.log('═'.repeat(72) + '\n');

  const modelsToTest = MODELS.filter(m => {
    if (MODEL_FILTER) return m.id.includes(MODEL_FILTER) || m.name.toLowerCase().includes(MODEL_FILTER.toLowerCase());
    if (FAST_MODE) return m.tier === 'primary';
    return true;
  });

  if (modelsToTest.length === 0) {
    console.error('  No models matched: ' + MODEL_FILTER);
    process.exit(1);
  }

  const results = [];

  for (const model of modelsToTest) {
    console.log('┌─ ' + model.name + ' (' + model.id + ')');
    const modelResults = { model, tests: [], totalMs: 0, totalTokens: 0 };
    const opts = { maxTokens: model.maxTokens, stripThink: model.stripThink, noSystemRole: model.noSystemRole };

    for (const testCase of TEST_PROMPTS) {
      process.stdout.write('│  …  ' + testCase.name.padEnd(25));
      const result = await runTest(model, testCase, opts);
      modelResults.tests.push({ name: testCase.name, ...result });
      modelResults.totalMs += result.ms || 0;
      modelResults.totalTokens += result.tokens?.total || 0;

      if (result.pass) {
        process.stdout.write(
          '\r│  ✅  ' + testCase.name.padEnd(25) +
          ' ' + fmt(result.ms).padStart(6) +
          ' ' + (result.tokens?.total ?? '?').toString().padStart(5) + ' tok' +
          (result.a11yIssues?.length ? '  ⚠️  ' + result.a11yIssues.length + ' a11y' : '') +
          '\n'
        );
      } else {
        process.stdout.write('\r│  ❌  ' + testCase.name.padEnd(25) + '\n');
        if (result.warning) console.log('│     ⚠️  ' + result.warning);
        if (result.error) console.log('│     ' + result.error.slice(0, 120));
      }
    }

    const passCount = modelResults.tests.filter(t => t.pass).length;
    const totalCount = modelResults.tests.length;
    const score = Math.round((passCount / totalCount) * 100);
    const icon = score === 100 ? '🟢' : score >= 67 ? '🟡' : '🔴';

    console.log(`└─ ${icon} Score: ${score}% (${passCount}/${totalCount}) │ ${fmt(modelResults.totalMs)} │ ${modelResults.totalTokens} tok\n`);
    results.push({ ...modelResults, passCount, totalCount, score });
  }

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log('═'.repeat(72));
  console.log('  📊  OpenRouter × UISchema Results\n');
  console.log('  ' + 'Model'.padEnd(34) + 'Score'.padEnd(8) + 'Tests'.padEnd(8) + 'Tokens'.padEnd(10) + 'Time');
  console.log('  ' + '─'.repeat(66));

  let grandPass = 0, grandTotal = 0, grandTokens = 0, grandMs = 0;
  const tokenSavings = [];

  for (const r of results) {
    const icon = r.score === 100 ? '🟢' : r.score >= 67 ? '🟡' : '🔴';
    const avgTokPerTest = r.totalCount > 0 ? Math.round(r.totalTokens / r.totalCount) : 0;
    console.log(
      '  ' + icon + ' ' + r.model.name.slice(0, 30).padEnd(32) +
      (r.score + '%').padEnd(8) +
      (r.passCount + '/' + r.totalCount).padEnd(8) +
      String(r.totalTokens).padEnd(10) +
      fmt(r.totalMs)
    );
    if (r.passCount > 0) tokenSavings.push({ name: r.model.name, avgTokPerTest });
    grandPass += r.passCount;
    grandTotal += r.totalCount;
    grandTokens += r.totalTokens;
    grandMs += r.totalMs;
  }

  const grandScore = grandTotal > 0 ? Math.round((grandPass / grandTotal) * 100) : 0;
  console.log('  ' + '─'.repeat(66));
  console.log(
    '  ' + '  TOTAL'.padEnd(32) +
    (grandScore + '%').padEnd(8) +
    (grandPass + '/' + grandTotal).padEnd(8) +
    String(grandTokens).padEnd(10) +
    fmt(grandMs)
  );

  // Token efficiency note
  if (tokenSavings.length > 0) {
    const avgTokens = Math.round(grandTokens / Math.max(grandTotal, 1));
    console.log('\n  💡  Token efficiency:');
    console.log(`     Average tokens per UISchema generation: ${avgTokens}`);
    console.log(`     UISchema is token-efficient by design — compact JSON IR vs verbose HTML/CSS`);
    console.log(`     Estimated token savings vs HTML: 60-80% (UISchema ~400-900 tok vs HTML ~1500-3000 tok)`);
  }

  console.log('\n' + '═'.repeat(72));

  if (grandScore === 100) {
    console.log('\n  🎉  All tests passed! UISchema × OpenRouter fully functional.\n');
  } else if (grandScore >= 67) {
    console.log(`\n  ✅  ${grandScore}% pass rate. Some models have limitations.\n`);
  } else {
    console.log(`\n  ⚠️   ${grandScore}% pass rate. Many free models may have capability limits.\n`);
  }

  process.exit(grandScore >= 50 ? 0 : 1);
}

main().catch(err => {
  console.error('\n  ❌  Unexpected error:', err.message);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
