import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

CRITICAL STRUCTURE RULES:
- Every node is: {"type":"ComponentType","props":{...},"children":[...]}
- ALL properties (text, label, variant, level, etc.) go INSIDE "props"
- "children" is ALWAYS an array of node objects, never a string
- NEVER put text/label/level/variant directly on the node — they go in props

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

// ─── Model Registry ────────────────────────────────────────────────────────────

// Models that do NOT support response_format: json_object
const NO_JSON_MODE = new Set(['qwen/qwen3-32b', 'qwen/qwen3-coder:free', 'qwen/qwen3.6-plus:free']);
// Models that produce <think>...</think> blocks
const STRIP_THINKING = new Set(['qwen/qwen3-32b', 'qwen/qwen3-coder:free', 'qwen/qwen3.6-plus:free', 'liquid/lfm-2.5-1.2b-thinking:free']);

const GROQ_MODELS: Record<string, string> = {
  'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'llama-4-scout': 'meta-llama/llama-4-scout-17b-16e-instruct',
  'kimi-k2': 'moonshotai/kimi-k2-instruct',
  'compound': 'groq/compound',
  'compound-mini': 'groq/compound-mini',
  'qwen3-32b': 'qwen/qwen3-32b',
};

const OPENROUTER_MODELS: Record<string, string> = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'claude-sonnet': 'anthropic/claude-sonnet-4-5',
  'qwen3-coder': 'qwen/qwen3-coder:free',
  'gemma-3-27b': 'google/gemma-3-27b-it:free',
  'hermes-405b': 'nousresearch/hermes-3-llama-3.1-405b:free',
  'llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct',
};

const ANTHROPIC_MODELS = new Set([
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
  'claude-sonnet-4-5',
]);

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

function parseResetMs(value: string | null): number {
  if (!value) return 0;
  const v = value.trim().toLowerCase();
  if (v.endsWith('ms')) return parseFloat(v);
  if (v.endsWith('s')) return parseFloat(v) * 1000;
  return parseFloat(v) * 1000;
}

type HttpResult = { status: number; data: Record<string, unknown>; headers: Record<string, string> };

function httpsPost(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body: unknown
): Promise<HttpResult> {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(bodyStr), 'Content-Type': 'application/json' } },
      (res) => {
        let raw = '';
        const resHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          resHeaders[k] = Array.isArray(v) ? v[0] : (v ?? '');
        }
        res.on('data', (c: string) => { raw += c; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 500, data: JSON.parse(raw), headers: resHeaders });
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 300)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

/** Extract the first JSON object from a text string (handles <think> tags, markdown fences) */
function extractJson(text: string): string {
  let t = text.trim();
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (t.startsWith('{')) return t;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const obj = t.match(/(\{[\s\S]*\})/);
  if (obj) return obj[1];
  return t;
}

// ─── Provider callers ──────────────────────────────────────────────────────────

