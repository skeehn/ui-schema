import type { UISchemaDocument } from "@uischema/core";

export type GenerateUISchemaOptions = {
  /** OpenAI or Anthropic API key */
  apiKey?: string;
  /** Model to use (e.g. 'gpt-4o-mini', 'claude-3-5-haiku-20241022') */
  model?: string;
  /** Provider. Defaults to 'openai' if OPENAI_API_KEY detected, else 'anthropic' */
  provider?: "openai" | "anthropic";
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
3. root is the top-level UISchemaNode
4. children is an array of UISchemaNode
5. events map event names to { type, name, params? }
6. Text components support a "level" prop: h1, h2, h3, h4, h5, h6, body, caption, muted
7. Button supports a "variant" prop: primary, secondary, ghost, danger
8. Badge supports a "variant" prop: default, success, warning, danger, primary
9. Return valid JSON only — no markdown, no explanation

Output format:
{
  "schemaVersion": "0.1.0",
  "root": { "type": "Container", "props": {"ariaLabel": "..."}, "children": [...] },
  "meta": { "name": "...", "description": "..." }
}`;

/**
 * Generate a UISchemaDocument from a natural language prompt.
 *
 * @example
 * import { generateUISchema } from '@uischema/react/ai';
 *
 * const schema = await generateUISchema('A login form with email and password', {
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'gpt-4o-mini',
 * });
 */
export async function generateUISchema(
  prompt: string,
  options: GenerateUISchemaOptions = {}
): Promise<UISchemaDocument> {
  const {
    apiKey,
    model,
    provider,
    systemPrompt = SYSTEM_PROMPT,
    maxTokens = 2000,
  } = options;

  // Auto-detect provider
  const resolvedProvider = provider ?? (apiKey?.startsWith("sk-ant-") ? "anthropic" : "openai");
  const resolvedApiKey = apiKey ?? (
    resolvedProvider === "anthropic"
      ? (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined)
      : (typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined)
  );

  if (!resolvedApiKey) {
    throw new Error(
      `No API key provided. Set apiKey option or ${
        resolvedProvider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"
      } environment variable.`
    );
  }

  let responseText: string;

  if (resolvedProvider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": resolvedApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model ?? "claude-3-5-haiku-20241022",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(`Anthropic API error: ${err.error?.message ?? res.statusText}`);
    }

    const data = await res.json() as { content: Array<{ text: string }> };
    responseText = data.content[0]?.text ?? "";
  } else {
    // OpenAI-compatible
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolvedApiKey}`,
      },
      body: JSON.stringify({
        model: model ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(`OpenAI API error: ${err.error?.message ?? res.statusText}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    responseText = data.choices[0]?.message?.content ?? "";
  }

  // Extract JSON (handle possible markdown fences from Anthropic)
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ??
    responseText.match(/(\{[\s\S]*\})/);
  const jsonText = jsonMatch ? jsonMatch[1] : responseText;

  let parsed: UISchemaDocument;
  try {
    parsed = JSON.parse(jsonText.trim()) as UISchemaDocument;
  } catch {
    throw new Error(`Failed to parse model response as JSON: ${responseText.slice(0, 200)}`);
  }

  if (!parsed.root) {
    throw new Error("Generated schema is missing required 'root' field");
  }

  return parsed;
}
