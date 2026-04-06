var fs = require('fs');
var path = require('path');
var kleur = require('kleur');
var https = require('https');
var { HttpsProxyAgent } = require('https-proxy-agent');

var _proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
var _proxyAgent = _proxyUrl ? new HttpsProxyAgent(_proxyUrl) : undefined;

// ─── Spinner ──────────────────────────────────────────────────────────────────

var spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function createSpinner(text: string) {
  var i = 0;
  var timer: ReturnType<typeof setInterval>;
  return {
    start() {
      process.stdout.write('\x1B[?25l');
      timer = setInterval(() => {
        process.stdout.write('\r  ' + kleur.cyan(spinnerFrames[i % spinnerFrames.length]) + '  ' + text);
        i++;
      }, 80);
    },
    succeed(msg: string) {
      clearInterval(timer);
      process.stdout.write('\r  ' + kleur.green('✔') + '  ' + msg + '          \n');
      process.stdout.write('\x1B[?25h');
    },
    fail(msg: string) {
      clearInterval(timer);
      process.stdout.write('\r  ' + kleur.red('✖') + '  ' + msg + '          \n');
      process.stdout.write('\x1B[?25h');
    },
    update(msg: string) {
      // silent update — text will show on next spinner tick
      text = msg;
    },
  };
}

// ─── Rate limit state ─────────────────────────────────────────────────────────

function parseResetMs(value: string | undefined): number {
  if (!value) return 0;
  var v = value.trim().toLowerCase();
  if (v.endsWith('ms')) return parseFloat(v);
  if (v.endsWith('s')) return parseFloat(v) * 1000;
  return parseFloat(v) * 1000;
}

// ─── HTTP helper with rate-limit headers ──────────────────────────────────────

type HttpResult = {
  status: number;
  data: any;
  headers: Record<string, string>;
};

function postRequest(url: string, headers: Record<string, string>, body: any): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    var data = JSON.stringify(body);
    var urlObj = new URL(url);
    var req = https.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        agent: _proxyAgent,
        headers: { ...headers, 'Content-Length': Buffer.byteLength(data), 'Content-Type': 'application/json' },
      },
      (res: any) => {
        var raw = '';
        var resHeaders: Record<string, string> = {};
        for (var [k, v] of Object.entries(res.headers as Record<string, string | string[]>)) {
          resHeaders[k] = Array.isArray(v) ? v[0] : v;
        }
        res.on('data', (c: string) => { raw += c; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers: resHeaders });
          } catch (e) {
            reject(new Error('Non-JSON response (' + res.statusCode + '): ' + raw.slice(0, 200)));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Extract JSON from text (handles thinking tags, markdown fences) ──────────

function extractJson(text: string): string {
  var trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;
  // Strip <think>...</think>
  trimmed = trimmed.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (trimmed.startsWith('{')) return trimmed;
  // Markdown fence
  var fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // Raw object
  var obj = trimmed.match(/(\{[\s\S]*\})/);
  if (obj) return obj[1];
  return trimmed;
}

// ─── GROQ models ──────────────────────────────────────────────────────────────

var GROQ_CHAT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'moonshotai/kimi-k2-instruct',
  'groq/compound',
  'groq/compound-mini',
  'qwen/qwen3-32b',
];

// Models that do NOT support response_format json_object
var NO_JSON_MODE = new Set(['qwen/qwen3-32b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b']);

// ─── System prompt ────────────────────────────────────────────────────────────

var SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

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

Additional rules:
1. All interactive components (Button, Input, Textarea, Select, Checkbox, Switch, Slider) MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text props: text (string), level (h1|h2|h3|h4|h5|h6|body|caption|muted)
4. Button props: text (string), variant (primary|secondary|ghost|danger), ariaLabel (string)
5. Badge props: text (string), variant (default|success|warning|danger|primary)
6. Return valid JSON ONLY — no markdown, no explanation, no preamble