async function callGroq(prompt: string, model: string, apiKey: string) {
  const groqModel = GROQ_MODELS[model] ?? model;
  const useJsonMode = !NO_JSON_MODE.has(groqModel);
  const maxTokens = groqModel === 'qwen/qwen3-32b' ? 3000 : 2000;

  const body: Record<string, unknown> = {
    model: groqModel,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.2,
  };
  if (useJsonMode) body.response_format = { type: 'json_object' };

  const res = await httpsPost(
    'api.groq.com',
    '/openai/v1/chat/completions',
    { Authorization: `Bearer ${apiKey}` },
    body
  );

  if (res.status === 429) {
    const resetMs = Math.max(
      parseResetMs(res.headers['x-ratelimit-reset-requests']),
      parseResetMs(res.headers['x-ratelimit-reset-tokens']),
      1000
    );
    throw Object.assign(new Error('Rate limit exceeded. Please try again shortly.'), { status: 429, retryAfterMs: resetMs });
  }
  if (res.status >= 400) {
    const err = (res.data?.error as Record<string, unknown>) ?? {};
    throw new Error(`Groq error ${res.status}: ${err.message ?? JSON.stringify(res.data).slice(0, 200)}`);
  }

  let content = (res.data?.choices as Array<{ message: { content: string } }>)?.[0]?.message?.content ?? '';
  if (STRIP_THINKING.has(groqModel)) {
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
  return {
    content,
    model: (res.data?.model as string) ?? groqModel,
    tokens: (res.data?.usage as Record<string, number>)?.total_tokens ?? 0,
    rateLimitHeaders: {
      'x-uischema-ratelimit-remaining': res.headers['x-ratelimit-remaining-tokens'] ?? '',
      'x-uischema-ratelimit-reset-ms': res.headers['x-ratelimit-reset-tokens'] ?? '',
    },
  };
}

async function callOpenRouter(prompt: string, model: string, apiKey: string) {
  const orModel = OPENROUTER_MODELS[model] ?? model;

  const res = await httpsPost(
    'openrouter.ai',
    '/api/v1/chat/completions',
    {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/skeehn/ui-schema',
      'X-Title': 'UISchema Docs',
    },
    {
      model: orModel,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      max_tokens: STRIP_THINKING.has(orModel) ? 3000 : 2000,
      temperature: 0.2,
    }
  );

  if (res.status === 429) throw Object.assign(new Error('Rate limit exceeded.'), { status: 429 });
  if (res.status >= 400) {
    const err = (res.data?.error as Record<string, unknown>) ?? {};
    throw new Error(`OpenRouter error ${res.status}: ${err.message ?? JSON.stringify(res.data).slice(0, 200)}`);
  }

  let content = (res.data?.choices as Array<{ message: { content: string } }>)?.[0]?.message?.content ?? '';
  if (STRIP_THINKING.has(orModel)) {
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
  return {
    content,
    model: (res.data?.model as string) ?? orModel,
    tokens: (res.data?.usage as Record<string, number>)?.total_tokens ?? 0,
    rateLimitHeaders: {} as Record<string, string>,
  };
}

async function callAnthropic(prompt: string, model: string, apiKey: string) {
  const res = await httpsPost(
    'api.anthropic.com',
    '/v1/messages',
    { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    {
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }
  );

  if (res.status >= 400) {
    const err = (res.data?.error as Record<string, unknown>) ?? {};
    throw new Error(`Anthropic error ${res.status}: ${err.message ?? JSON.stringify(res.data).slice(0, 200)}`);
  }

  const text = (res.data?.content as Array<{ text: string }>)?.[0]?.text ?? '';
  const usage = res.data?.usage as Record<string, number> ?? {};
  return {
    content: text,
    model: (res.data?.model as string) ?? model,
    tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
    rateLimitHeaders: {} as Record<string, string>,
  };
}

// ─── Provider detection ────────────────────────────────────────────────────────

function detectProvider(model: string): 'groq' | 'openrouter' | 'anthropic' {
  if (model in GROQ_MODELS || (process.env.GROQ_API_KEY && !ANTHROPIC_MODELS.has(model))) {
    if (process.env.GROQ_API_KEY) return 'groq';
  }
  if (ANTHROPIC_MODELS.has(model) && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  throw new Error('No AI provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.');
}

// ─── Error classifier ──────────────────────────────────────────────────────────

function classifyError(error: unknown): { message: string; status: number } {
  if (!(error instanceof Error)) return { message: 'Unknown error', status: 500 };
  const e = error as Error & { status?: number };
  if (e.status === 429) return { message: e.message, status: 429 };
  const msg = error.message;
  if (msg.includes('credits') || msg.includes('quota') || msg.includes('balance')) return { message: msg, status: 402 };
  if (msg.includes('rate limit') || msg.includes('429')) return { message: msg, status: 429 };
  if (msg.includes('No AI provider')) return { message: msg, status: 503 };
  if (msg.includes('JSON') || msg.includes('parse')) return { message: 'Model response was not valid JSON', status: 422 };
  return { message: msg, status: 500 };
}

// ─── POST /api/generate ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  try {
    const body = await request.json();
    const { prompt, model = 'llama-3.3-70b-versatile' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let provider: 'groq' | 'openrouter' | 'anthropic';
    try {
      provider = detectProvider(model);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'No provider available' }, { status: 503 });
    }

    const apiKey =
      provider === 'groq' ? process.env.GROQ_API_KEY! :
      provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY! :
      process.env.OPENROUTER_API_KEY!;

    let result: Awaited<ReturnType<typeof callGroq>>;
    try {
      if (provider === 'groq') result = await callGroq(prompt, model, apiKey);
      else if (provider === 'anthropic') result = await callAnthropic(prompt, model, apiKey);
      else result = await callOpenRouter(prompt, model, apiKey);
    } catch (err) {
      const { message, status } = classifyError(err);
      return NextResponse.json({ error: message }, { status });
    }

    // Parse and validate JSON
    const jsonText = extractJson(result.content);
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: 'Model response was not valid JSON', debug: result.content.slice(0, 200) },
        { status: 422 }
      );
    }

    if (!schema?.root) {
      return NextResponse.json({ error: 'Generated JSON is missing required "root" field' }, { status: 422 });
    }

    return NextResponse.json(schema, {
      headers: {
        'x-uischema-duration-ms': String(Date.now() - startMs),
        'x-uischema-model': result.model,
        'x-uischema-provider': provider,
        'x-uischema-tokens': String(result.tokens),
        ...result.rateLimitHeaders,
      },
    });
  } catch (error) {
    const { message, status } = classifyError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// ─── GET /api/generate — capability discovery ──────────────────────────────────

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const available: string[] = [];
  if (hasGroq) available.push(...Object.keys(GROQ_MODELS));
  if (hasOpenRouter) available.push(...Object.keys(OPENROUTER_MODELS));
  if (hasAnthropic) available.push(...ANTHROPIC_MODELS);

  return NextResponse.json({
    providers: { groq: hasGroq, openrouter: hasOpenRouter, anthropic: hasAnthropic },
    defaultModel: hasGroq ? 'llama-3.3-70b-versatile' : hasOpenRouter ? 'gemma-3-27b' : hasAnthropic ? 'claude-3-5-haiku-20241022' : 'none',
    models: {
      groq: hasGroq ? Object.keys(GROQ_MODELS) : [],
      openrouter: hasOpenRouter ? Object.keys(OPENROUTER_MODELS) : [],
      anthropic: hasAnthropic ? [...ANTHROPIC_MODELS] : [],
    },
    available: [...new Set(available)],
  });
}
