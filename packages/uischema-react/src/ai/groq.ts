/**
 * Groq API client for UISchema generation.
 *
 * Features:
 * - Rate limit awareness (parses x-ratelimit-* headers)
 * - Exponential backoff retry on 429 / 5xx
 * - Per-model config (JSON mode support, token limits, thinking-tag stripping)
 * - Queue guard to stay below TPM limit
 */

import type { UISchemaDocument } from "@uischema/core";

// ─── Model registry ───────────────────────────────────────────────────────────

export type GroqModelConfig = {
  id: string;
  name: string;
  contextWindow: number;
  maxCompletionTokens: number;
  /** Does this model support response_format: {type:'json_object'}? */
  supportsJsonMode: boolean;
  /** Strip <think>...</think> blocks from output (Qwen3, DeepSeek-R1) */
  stripThinking: boolean;
  /** Recommended max_tokens for UISchema generation */
  recommendedMaxTokens: number;
};

export const GROQ_MODELS: Record<string, GroqModelConfig> = {
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    contextWindow: 131072,
    maxCompletionTokens: 131072,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
  },
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
  },
  "moonshotai/kimi-k2-instruct": {
    id: "moonshotai/kimi-k2-instruct",
    name: "Kimi K2 Instruct",
    contextWindow: 131072,
    maxCompletionTokens: 16384,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
  },
  "groq/compound-mini": {
    id: "groq/compound-mini",
    name: "Groq Compound Mini",
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
  },
  "groq/compound": {
    id: "groq/compound",
    name: "Groq Compound",
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 2000,
  },
  "qwen/qwen3-32b": {
    id: "qwen/qwen3-32b",
    name: "Qwen3 32B",
    contextWindow: 131072,
    maxCompletionTokens: 40960,
    supportsJsonMode: false,
    stripThinking: true,
    recommendedMaxTokens: 3000, // Extra room for thinking tokens
  },
  "allam-2-7b": {
    id: "allam-2-7b",
    name: "Allam 2 7B",
    contextWindow: 4096,
    maxCompletionTokens: 4096,
    supportsJsonMode: true,
    stripThinking: false,
    recommendedMaxTokens: 1500, // Smaller context — Arabic-focused model, may require org-level access
  },
};

// ─── Rate limit state ─────────────────────────────────────────────────────────

export type RateLimitState = {
  limitRequests: number;
  limitTokens: number;
  remainingRequests: number;
  remainingTokens: number;
  resetRequestsMs: number;
  resetTokensMs: number;
  lastUpdated: number;
};

/** Parse Groq reset duration strings: "6s", "420ms", "1.5s" → milliseconds */
function parseResetDuration(value: string | undefined): number {
  if (!value) return 0;
  const v = value.trim().toLowerCase();
  if (v.endsWith("ms")) return parseFloat(v);
  if (v.endsWith("s")) return parseFloat(v) * 1000;
  return parseFloat(v) * 1000;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

type HttpResponse = {
  status: number;
  headers: Record<string, string>;
  data: unknown;
};

async function httpPost(url: string, headers: Record<string, string>, body: unknown): Promise<HttpResponse> {
  const { default: https } = await import("https") as { default: typeof import("https") };
  const urlObj = new URL(url);
  const bodyStr = JSON.stringify(body);

  // Route through proxy if configured (required in sandboxed environments)
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agent: any;
  if (proxyUrl) {
    const { HttpsProxyAgent } = await import("https-proxy-agent") as { HttpsProxyAgent: new (url: string) => unknown };
    agent = new HttpsProxyAgent(proxyUrl);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        agent,
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(bodyStr),
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk: string) => { raw += chunk; });
        res.on("end", () => {
          // Collect headers
          const resHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") resHeaders[k] = v;
            else if (Array.isArray(v)) resHeaders[k] = v[0];
          }
          try {
            resolve({ status: res.statusCode ?? 500, headers: resHeaders, data: JSON.parse(raw) });
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 300)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ─── GroqClient ───────────────────────────────────────────────────────────────

export type GroqClientOptions = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  /** Minimum ms to wait between requests to avoid bursting token limits */
  minRequestIntervalMs?: number;
};

export type GroqChatOptions = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
};

export type GroqChatResponse = {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  rateLimitState: RateLimitState;
};

