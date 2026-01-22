import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const UISchemaNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.string(),
  props: z.record(z.unknown()).optional(),
  children: z.array(UISchemaNodeSchema).optional(),
  events: z.record(z.object({
    type: z.string(),
    name: z.string(),
    params: z.record(z.unknown()).optional(),
  })).optional(),
  id: z.string().optional(),
  key: z.string().optional(),
}));

const UISchemaDocumentSchema = z.object({
  schemaVersion: z.string().optional(),
  root: UISchemaNodeSchema,
  meta: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    locale: z.string().optional(),
  }).optional(),
});

// Available models for testing - OpenRouter model IDs (Latest 2025 models)
const AVAILABLE_MODELS = {
  // GPT-5.2 Series (Latest)
  'gpt-5.2-pro': 'openai/gpt-5.2-pro',
  'gpt-5.2': 'openai/gpt-5.2',
  'gpt-5.2-chat': 'openai/gpt-5.2-chat',
  'gpt-5.2-codex': 'openai/gpt-5.2-codex',
  
  // Gemini 3 Series (Latest)
  'gemini-3-pro': 'google/gemini-3-pro-preview',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
  
  // Claude Sonnet 4.5 (Latest)
  'sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  
  // Qwen3 Series (Latest)
  'qwen3-max': 'qwen/qwen3-max',
  'qwen3-coder-plus': 'qwen/qwen3-coder-plus',
  'qwen3-coder-flash': 'qwen/qwen3-coder-flash',
  
  // DeepSeek V3.2 Series (Latest)
  'deepseek-v3.2': 'deepseek/deepseek-v3.2',
  'deepseek-v3.2-speciale': 'deepseek/deepseek-v3.2-speciale',
  'deepseek-v3.1': 'deepseek/deepseek-v3.1-terminus',
  
  // Other Top Models
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'mistral-large-3': 'mistralai/mistral-large-2512',
  'llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct',
} as const;

type ModelKey = keyof typeof AVAILABLE_MODELS;

function getModel(modelName?: string) {
  // Use OpenRouter if API key is available
  if (process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Default to Qwen3 Max if no model specified (best performing model)
    const modelKey = (modelName as ModelKey) || 'qwen3-max';
    const modelId = AVAILABLE_MODELS[modelKey] || AVAILABLE_MODELS['qwen3-max'];
    
    return openrouter(modelId);
  }

  // Fallback to OpenAI if OpenRouter not available
  if (process.env.OPENAI_API_KEY) {
    return openai(modelName || 'gpt-4o-mini');
  }

  throw new Error('No API key configured. Please set OPENROUTER_API_KEY or OPENAI_API_KEY');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const modelToUse = model || 'qwen3-max';
    console.log('📥 API Request - Model:', modelToUse, 'Prompt:', prompt.substring(0, 50));
    
    let aiModel;
    try {
      aiModel = getModel(modelToUse);
      console.log('✅ Model initialized:', modelToUse);
    } catch (error) {
      console.error('❌ Model initialization failed:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to initialize model' },
        { status: 500 }
      );
    }

    const { object } = await generateObject({
      model: aiModel,
      schema: UISchemaDocumentSchema,
      prompt: `Generate a UISchema JSON document for: ${prompt}. 
      
Use these component types: Container, Row, Column, Grid, Card, List, ListItem, Text, Image, Icon, Badge, Button, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form, Divider, Spacer.

CRITICAL REQUIREMENTS:
1. The root container MUST have a children array with all requested UI components
2. Each child component must have a "type" field and a "props" object
3. For Input components, include props like: placeholder, type (for password/email), ariaLabel
4. For Button components, include props like: text, ariaLabel
5. Always include schemaVersion: "0.1.0"

Example structure:
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": { "className": "..." },
    "children": [
      { "type": "Input", "props": { "placeholder": "Email", "type": "email" } },
      { "type": "Input", "props": { "placeholder": "Password", "type": "password" } },
      { "type": "Button", "props": { "text": "Submit" } }
    ]
  }
}

Now generate the UISchema for: ${prompt}`,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error('Generation error:', error);
    
    // Handle specific error types
    let errorMessage = 'Failed to generate UI';
    let statusCode = 500;
    let errorDetails: any = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for OpenRouter/API specific errors
      if (error.message.includes('credits') || error.message.includes('quota') || error.message.includes('balance')) {
        errorMessage = 'Insufficient credits or quota limit reached';
        statusCode = 402; // Payment Required
        errorDetails = { type: 'credit_limit', originalError: error.message };
      } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429; // Too Many Requests
        errorDetails = { type: 'rate_limit', originalError: error.message };
      } else if (error.message.includes('model') && (error.message.includes('not found') || error.message.includes('unavailable'))) {
        errorMessage = 'Model is unavailable or not found';
        statusCode = 404; // Not Found
        errorDetails = { type: 'model_unavailable', originalError: error.message };
      } else if (error.message.includes('schema') || error.message.includes('validation') || error.message.includes('parse')) {
        errorMessage = 'Model response did not match expected schema format';
        statusCode = 422; // Unprocessable Entity
        errorDetails = { type: 'schema_validation', originalError: error.message };
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'Request timed out. The model may be slow or overloaded.';
        statusCode = 504; // Gateway Timeout
        errorDetails = { type: 'timeout', originalError: error.message };
      }
    }

    // Check for AI SDK specific error structure
    if (error?.cause) {
      errorDetails.cause = error.cause;
    }

    // Check for OpenRouter error response structure
    if (error?.response?.status) {
      statusCode = error.response.status;
      if (error.response.data) {
        errorDetails.apiResponse = error.response.data;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        ...errorDetails,
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          fullError: String(error)
        } : undefined
      },
      { status: statusCode }
    );
  }
}

// GET endpoint to list available models
export async function GET() {
  return NextResponse.json({
    models: Object.keys(AVAILABLE_MODELS),
    usingOpenRouter: !!process.env.OPENROUTER_API_KEY,
    usingOpenAI: !!process.env.OPENAI_API_KEY,
  });
}
