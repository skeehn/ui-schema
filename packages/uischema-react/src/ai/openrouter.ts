/**
 * OpenRouter API client for UISchema generation.
 *
 * Features:
 * - Per-model config (noSystemRole for Gemma, thinking-tag stripping for Qwen3)
 * - Rate limit awareness with exponential backoff
 * - Request timeout (free models can stall)
 * - https-proxy-agent support for sandboxed environments
 * - Zero external AI SDK dependency
 */

// ─── Model registry ───────────────────────────────────────────────────────────

export type OpenRouterModelConfig = {
  id: string;
  name: string;
  contextWindow: number;
  /** Some models (Gemma via Google AI Studio) reject the "system" role */
  noSystemRole: boolean;
  /** Strip <think>...</think> blocks from output */
  stripThinking: boolean;
  /** Max tokens for UISchema generation */
  recommendedMaxTokens: number;
  /** Whether this is an embedding-only model (cannot generate text) */
  embeddingOnly: boolean;
  /** Minimum model size considered reliable for UISchema generation */
  reliableForGeneration: boolean;
};

export const OPENROUTER_MODELS: Record<string, OpenRouterModelConfig> = {
  "nousresearch/hermes-3-llama-3.1-405b:free": {
    id: "nousresearch/hermes-3-llama-3.1-405b:free",
    name: "Hermes 3 Llama 405B",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron Super 120B",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "google/gemma-3-27b-it:free": {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    contextWindow: 131072,
    noSystemRole: true, // Google AI Studio backend rejects system role
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "qwen/qwen3-coder:free": {
    id: "qwen/qwen3-coder:free",
    name: "Qwen3 Coder",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: true,
    recommendedMaxTokens: 3000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "qwen/qwen3.6-plus:free": {
    id: "qwen/qwen3.6-plus:free",
    name: "Qwen 3.6 Plus",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: true,
    recommendedMaxTokens: 3000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "nvidia/nemotron-3-nano-30b-a3b:free": {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    name: "Nemotron Nano 30B",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "arcee-ai/trinity-large-preview:free": {
    id: "arcee-ai/trinity-large-preview:free",
    name: "Trinity Large",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: true,
  },
  "stepfun/step-3.5-flash:free": {
    id: "stepfun/step-3.5-flash:free",
    name: "Step 3.5 Flash",
    contextWindow: 65536,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: false, // Returns empty responses intermittently
  },
  "meta-llama/llama-3.2-3b-instruct:free": {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B",
    contextWindow: 131072,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: false, // Too small for complex JSON generation
  },
  "google/gemma-3-4b-it:free": {
    id: "google/gemma-3-4b-it:free",
    name: "Gemma 3 4B",
    contextWindow: 32768,
    noSystemRole: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: false, // Truncates complex JSON
  },
  "liquid/lfm-2.5-1.2b-thinking:free": {
    id: "liquid/lfm-2.5-1.2b-thinking:free",
    name: "LFM 1.2B Thinking",
    contextWindow: 32768,
    noSystemRole: false,
    stripThinking: true,
    recommendedMaxTokens: 3000,
    embeddingOnly: false,
    reliableForGeneration: false, // Too small
  },
  "liquid/lfm-2.5-1.2b-instruct:free": {
    id: "liquid/lfm-2.5-1.2b-instruct:free",
    name: "LFM 1.2B Instruct",
    contextWindow: 32768,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 2000,
    embeddingOnly: false,
    reliableForGeneration: false, // Too small
  },
  "nvidia/llama-nemotron-embed-vl-1b-v2:free": {
    id: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    name: "Nemotron Embed 1B",
    contextWindow: 8192,
    noSystemRole: false,
    stripThinking: false,
    recommendedMaxTokens: 0,
    embeddingOnly: true, // NOT a chat model
    reliableForGeneration: false,
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpenRouterChatOptions = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  /** Override per-model site info */
  siteUrl?: string;
  siteTitle?: string;
};

export type OpenRouterChatResponse = {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
};

export type OpenRouterClientOptions = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  /** Request timeout in ms (default: 90s — free models can be slow) */
  timeoutMs?: number;
  /** Minimum ms between requests (default: 1000) */
  minRequestIntervalMs?: number;
  /** Site URL for OpenRouter attribution */
  siteUrl?: string;
  /** Site title for OpenRouter attribution */
  siteTitle?: string;
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────

type HttpResult = {
  status: number;
  headers: Record<string, string>;
  data: Record<string, unknown>;
};

async function httpsPost(
  hostname: string,
  path: string,
  reqHeaders: Record<string, string>,
  body: unknown,
  timeoutMs: number
): Promise<HttpResult> {
  const { default: https } = await import("https") as { default: typeof import("https") };
  const bodyStr = JSON.stringify(body);

  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agent: any;
  if (proxyUrl) {
    const { HttpsProxyAgent } = await import("https-proxy-agent") as { HttpsProxyAgent: new (url: string) => unknown };
    agent = new HttpsProxyAgent(proxyUrl);
  }

  return new Promise((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        agent,
        headers: {
          ...reqHeaders,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let raw = "";
        const resHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          resHeaders[k] = Array.isArray(v) ? v[0] : (v ?? "");
        }
        res.on("data", (c: string) => { raw += c; });
        res.on("end", () => {
          if (timedOut) return;
          clearTimeout(timer);
          try {
            resolve({ status: res.statusCode ?? 500, headers: resHeaders, data: JSON.parse(raw) });
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 300)}`));
          }
        });
      }
    );
    req.on("error", (err) => {
      if (!timedOut) { clearTimeout(timer); reject(err); }
    });
    req.write(bodyStr);
    req.end();
  });
}

// ─── OpenRouterClient ─────────────────────────────────────────────────────────

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeoutMs: number;
  private minRequestIntervalMs: number;
  private siteUrl: string;
  private siteTitle: string;
  private lastRequestAt = 0;

  constructor(opts: OpenRouterClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? "https://openrouter.ai";
    this.maxRetries = opts.maxRetries ?? 3;
    this.timeoutMs = opts.timeoutMs ?? 90_000;
    this.minRequestIntervalMs = opts.minRequestIntervalMs ?? 1_000;
    this.siteUrl = opts.siteUrl ?? "https://github.com/skeehn/ui-schema";
    this.siteTitle = opts.siteTitle ?? "UISchema";
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minRequestIntervalMs) {
      await this.sleep(this.minRequestIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  private backoffMs(attempt: number): number {
    return Math.min(1_000 * Math.pow(2, attempt), 30_000) + Math.random() * 500;
  }

  /**
   * Resolve the wait time from a 429 response.
   * OpenRouter free tier often returns no headers for provider-level limits,
   * so we default to 65s (covers the most common 1 RPM free tier limit).
   */
  private resolveRateLimitWait(headers: Record<string, string>): number {
    const retryAfter = headers["retry-after"];
    if (retryAfter) {
      const v = parseFloat(retryAfter);
      return isNaN(v) ? 65_000 : v * 1_000;
    }
    // x-ratelimit-reset-requests (e.g. "60s", "1m", "420ms")
    const resetRequests = headers["x-ratelimit-reset-requests"];
    if (resetRequests) return this.parseResetDuration(resetRequests);
    // Default: 65s for 1 RPM free models
    return 65_000;
  }

  private parseResetDuration(value: string): number {
    const v = value.trim().toLowerCase();
    if (v.endsWith("ms")) return parseFloat(v);
    if (v.endsWith("m")) return parseFloat(v) * 60_000;
    if (v.endsWith("s")) return parseFloat(v) * 1_000;
    return parseFloat(v) * 1_000;
  }

  /**
   * Prepare messages, merging system prompt into user content for models
   * that don't support the system role (e.g. Gemma via Google AI Studio).
   */
  private prepareMessages(
    messages: OpenRouterChatOptions["messages"],
    noSystemRole: boolean
  ): OpenRouterChatOptions["messages"] {
    if (!noSystemRole) return messages;
    const sysMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");
    if (!sysMsg || userMsgs.length === 0) return messages;
    return [
      {
        role: "user",
        content: `${sysMsg.content}\n\nTask: ${userMsgs[0].content}\n\nRespond with ONLY raw JSON, no markdown fences, no explanation:`,
      },
      ...userMsgs.slice(1),
    ];
  }

  /**
   * Send a chat completion request to OpenRouter with retry + rate-limit awareness.
   */
  async chat(opts: OpenRouterChatOptions): Promise<OpenRouterChatResponse> {
    const modelCfg = OPENROUTER_MODELS[opts.model];

    if (modelCfg?.embeddingOnly) {
      throw new Error(
        `${opts.model} is an embedding model — it cannot generate chat completions.`
      );
    }

    const messages = this.prepareMessages(
      opts.messages,
      modelCfg?.noSystemRole ?? false
    );

    const requestBody: Record<string, unknown> = {
      model: opts.model,
      messages,
      max_tokens: opts.maxTokens ?? modelCfg?.recommendedMaxTokens ?? 2000,
      temperature: opts.temperature ?? 0.2,
    };

    const urlObj = new URL(`${this.baseUrl}/api/v1/chat/completions`);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.throttle();

      let res: HttpResult;
      try {
        res = await httpsPost(
          urlObj.hostname,
          urlObj.pathname,
          {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": this.siteUrl,
            "X-Title": this.siteTitle,
          },
          requestBody,
          this.timeoutMs
        );
      } catch (networkErr) {
        lastError = networkErr instanceof Error ? networkErr : new Error(String(networkErr));
        if (attempt < this.maxRetries) {
          await this.sleep(this.backoffMs(attempt));
          continue;
        }
        throw lastError;
      }

      // ── Rate limited ──────────────────────────────────────────────────────
      if (res.status === 429) {
        const waitMs = this.resolveRateLimitWait(res.headers);
        const errData = res.data?.error as Record<string, unknown> | undefined;
        lastError = new Error(
          `Rate limited [${opts.model}]: ${errData?.message ?? "too many requests"}. ` +
          `Waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${this.maxRetries + 1})`
        );
        if (attempt < this.maxRetries) {
          await this.sleep(waitMs);
          continue;
        }
        throw lastError;
      }

      // ── Server errors ─────────────────────────────────────────────────────
      if (res.status >= 500) {
        lastError = new Error(`OpenRouter server error ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
        if (attempt < this.maxRetries) {
          await this.sleep(this.backoffMs(attempt));
          continue;
        }
        throw lastError;
      }

      // ── Client errors ─────────────────────────────────────────────────────
      if (res.status >= 400) {
        const errData = res.data?.error as Record<string, unknown> | undefined;
        throw new Error(
          `OpenRouter error ${res.status}: ${errData?.message ?? JSON.stringify(res.data).slice(0, 200)}`
        );
      }

      // ── Success ───────────────────────────────────────────────────────────
      const data = res.data as {
        choices: Array<{ message: { content: string } }>;
        model: string;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      let content = data.choices?.[0]?.message?.content ?? "";

      // Strip thinking tags
      if (modelCfg?.stripThinking) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      }

      return {
        content,
        model: data.model ?? opts.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
      };
    }

    throw lastError ?? new Error("Max retries exceeded");
  }
}

/** Extract the first valid JSON object from a text string */
export function extractJsonFromText(text: string): string {
  let t = text.trim();
  // Strip thinking tags
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (t.startsWith("{")) return t;
  // Markdown fence
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // Embedded JSON object
  const obj = t.match(/(\{[\s\S]*\})/);
  if (obj) return obj[1];
  return t;
}
