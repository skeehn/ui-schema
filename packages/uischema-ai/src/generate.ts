import { validateBasicA11y, type A11yIssue, type UISchemaDocument } from "@uischema/core";
import { buildRepairPrompt, buildUserPrompt, UISCHEMA_SYSTEM_PROMPT } from "./prompt";
import { parseUISchemaResponse, UISchemaParseError } from "./parse";

/**
 * Bring-your-own-model call: receives the system + user messages, returns the
 * model's text output. Implement this with any SDK or backend — the Anthropic
 * SDK, the Vercel AI SDK, LangChain, a proxy of your own, anything.
 */
export type GenerateTextFn = (messages: {
  system: string;
  prompt: string;
}) => Promise<string>;

export type GenerateUISchemaOptions = {
  /** Bring your own model call. Takes precedence over the HTTP options below. */
  generateText?: GenerateTextFn;

  /**
   * Base URL of any OpenAI-compatible API, e.g.
   * https://api.openai.com/v1, https://api.groq.com/openai/v1,
   * http://localhost:11434/v1 (Ollama), or your own gateway.
   */
  baseURL?: string;
  /** API key for the OpenAI-compatible endpoint, sent as a Bearer token. */
  apiKey?: string;
  /** Model id, e.g. "gpt-4o-mini" or "llama-3.1-8b-instant". */
  model?: string;
  /** Sampling temperature (default 0.2 — UI generation favours consistency). */
  temperature?: number;
  /** Set false for endpoints that reject response_format json_object. */
  jsonMode?: boolean;
  /** Custom fetch (for tests, proxies, or non-standard runtimes). */
  fetch?: typeof globalThis.fetch;
  /** Extra headers for the OpenAI-compatible endpoint. */
  headers?: Record<string, string>;

  /**
   * When a response fails parsing/validation, send the errors back to the
   * model and retry. `true` = 1 attempt (default), `false` = fail fast, or a
   * number of attempts (useful for weaker models without JSON mode).
   */
  repair?: boolean | number;
};

export type GenerateUISchemaResult = {
  /** The validated UISchema document, ready to render. */
  document: UISchemaDocument;
  /** Non-blocking accessibility findings on the generated tree. */
  a11yIssues: A11yIssue[];
  /** The raw model output the document was parsed from. */
  raw: string;
};

const callOpenAICompatible = (options: GenerateUISchemaOptions): GenerateTextFn => {
  const { baseURL, apiKey, model } = options;
  if (!baseURL || !model) {
    throw new Error(
      "generateUISchema requires either options.generateText or options.baseURL + options.model."
    );
  }
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("No fetch implementation available; pass options.fetch.");
  }

  return async ({ system, prompt }) => {
    const response = await fetchImpl(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(options.headers ?? {})
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.2,
        ...(options.jsonMode === false ? {} : { response_format: { type: "json_object" } }),
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `AI endpoint returned ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 500)}` : ""}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("AI endpoint response did not contain choices[0].message.content.");
    }
    return content;
  };
};

/**
 * Generates a validated UISchema document from a natural-language prompt.
 *
 * Works with any backend:
 * - `generateText`: plug in any SDK (Anthropic, Vercel AI SDK, LangChain, …)
 * - `baseURL`/`apiKey`/`model`: call any OpenAI-compatible API directly
 *   (OpenAI, Groq, Together, OpenRouter, Ollama, vLLM, custom gateways)
 *
 * On invalid output the validation errors are sent back to the model for one
 * repair attempt (disable with `repair: false`).
 */
export const generateUISchema = async (
  prompt: string,
  options: GenerateUISchemaOptions
): Promise<GenerateUISchemaResult> => {
  const generate = options.generateText ?? callOpenAICompatible(options);
  const repairAttempts =
    options.repair === false ? 0 : options.repair === true || options.repair === undefined ? 1 : options.repair;

  let raw = await generate({
    system: UISCHEMA_SYSTEM_PROMPT,
    prompt: buildUserPrompt(prompt)
  });

  let document: UISchemaDocument | undefined;
  for (let attempt = 0; ; attempt += 1) {
    try {
      document = parseUISchemaResponse(raw);
      break;
    } catch (error) {
      if (attempt >= repairAttempts || !(error instanceof UISchemaParseError)) {
        throw error;
      }
      raw = await generate({
        system: UISCHEMA_SYSTEM_PROMPT,
        prompt: buildRepairPrompt(error.raw, error.validationErrors ?? error.message)
      });
    }
  }

  return {
    document,
    a11yIssues: validateBasicA11y(document.root),
    raw
  };
};
