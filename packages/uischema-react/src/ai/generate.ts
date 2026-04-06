import type { UISchemaDocument } from "@uischema/core";
import { GroqClient, GROQ_MODELS, extractJson } from "./groq";

export type GenerateUISchemaOptions = {
  /** API key — can also be set via OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY env vars */
  apiKey?: string;
  /** Model to use (e.g. 'gpt-4o-mini', 'llama-3.3-70b-versatile', 'claude-3-5-haiku-20241022') */
  model?: string;
  /** Provider. Auto-detected from apiKey prefix when omitted. */
  provider?: "openai" | "anthropic" | "groq";
  /** System prompt override */
  systemPrompt?: string;
  /** Max tokens to generate. Defaults to 2000. */
  maxTokens?: number;
};

const SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

UISchema component types:
- Layout: Container, Row, Column, Grid, Card, List, ListItem
- Display: Text, Image, Icon, Badge, Divider, Spacer
- Input: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider
- Action: Button, Link, Form

Rules:
1. All interactive components (Button, Input, Textarea, Select, Checkbox, Switch, Slider) MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text supports a "level" prop: h1, h2, h3, h4, h5, h6, body, caption, muted
4. Button supports a "variant" prop: primary, secondary, ghost, danger
5. Badge supports a "variant" prop: default, success, warning, danger, primary
6. Return valid JSON only — no markdown, no explanation

Output format:
{
  "schemaVersion": "0.1.0",
  "root": { "type": "Container", "props": {"ariaLabel": "..."}, "children": [...] },
  "meta": { "name": "...", "description": "..." }
}`;

/** Resolve API key and provider from options + environment */
function resolveProvider(options: GenerateUISchemaOptions): {
  provider: "openai" | "anthropic" | "groq";
  apiKey: string;
} {
  // Explicit provider
  if (options.provider) {
    const key =
      options.apiKey ??
      (typeof process !== "undefined"
        ? (options.provider === "anthropic"
            ? process.env.ANTHROPIC_API_KEY
            : options.provider === "groq"
            ? process.env.GROQ_API_KEY
            : process.env.OPENAI_API_KEY)
        : undefined);
    if (!key) throw new Error(`No API key for provider '${options.provider}'`);
    return { provider: options.provider, apiKey: key };
  }

  // Auto-detect from key prefix
  const key = options.apiKey;
  if (key) {
    if (key.startsWith("sk-ant-")) return { provider: "anthropic", apiKey: key };
    if (key.startsWith("gsk_")) return { provider: "groq", apiKey: key };
    return { provider: "openai", apiKey: key };
  }

  // Fall through environment
  if (typeof process !== "undefined") {
    if (process.env.GROQ_API_KEY) return { provider: "groq", apiKey: process.env.GROQ_API_KEY };
    if (process.env.OPENAI_API_KEY) return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
    if (process.env.ANTHROPIC_API_KEY) return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY };
  }

  throw new Error(
    "No API key found. Set apiKey option, or set GROQ_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY env var."
  );
}

/**
 * Generate a UISchemaDocument from a natural language prompt.
 * Supports OpenAI, Anthropic, and Groq providers with auto-detection.
 *
 * @example
 * import { generateUISchema } from '@uischema/react/ai';
 *
 * // Auto-detect from env:
 * const schema = await generateUISchema('A login form');
 *
 * // Explicit Groq:
 * const schema = await generateUISchema('A login form', {
 *   provider: 'groq',
 *   model: 'llama-3.3-70b-versatile',
 * });
 */
export async function generateUISchema(
  prompt: string,
  options: GenerateUISchemaOptions = {}
): Promise<UISchemaDocument> {
  const { provider, apiKey } = resolveProvider(options);
  const systemPrompt = options.systemPrompt ?? SYSTEM_PROMPT;
  const maxTokens = options.maxTokens ?? 2000;

  let responseText: string;

  if (provider === "groq") {
    const model = options.model ?? "llama-3.3-70b-versatile";
    const modelCfg = GROQ_MODELS[model];
    const client = new GroqClient({ apiKey });
    const res = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      maxTokens: Math.min(maxTokens, modelCfg?.recommendedMaxTokens ?? 2000),
    });
    responseText = res.content;
  } else if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model ?? "claude-3-5-haiku-20241022",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(`Anthropic API error: ${err.error?.message ?? res.statusText}`);
    }
    const data = (await res.json()) as { content: Array<{ text: string }> };
    responseText = data.content[0]?.text ?? "";
  } else {
    // OpenAI-compatible
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(`OpenAI API error: ${err.error?.message ?? res.statusText}`);
    }
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    responseText = data.choices[0]?.message?.content ?? "";
  }

  // Parse JSON (handle thinking tags, markdown fences, etc.)
  const jsonText = extractJson(responseText);
  let parsed: UISchemaDocument;
  try {
    parsed = JSON.parse(jsonText) as UISchemaDocument;
  } catch {
    throw new Error(`Failed to parse model response as JSON: ${responseText.slice(0, 300)}`);
  }

  if (!parsed.root) {
    throw new Error("Generated schema is missing required 'root' field");
  }

  return parsed;
}