Output format:
{"schemaVersion":"0.1.0","root":{"type":"Container","props":{"ariaLabel":"..."},"children":[...]},"meta":{"name":"...","description":"..."}}`;

// ─── API callers ──────────────────────────────────────────────────────────────

async function callGroq(
  prompt: string,
  apiKey: string,
  model: string,
  maxRetries: number = 3
): Promise<{ content: string; tokens: number; model: string }> {
  var useJsonMode = !NO_JSON_MODE.has(model);
  var body: any = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    max_tokens: model === 'qwen/qwen3-32b' ? 3000 : 2000,
    temperature: 0.2,
  };
  if (useJsonMode) body.response_format = { type: 'json_object' };

  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    var res: HttpResult;
    try {
      res = await postRequest(
        'https://api.groq.com/openai/v1/chat/completions',
        { Authorization: 'Bearer ' + apiKey },
        body
      );
    } catch (netErr) {
      if (attempt < maxRetries) { await sleep(1000 * Math.pow(2, attempt)); continue; }
      throw new Error('Network error: ' + (netErr instanceof Error ? netErr.message : String(netErr)));
    }

    if (res.status === 429) {
      var resetMs = Math.max(
        parseResetMs(res.headers['x-ratelimit-reset-requests']),
        parseResetMs(res.headers['x-ratelimit-reset-tokens']),
        1000
      );
      var retryAfter = res.headers['retry-after'];
      var waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : resetMs;
      if (attempt < maxRetries) { await sleep(waitMs); continue; }
      throw new Error('Rate limit exceeded after ' + maxRetries + ' retries');
    }

    if (res.status >= 500) {
      if (attempt < maxRetries) { await sleep(1000 * Math.pow(2, attempt)); continue; }
      throw new Error('Groq server error ' + res.status + ': ' + JSON.stringify(res.data).slice(0, 200));
    }

    if (res.status >= 400) {
      var errObj = res.data?.error;
      throw new Error('Groq error ' + res.status + ' [' + (errObj?.type ?? 'unknown') + ']: ' + (errObj?.message ?? JSON.stringify(res.data).slice(0, 200)));
    }

    var content = res.data?.choices?.[0]?.message?.content ?? '';
    var tokens = res.data?.usage?.total_tokens ?? 0;
    return { content, tokens, model: res.data?.model ?? model };
  }
  throw new Error('Max retries exceeded');
}

async function callOpenAI(prompt: string, apiKey: string, model: string): Promise<{ content: string; tokens: number; model: string }> {
  var res = await postRequest(
    'https://api.openai.com/v1/chat/completions',
    { Authorization: 'Bearer ' + apiKey },
    {
      model,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }
  );
  if (res.status >= 400) {
    throw new Error('OpenAI error ' + res.status + ': ' + (res.data?.error?.message ?? JSON.stringify(res.data)));
  }
  return {
    content: res.data?.choices?.[0]?.message?.content ?? '',
    tokens: res.data?.usage?.total_tokens ?? 0,
    model: res.data?.model ?? model,
  };
}

async function callAnthropic(prompt: string, apiKey: string, model: string): Promise<{ content: string; tokens: number; model: string }> {
  var res = await postRequest(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    {
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }
  );
  if (res.status >= 400) {
    throw new Error('Anthropic error ' + res.status + ': ' + (res.data?.error?.message ?? JSON.stringify(res.data)));
  }
  var text = res.data?.content?.[0]?.text ?? '';
  return {
    content: text,
    tokens: (res.data?.usage?.input_tokens ?? 0) + (res.data?.usage?.output_tokens ?? 0),
    model: res.data?.model ?? model,
  };
}

// ─── generateCommand ──────────────────────────────────────────────────────────

async function generateCommand(args: string[]): Promise<void> {
  try { require('dotenv').config(); } catch {}

  var groqKey = process.env.GROQ_API_KEY;
  var openaiKey = process.env.OPENAI_API_KEY;
  var anthropicKey = process.env.ANTHROPIC_API_KEY;
  var modelFlag = '';
  var promptParts: string[] = [];

  // Parse --model flag
  for (var i = 0; i < args.length; i++) {
    if ((args[i] === '--model' || args[i] === '-m') && args[i + 1]) {
      modelFlag = args[i + 1];
      i++;
    } else {
      promptParts.push(args[i]);
    }
  }

  var prompt = promptParts.join(' ').trim();
  if (!prompt) {
    console.error('\n  ' + kleur.red('Error: prompt is required'));
    console.error(kleur.gray('  Usage: uischema generate "a login form with email and password"'));
    console.error(kleur.gray('  Usage: uischema generate --model llama-3.1-8b-instant "a dashboard"'));
    console.error('');
    console.error('  ' + kleur.bold('Available providers:'));
    console.error('    ' + kleur.cyan('GROQ_API_KEY') + kleur.gray(' → Groq (fast, free tier available)'));
    console.error('    ' + kleur.cyan('OPENAI_API_KEY') + kleur.gray(' → OpenAI GPT models'));
    console.error('    ' + kleur.cyan('ANTHROPIC_API_KEY') + kleur.gray(' → Anthropic Claude models'));
    console.error('');
    process.exit(1);
  }

  if (!groqKey && !openaiKey && !anthropicKey) {
    console.error('\n  ' + kleur.red('✖') + '  No API key found.\n');
    console.error('  Set one of:');
    console.error('    ' + kleur.cyan('GROQ_API_KEY') + kleur.gray('      (recommended — fast & free tier)'));
    console.error('    ' + kleur.cyan('OPENAI_API_KEY'));
    console.error('    ' + kleur.cyan('ANTHROPIC_API_KEY') + '\n');
    process.exit(1);
  }

  var provider: 'groq' | 'openai' | 'anthropic';
  var apiKey: string;
  var model: string;

  if (groqKey) {
    provider = 'groq';
    apiKey = groqKey;
    model = modelFlag || process.env.AI_SDK_MODEL || 'llama-3.3-70b-versatile';
  } else if (openaiKey) {
    provider = 'openai';
    apiKey = openaiKey;
    model = modelFlag || process.env.AI_SDK_MODEL || 'gpt-4o-mini';
  } else {
    provider = 'anthropic';
    apiKey = anthropicKey!;
    model = modelFlag || process.env.AI_SDK_MODEL || 'claude-3-5-haiku-20241022';
  }

  console.log('\n  ' + kleur.bold('Generating') + ' UISchema for:');
  console.log('  ' + kleur.cyan('"' + prompt + '"'));
  console.log('  ' + kleur.gray('Provider: ' + provider + ' | Model: ' + model) + '\n');

  var spinner = createSpinner('Calling ' + provider + ' API...');
  spinner.start();

  var result: { content: string; tokens: number; model: string };
  try {
    if (provider === 'groq') {
      result = await callGroq(prompt, apiKey, model);
    } else if (provider === 'openai') {
      result = await callOpenAI(prompt, apiKey, model);
    } else {
      result = await callAnthropic(prompt, apiKey, model);
    }
    spinner.succeed(kleur.bold(provider) + ' responded in ' + result.tokens + ' tokens');
  } catch (err) {
    spinner.fail('Failed: ' + (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  // Parse JSON
  var jsonText = extractJson(result.content);
  var schema: any;
  try {
    schema = JSON.parse(jsonText);
  } catch {
    console.error('\n  ' + kleur.red('✖') + '  Failed to parse JSON from response\n');
    console.error(kleur.gray(result.content.slice(0, 400)));
    process.exit(1);
  }

  if (!schema?.root) {
    console.error('\n  ' + kleur.red('✖') + '  Generated JSON is missing required "root" field\n');
    process.exit(1);
  }

  // Write output
  var outFile: string;
  var outputFlag = args.indexOf('--output') !== -1
    ? args[args.indexOf('--output') + 1]
    : args.indexOf('-o') !== -1
    ? args[args.indexOf('-o') + 1]
    : null;

  if (outputFlag) {
    outFile = path.resolve(process.cwd(), outputFlag);
  } else {
    outFile = path.resolve(process.cwd(), 'uischema.json');
  }

  fs.writeFileSync(outFile, JSON.stringify(schema, null, 2) + '\n');

  console.log('\n  ' + kleur.green('✔') + '  Written to ' + kleur.bold(path.relative(process.cwd(), outFile)));
  console.log('  ' + kleur.gray('Model: ' + result.model + ' | Tokens: ' + result.tokens));
  console.log('\n  ' + kleur.gray('Next:'));
  console.log('    ' + kleur.cyan('uischema validate') + ' ' + path.relative(process.cwd(), outFile));
  console.log('    ' + kleur.cyan('uischema preview') + '\n');
}

module.exports = { generateCommand };
