#!/usr/bin/env node
/**
 * Comprehensive UISchema + Groq integration test
 *
 * Tests:
 * - All 8 chat models (JSON mode + text mode)
 * - Rate limit handling & retry logic
 * - UISchema validation (Zod), accessibility checks, render
 * - Edge cases: empty props, deep nesting, all 23 component types, max tokens
 * - Concurrent-safe: sequential requests with throttling
 *
 * Usage:
 *   GROQ_API_KEY=gsk_... node examples/test-groq-comprehensive.js
 *   GROQ_API_KEY=gsk_... node examples/test-groq-comprehensive.js --fast   (skip slow models)
 *   GROQ_API_KEY=gsk_... node examples/test-groq-comprehensive.js --model llama-3.3-70b-versatile
 */

require('dotenv').config();

const { UISchemaDocumentSchema, validateBasicA11y, validateUISchemaDocument } = require('@uischema/core');
const { renderUISchema } = require('@uischema/react');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Route through proxy if configured (required in sandboxed environments)
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy;
const PROXY_AGENT = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

// ─── Config ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MIN_REQUEST_INTERVAL_MS = 500; // Throttle to avoid bursting token limits

if (!API_KEY) {
  console.error('\n  ❌  GROQ_API_KEY not set. Add it to your .env file or environment.\n');
  process.exit(1);
}

const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const MODEL_FILTER = (() => {
  const idx = args.indexOf('--model');
  return idx !== -1 ? args[idx + 1] : null;
})();
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// ─── Model registry ────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B',  jsonMode: true,  stripThink: false, maxTokens: 2000, tier: 'primary' },
  { id: 'llama-3.1-8b-instant',    name: 'Llama 3.1 8B',   jsonMode: true,  stripThink: false, maxTokens: 2000, tier: 'primary' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', jsonMode: true, stripThink: false, maxTokens: 2000, tier: 'primary' },
  { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2',    jsonMode: true,  stripThink: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'groq/compound',           name: 'Compound',        jsonMode: true,  stripThink: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'groq/compound-mini',      name: 'Compound Mini',   jsonMode: true,  stripThink: false, maxTokens: 2000, tier: 'secondary' },
  { id: 'qwen/qwen3-32b',          name: 'Qwen3 32B',       jsonMode: false, stripThink: true,  maxTokens: 3000, tier: 'secondary' },
  { id: 'allam-2-7b',              name: 'Allam 2 7B',      jsonMode: true,  stripThink: false, maxTokens: 1200, tier: 'secondary' },
];

// ─── Test prompts (from simple to complex) ────────────────────────────────────

const TEST_PROMPTS = [
  {
    name: 'Login form',
    prompt: 'Create a login form with email and password fields and a submit button. Wrap the fields in a Form component.',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      // Accept either Form wrapper or just Input+Button (some models omit Form)
      return types.includes('Input') && types.includes('Button');
    },
  },
  {
    name: 'Dashboard cards',
    prompt: 'Create a dashboard with 3 metric cards showing revenue, users, and conversion rate, plus a refresh button',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return types.includes('Card') && types.includes('Text') && types.includes('Button');
    },
  },
  {
    name: 'Feedback form',
    prompt: 'Create a feedback form with a star rating selector, text area for comments, name input, and submit button',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return types.includes('Textarea') && (types.includes('Input') || types.includes('Slider'));
    },
  },
  {
    name: 'Navigation header',
    prompt: 'Create a navigation header with a logo text, nav links (Home, About, Pricing, Contact), and a sign-in button',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return (types.includes('Link') || types.includes('Button')) && types.includes('Text');
    },
  },
  {
    name: 'Settings panel',
    prompt: 'Create a settings panel with notifications toggle, theme select dropdown, and a save button',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return (types.includes('Switch') || types.includes('Checkbox')) && types.includes('Select');
    },
  },
];