export class GroqClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private minRequestIntervalMs: number;
  private lastRequestAt = 0;
  public rateLimitState: RateLimitState = {
    limitRequests: 0,
    limitTokens: 0,
    remainingRequests: 999,
    remainingTokens: 999,
    resetRequestsMs: 0,
    resetTokensMs: 0,
    lastUpdated: 0,
  };

  constructor(opts: GroqClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? "https://api.groq.com";
    this.maxRetries = opts.maxRetries ?? 3;
    this.minRequestIntervalMs = opts.minRequestIntervalMs ?? 300;
  }

  /** Parse rate limit headers from a response */
  private updateRateLimitState(headers: Record<string, string>): void {
    this.rateLimitState = {
      limitRequests: parseInt(headers["x-ratelimit-limit-requests"] ?? "0") || 0,
      limitTokens: parseInt(headers["x-ratelimit-limit-tokens"] ?? "0") || 0,
      remainingRequests: parseInt(headers["x-ratelimit-remaining-requests"] ?? "999") || 999,
      remainingTokens: parseInt(headers["x-ratelimit-remaining-tokens"] ?? "999") || 999,
      resetRequestsMs: parseResetDuration(headers["x-ratelimit-reset-requests"]),
      resetTokensMs: parseResetDuration(headers["x-ratelimit-reset-tokens"]),
      lastUpdated: Date.now(),
    };
  }

  /** Sleep for ms milliseconds */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Throttle: ensure minimum gap between requests */
  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minRequestIntervalMs) {
      await this.sleep(this.minRequestIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  /** Calculate backoff delay for a given attempt (exponential + jitter) */
  private backoffMs(attempt: number): number {
    const base = Math.min(1000 * Math.pow(2, attempt), 32000);
    const jitter = Math.random() * 500;
    return base + jitter;
  }

  /**
   * Send a chat completion request to Groq with retry + rate-limit awareness.
   */
  async chat(opts: GroqChatOptions): Promise<GroqChatResponse> {
    const modelCfg = GROQ_MODELS[opts.model];
    const useJsonMode = opts.jsonMode ?? modelCfg?.supportsJsonMode ?? true;

    const requestBody: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      max_tokens: Math.min(opts.maxTokens ?? 2000, modelCfg?.maxCompletionTokens ?? 2000),
      temperature: opts.temperature ?? 0.2,
    };

    if (useJsonMode) {
      requestBody.response_format = { type: "json_object" };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.throttle();

      let res: HttpResponse;
      try {
        res = await httpPost(
          `${this.baseUrl}/openai/v1/chat/completions`,
          { Authorization: `Bearer ${this.apiKey}` },
          requestBody
        );
      } catch (networkErr) {
        lastError = networkErr instanceof Error ? networkErr : new Error(String(networkErr));
        if (attempt < this.maxRetries) {
          await this.sleep(this.backoffMs(attempt));
          continue;
        }
        throw lastError;
      }

      // Always update rate limit state from headers
      this.updateRateLimitState(res.headers);

      // ── Rate limited ──────────────────────────────────────────────────────
      if (res.status === 429) {
        const data = res.data as Record<string, unknown>;
        const retryAfterHeader = res.headers["retry-after"];
        const resetRequests = this.rateLimitState.resetRequestsMs;
        const resetTokens = this.rateLimitState.resetTokensMs;

        let waitMs: number;
        if (retryAfterHeader) {
          waitMs = parseFloat(retryAfterHeader) * 1000;
        } else {
          // Wait for whichever limit is the bottleneck
          waitMs = Math.max(resetRequests, resetTokens, 1000);
        }

        const errMsg = (data?.error as Record<string, unknown>)?.message ?? `Rate limited`;
        lastError = new Error(`Rate limited (${errMsg}). Waiting ${Math.round(waitMs)}ms before retry.`);

        if (attempt < this.maxRetries) {
          await this.sleep(waitMs);
          continue;
        }
        throw lastError;
      }

      // ── Server errors — retry ─────────────────────────────────────────────
      if (res.status >= 500) {
        const data = res.data as Record<string, unknown>;
        lastError = new Error(`Groq server error ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
        if (attempt < this.maxRetries) {
          await this.sleep(this.backoffMs(attempt));
          continue;
        }
        throw lastError;
      }

      // ── Client errors — don't retry ───────────────────────────────────────
      if (res.status >= 400) {
        const data = res.data as Record<string, unknown>;
        const errObj = data?.error as Record<string, unknown> | undefined;
        throw new Error(
          `Groq error ${res.status} [${errObj?.type ?? "unknown"}]: ${errObj?.message ?? JSON.stringify(data).slice(0, 200)}`
        );
      }

      // ── Success ───────────────────────────────────────────────────────────
      const data = res.data as {
        choices: Array<{ message: { content: string } }>;
        model: string;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      let content = data.choices?.[0]?.message?.content ?? "";

      // Strip <think>...</think> blocks (Qwen3, DeepSeek-R1, etc.)
      if (modelCfg?.stripThinking) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      }

      return {
        content,
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        rateLimitState: { ...this.rateLimitState },
      };
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  /** Convenience: check available models from the API */
  async listModels(): Promise<string[]> {
    const { default: https } = await import("https") as { default: typeof import("https") };
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let agent: any;
    if (proxyUrl) {
      const { HttpsProxyAgent } = await import("https-proxy-agent") as { HttpsProxyAgent: new (url: string) => unknown };
      agent = new HttpsProxyAgent(proxyUrl);
    }
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.groq.com",
          path: "/openai/v1/models",
          method: "GET",
          agent,
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
        (res) => {
          let raw = "";
          res.on("data", (c: string) => { raw += c; });
          res.on("end", () => {
            try {
              const data = JSON.parse(raw) as { data: Array<{ id: string; active: boolean }> };
              resolve(data.data.filter((m) => m.active).map((m) => m.id));
            } catch {
              reject(new Error(`Failed to parse models response: ${raw.slice(0, 200)}`));
            }
          });
        }
      );
      req.on("error", reject);
      req.end();
    });
  }
}

/** Extract the first valid JSON object from a text string */
export function extractJson(text: string): string {
  // Already clean JSON
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  // Markdown fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Inline JSON object
  const objMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (objMatch) return objMatch[1];

  return trimmed;
}
