import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const UISchemaNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.string(),
    props: z.record(z.unknown()).optional(),
    children: z.array(UISchemaNodeSchema).optional(),
    events: z
      .record(
        z.object({
          type: z.string(),
          name: z.string(),
          params: z.record(z.unknown()).optional(),
        })
      )
      .optional(),
    id: z.string().optional(),
    key: z.string().optional(),
  })
);

const UISchemaDocumentSchema = z.object({
  schemaVersion: z.string().optional(),
  root: UISchemaNodeSchema,
  meta: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      locale: z.string().optional(),
    })
    .optional(),
});

// ─── Model Registry ────────────────────────────────────────────────────────────

const OPENROUTER_MODELS = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-5.2-pro': 'openai/gpt-5.2-pro',
  'gpt-5.2': 'openai/gpt-5.2',
  'gpt-5.2-chat': 'openai/gpt-5.2-chat',
  'gpt-5.2-codex': 'openai/gpt-5.2-codex',
  'gemini-3-pro': 'google/gemini-3-pro-preview',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
  'sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  'qwen3-max': 'qwen/qwen3-max',
  'qwen3-coder-plus': 'qwen/qwen3-coder-plus',
  'qwen3-coder-flash': 'qwen/qwen3-coder-flash',
  'deepseek-v3.2': 'deepseek/deepseek-v3.2',
  'deepseek-v3.2-speciale': 'deepseek/deepseek-v3.2-speciale',
  'deepseek-v3.1': 'deepseek/deepseek-v3.1-terminus',
  'mistral-large-3': 'mistralai/mistral-large-2512',
  'llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct',
} as const;

type ModelKey = keyof typeof OPENROUTER_MODELS;

// Anthropic models routed directly (not via OpenRouter)
const ANTHROPIC_DIRECT_MODELS = new Set([
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
  'claude-sonnet-4-5',
  'claude-opus-4',
]);

function getModel(modelName?: string) {
  const key = modelName ?? 'qwen3-max';

  // Direct Anthropic routing
  if (ANTHROPIC_DIRECT_MODELS.has(key) && process.env.ANTHROPIC_API_KEY) {
    return anthropic(key);
  }

  // OpenRouter (multi-model gateway)
  if (process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    const modelId = OPENROUTER_MODELS[key as ModelKey] ?? OPENROUTER_MODELS['qwen3-max'];
    return openrouter(modelId);
  }

  // Fallback: direct OpenAI
  if (process.env.OPENAI_API_KEY) {
    return openai(key.startsWith('gpt') ? key : 'gpt-4o-mini');
  }

  // Fallback: direct Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-haiku-20241022');
  }

  throw new Error(
    'No AI provider configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.'
  );
}

const SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

UISchema component types:
- Layout: Container, Row, Column, Grid, Card, List, ListItem
- Display: Text, Image, Icon, Badge, Divider, Spacer
- Input: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider
- Action: Button, Link, Form

Rules:
1. All interactive components (Button, Input, Textarea, Select, Checkbox, Switch, Slider) MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text supports level prop: h1, h2, h3, h4, h5, h6, body, caption, muted
4. Button supports variant prop: primary, secondary, ghost, danger
5. Badge supports variant prop: default, success, warning, danger, primary
6. Use Card for grouped content, Grid for multi-column layouts, Row for horizontal items`;

// ─── POST /api/generate ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, stream: enableStream = false } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let aiModel;
    try {
      aiModel = getModel(model);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to initialize model' },
        { status: 500 }
      );
    }

    const promptWithSystem = `${SYSTEM_PROMPT}\n\nGenerate a UISchema for: ${prompt}`;

    // Streaming response
    if (enableStream) {
      const result = await streamObject({
        model: aiModel,
        schema: UISchemaDocumentSchema,
        prompt: promptWithSystem,
      });
      return result.toTextStreamResponse();
    }

    // Standard response
    const { object } = await generateObject({
      model: aiModel,
      schema: UISchemaDocumentSchema,
      prompt: promptWithSystem,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    let errorMessage = 'Failed to generate UI';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (
        error.message.includes('credits') ||
        error.message.includes('quota') ||
        error.message.includes('balance')
      ) {
        errorMessage = 'Insufficient credits or quota limit reached';
        statusCode = 402;
      } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (
        error.message.includes('model') &&
        (error.message.includes('not found') || error.message.includes('unavailable'))
      ) {
        errorMessage = 'Model is unavailable or not found';
        statusCode = 404;
      } else if (
        error.message.includes('schema') ||
        error.message.includes('validation') ||
        error.message.includes('parse')
      ) {
        errorMessage = 'Model response did not match expected schema format';
        statusCode = 422;
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'Request timed out. The model may be slow or overloaded.';
        statusCode = 504;
      }
    }

    if (error?.response?.status) {
      statusCode = error.response.status;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development'
          ? {
              details: {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
            }
          : {}),
      },
      { status: statusCode }
    );
  }
}

// ─── GET /api/generate — list available models ─────────────────────────────────

export async function GET() {
  return NextResponse.json({
    models: Object.keys(OPENROUTER_MODELS),
    directModels: [...ANTHROPIC_DIRECT_MODELS],
    providers: {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    },
  });
}