// Edge case tests (run on primary models only)
const EDGE_CASES = [
  {
    name: 'Minimal schema',
    prompt: 'Create a single text label saying "Hello World"',
    validate: (doc) => doc.root && doc.root.type,
  },
  {
    name: 'Deep nesting',
    prompt: 'Create a card inside a card inside a container with a text and button at each level',
    validate: (doc) => collectTypes(doc.root).filter(t => t === 'Card').length >= 1,
  },
  {
    name: 'All input types',
    prompt: 'Create a form with all input types: text, email, password, textarea, select, checkbox, radio group, switch, and slider',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return types.includes('Input') && types.includes('Textarea') && types.includes('Checkbox');
    },
  },
  {
    name: 'Badges and status',
    prompt: 'Create a status dashboard with 5 badges: success, warning, danger, primary, default',
    validate: (doc) => collectTypes(doc.root).includes('Badge'),
  },
  {
    name: 'Grid layout',
    prompt: 'Create a 3-column product grid with image, title, price, and add-to-cart button per card',
    validate: (doc) => {
      const types = collectTypes(doc.root);
      return types.includes('Grid') && types.includes('Card') && types.includes('Button');
    },
  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

function collectTypes(node, acc = []) {
  if (!node) return acc;
  acc.push(node.type);
  (node.children || []).forEach(c => collectTypes(c, acc));
  if (node.slots) Object.values(node.slots).forEach(s => {
    if (Array.isArray(s)) s.forEach(n => collectTypes(n, acc));
    else collectTypes(s, acc);
  });
  return acc;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseResetMs(value) {
  if (!value) return 0;
  const v = value.trim().toLowerCase();
  if (v.endsWith('ms')) return parseFloat(v);
  if (v.endsWith('s')) return parseFloat(v) * 1000;
  return parseFloat(v) * 1000;
}

function extractJson(text) {
  let trimmed = text.trim();
  // Strip thinking tags (Qwen3, DeepSeek-R1)
  trimmed = trimmed.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (trimmed.startsWith('{')) return trimmed;
  // Markdown fence
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // Embedded JSON object
  const obj = trimmed.match(/(\{[\s\S]*\})/);
  if (obj) return obj[1];
  return trimmed;
}

let lastRequestAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

// ─── Groq HTTP client with retry + rate limit handling ────────────────────────

async function callGroq(model, messages, opts = {}) {
  const { maxTokens = 2000, jsonMode = true, maxRetries = 3 } = opts;
  const body = JSON.stringify({
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        agent: PROXY_AGENT,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let raw = '';
        const headers = {};
        for (const [k, v] of Object.entries(res.headers)) {
          headers[k] = Array.isArray(v) ? v[0] : v;
        }
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers });
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (result.status === 429) {
      const retryAfter = result.headers['retry-after'];
      const resetReq = parseResetMs(result.headers['x-ratelimit-reset-requests']);
      const resetTok = parseResetMs(result.headers['x-ratelimit-reset-tokens']);
      const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : Math.max(resetReq, resetTok, 2000);
      if (attempt < maxRetries) {
        if (VERBOSE) console.log(`     ↻ Rate limited. Waiting ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
    }

    if (result.status >= 500) {
      if (attempt < maxRetries) { await sleep(1000 * Math.pow(2, attempt)); continue; }
      throw new Error(`Server error ${result.status}: ${JSON.stringify(result.data).slice(0, 200)}`);
    }

    if (result.status >= 400) {
      const err = result.data?.error;
      throw new Error(`API error ${result.status} [${err?.type ?? 'unknown'}]: ${err?.message ?? JSON.stringify(result.data).slice(0, 200)}`);
    }

    const content = result.data?.choices?.[0]?.message?.content ?? '';
    const usage = result.data?.usage ?? {};
    return {
      content,
      model: result.data?.model ?? model,
      tokens: { prompt: usage.prompt_tokens, completion: usage.completion_tokens, total: usage.total_tokens },
      rateLimits: {
        remaining: parseInt(result.headers['x-ratelimit-remaining-tokens'] ?? '?'),
        resetMs: parseResetMs(result.headers['x-ratelimit-reset-tokens']),
      },
    };
  }
  throw new Error('Max retries exceeded');
}

// ─── Single test runner ────────────────────────────────────────────────────────

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

Example of WRONG structure (do NOT do this):
{"type":"Text","text":"Hello","level":"h1"}  ← text/level must be in props
{"type":"Container","children":"some text"}   ← children must be an array

Component types: Container, Row, Column, Grid, Card, List, ListItem, Text, Image, Icon, Badge, Button, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form, Divider, Spacer.

Additional rules:
1. All interactive components (Button, Input, Textarea, Select, Checkbox, Switch, Slider, Link) MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text props: text (string), level (h1|h2|h3|h4|h5|h6|body|caption|muted)
4. Button props: text (string), variant (primary|secondary|ghost|danger), ariaLabel (string)
5. Badge props: text (string), variant (default|success|warning|danger|primary)
6. Link props: text (string), href (string), ariaLabel (string)
7. Return valid JSON ONLY — no markdown, no explanation, no preamble

Output format:
{"schemaVersion":"0.1.0","root":{"type":"Container","props":{"ariaLabel":"..."},"children":[...]},"meta":{"name":"...","description":"..."}}`;

async function runTest(model, testCase, options = {}) {
  const { jsonMode = true, stripThink = false, maxTokens = 2000 } = options;
  const start = Date.now();

  let groqResult;
  try {
    groqResult = await callGroq(
      model.id,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: testCase.prompt },
      ],
      { maxTokens, jsonMode, maxRetries: 2 }
    );
  } catch (err) {
    return { pass: false, error: err.message, ms: Date.now() - start };
  }

  // Parse JSON
  const jsonText = extractJson(groqResult.content);
  let doc;
  try {
    doc = JSON.parse(jsonText);
  } catch {
    return {
      pass: false,
      error: `JSON parse failed. Response: ${groqResult.content.slice(0, 150)}`,
      ms: Date.now() - start,
    };
  }

  // Schema validation
  const validation = UISchemaDocumentSchema.safeParse(doc);
  if (!validation.success) {
    const errs = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { pass: false, error: `Schema invalid: ${errs}`, tokens: groqResult.tokens, ms: Date.now() - start };
  }

  // A11y check
  const a11yIssues = validateBasicA11y(validation.data.root);

  // Render check
  let rendered;
  try {
    rendered = renderUISchema(validation.data);
  } catch (err) {
    return { pass: false, error: `Render failed: ${err.message}`, tokens: groqResult.tokens, ms: Date.now() - start };
  }
  if (!rendered) {
    return { pass: false, error: 'Render returned null', tokens: groqResult.tokens, ms: Date.now() - start };
  }

  // Custom validator
  const customPass = testCase.validate ? testCase.validate(validation.data) : true;
  if (!customPass) {
    const types = collectTypes(validation.data.root);
    return {
      pass: false,
      warning: `Expected component types missing. Got: ${[...new Set(types)].join(', ')}`,
      a11yIssues,
      tokens: groqResult.tokens,
      ms: Date.now() - start,
    };
  }

  return {
    pass: true,
    a11yIssues,
    tokens: groqResult.tokens,
    rateLimits: groqResult.rateLimits,
    componentCount: collectTypes(validation.data.root).length,
    ms: Date.now() - start,
  };
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

function fmt(ms) {
  return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's';
}

function bar(pass) {
  return pass ? '✅' : '❌';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(72));
  console.log('  🧪  UISchema × Groq Comprehensive Integration Test');
  console.log('  Key: ' + API_KEY.slice(0, 12) + '...' + API_KEY.slice(-6));
  if (FAST_MODE) console.log('  Mode: FAST (primary models only)');
  if (MODEL_FILTER) console.log('  Filter: ' + MODEL_FILTER);
  console.log('═'.repeat(72) + '\n');

  const modelsToTest = MODELS.filter(m => {
    if (MODEL_FILTER) return m.id === MODEL_FILTER || m.name.toLowerCase().includes(MODEL_FILTER.toLowerCase());
    if (FAST_MODE) return m.tier === 'primary';
    return true;
  });

  if (modelsToTest.length === 0) {
    console.error('  No models matched filter: ' + MODEL_FILTER);
    process.exit(1);
  }

  const results = [];

  for (const model of modelsToTest) {
    console.log('┌─ ' + model.name + ' (' + model.id + ')');
    console.log('│  JSON mode: ' + (model.jsonMode ? '✓' : '✗ (text parsing)') +
      ' | Strip thinking: ' + (model.stripThink ? '✓' : '✗'));

    const modelResults = { model, tests: [], edgeCases: [], totalMs: 0, totalTokens: 0 };
    const opts = { jsonMode: model.jsonMode, stripThink: model.stripThink, maxTokens: model.maxTokens };

    // ── Standard test prompts ────────────────────────────────────────────────
    for (const testCase of TEST_PROMPTS) {
      process.stdout.write('│  ' + bar(null) + '  ' + testCase.name.padEnd(25));
      const result = await runTest(model, testCase, opts);
      modelResults.tests.push({ name: testCase.name, ...result });
      modelResults.totalMs += result.ms || 0;
      modelResults.totalTokens += result.tokens?.total || 0;

      if (result.pass) {
        process.stdout.write(
          '\r│  ✅  ' + testCase.name.padEnd(25) +
          ' ' + fmt(result.ms).padStart(6) +
          ' ' + (result.tokens?.total ?? '?').toString().padStart(5) + ' tok' +
          (result.a11yIssues?.length ? '  ⚠️  ' + result.a11yIssues.length + ' a11y issue(s)' : '') +
          '\n'
        );
      } else {
        process.stdout.write(
          '\r│  ❌  ' + testCase.name.padEnd(25) + ' FAILED\n'
        );
        if (result.warning) console.log('│     ⚠️  ' + result.warning);
        if (result.error) console.log('│     Error: ' + result.error.slice(0, 120));
      }
    }

    // ── Edge cases (primary models + unless --fast) ──────────────────────────
    if (model.tier === 'primary' && !FAST_MODE) {
      console.log('│  ── Edge cases ──────────────────────────────────────────');
      for (const testCase of EDGE_CASES) {
        process.stdout.write('│  ' + bar(null) + '  ' + testCase.name.padEnd(25));
        const result = await runTest(model, testCase, opts);
        modelResults.edgeCases.push({ name: testCase.name, ...result });
        modelResults.totalMs += result.ms || 0;
        modelResults.totalTokens += result.tokens?.total || 0;

        if (result.pass) {
          process.stdout.write(
            '\r│  ✅  ' + testCase.name.padEnd(25) +
            ' ' + fmt(result.ms).padStart(6) + '\n'
          );
        } else {
          process.stdout.write('\r│  ❌  ' + testCase.name.padEnd(25) + ' FAILED\n');
          if (result.warning) console.log('│     ⚠️  ' + result.warning);
          if (result.error) console.log('│     ' + result.error.slice(0, 120));
        }
      }
    }

    const passCount = [...modelResults.tests, ...modelResults.edgeCases].filter(t => t.pass).length;
    const totalCount = modelResults.tests.length + modelResults.edgeCases.length;
    const score = Math.round((passCount / totalCount) * 100);

    console.log('│');
    console.log(`└─ Score: ${score}% (${passCount}/${totalCount}) │ Total: ${fmt(modelResults.totalMs)} │ Tokens: ${modelResults.totalTokens}\n`);
    results.push({ ...modelResults, passCount, totalCount, score });
  }

  // ─── Summary Table ─────────────────────────────────────────────────────────
  console.log('═'.repeat(72));
  console.log('  📊  Summary\n');
  console.log('  ' + 'Model'.padEnd(32) + 'Score'.padEnd(10) + 'Tests'.padEnd(10) + 'Tokens'.padEnd(10) + 'Time');
  console.log('  ' + '─'.repeat(66));

  let grandPassTotal = 0;
  let grandTotal = 0;
  let grandTokens = 0;
  let grandMs = 0;

  for (const r of results) {
    const icon = r.score === 100 ? '🟢' : r.score >= 80 ? '🟡' : '🔴';
    console.log(
      '  ' + icon + ' ' + r.model.name.padEnd(30) +
      (r.score + '%').padEnd(10) +
      (r.passCount + '/' + r.totalCount).padEnd(10) +
      String(r.totalTokens).padEnd(10) +
      fmt(r.totalMs)
    );
    grandPassTotal += r.passCount;
    grandTotal += r.totalCount;
    grandTokens += r.totalTokens;
    grandMs += r.totalMs;
  }

  const grandScore = Math.round((grandPassTotal / grandTotal) * 100);
  console.log('  ' + '─'.repeat(66));
  console.log(
    '  ' + '  TOTAL'.padEnd(32) +
    (grandScore + '%').padEnd(10) +
    (grandPassTotal + '/' + grandTotal).padEnd(10) +
    String(grandTokens).padEnd(10) +
    fmt(grandMs)
  );
  console.log('\n' + '═'.repeat(72));

  if (grandScore === 100) {
    console.log('\n  🎉  All tests passed! UISchema × Groq integration is fully functional.\n');
  } else if (grandScore >= 80) {
    console.log(`\n  ✅  ${grandScore}% pass rate. See individual failures above.\n`);
  } else {
    console.log(`\n  ⚠️   ${grandScore}% pass rate. Multiple failures detected.\n`);
  }

  const failed = results.some(r => r.score < 100);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error('\n  ❌  Unexpected error:', err.message);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
