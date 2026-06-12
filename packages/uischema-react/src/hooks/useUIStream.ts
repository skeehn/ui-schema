import { useState, useEffect, useCallback, useRef } from "react";
import type { UISchemaNode } from "@uischema/core";
import type { PatchOperation } from "@uischema/protocol";
import { applyPatches as applyPatchesToNode, parseJSONLPatches } from "@uischema/protocol";

export type UIStreamOptions = {
  endpoint?: string;
  initialSchema?: UISchemaNode;
  onEvent?: (name: string, params?: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  abortSignal?: AbortSignal;
};

export type UIStreamState = {
  schema: UISchemaNode | null;
  loading: boolean;
  error: Error | null;
  patches: PatchOperation[];
};

/**
 * Hook for streaming UI updates via JSONL patch operations
 * Manages UI tree state, handles loading/error states, supports abort
 */
export const useUIStream = (options: UIStreamOptions = {}) => {
  const { endpoint, initialSchema, onEvent, onError, abortSignal } = options;

  const [state, setState] = useState<UIStreamState>({
    schema: initialSchema ?? null,
    loading: false,
    error: null,
    patches: []
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep callbacks in refs so unstable (inline) callback identities don't
  // invalidate streamFromEndpoint and re-trigger the auto-stream effect.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Apply patches to current schema
  const applyPatchesToSchema = useCallback((patches: PatchOperation[]) => {
    setState((prev) => {
      if (!prev.schema) {
        return prev;
      }
      try {
        const updated = applyPatchesToNode(prev.schema, patches);
        return {
          ...prev,
          schema: updated,
          patches: [...prev.patches, ...patches]
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onErrorRef.current?.(err);
        return {
          ...prev,
          error: err
        };
      }
    });
  }, []);

  // Stream from endpoint
  const streamFromEndpoint = useCallback(async () => {
    if (!endpoint) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Abort any in-flight request before starting a new one
    abortControllerRef.current?.abort();

    // Always use an internal controller so repeated stream() calls cancel the
    // prior request; an external abortSignal is forwarded to it.
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const onExternalAbort = () => controller.abort();
    if (abortSignal) {
      if (abortSignal.aborted) {
        controller.abort();
      } else {
        abortSignal.addEventListener("abort", onExternalAbort);
      }
    }

    try {
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          Accept: "application/x-ndjson, application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const patches = parseJSONLPatches(line);
            applyPatchesToSchema(patches);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onErrorRef.current?.(err);
            setState((prev) => ({ ...prev, error: err }));
          }
        }
      }

      // Process remaining buffer — incomplete JSON at end-of-stream is expected and ignored
      if (buffer.trim()) {
        try {
          const patches = parseJSONLPatches(buffer);
          applyPatchesToSchema(patches);
        } catch (error) {
          const isLikelyTruncated =
            error instanceof SyntaxError ||
            (error instanceof Error && error.message.toLowerCase().includes("json"));
          if (!isLikelyTruncated) {
            const err = error instanceof Error ? error : new Error(String(error));
            onErrorRef.current?.(err);
          }
        }
      }

      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Abort is expected, don't treat as error
        return;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      onErrorRef.current?.(err);
      setState((prev) => ({ ...prev, loading: false, error: err }));
    } finally {
      abortSignal?.removeEventListener("abort", onExternalAbort);
    }
  }, [endpoint, abortSignal, applyPatchesToSchema]);

  // Apply patches manually
  const applyPatches = useCallback((patches: PatchOperation[]) => {
    applyPatchesToSchema(patches);
  }, [applyPatchesToSchema]);

  // Reset to initial schema
  const reset = useCallback(() => {
    setState({
      schema: initialSchema ?? null,
      loading: false,
      error: null,
      patches: []
    });
  }, [initialSchema]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Auto-stream if endpoint provided
  useEffect(() => {
    if (endpoint) {
      streamFromEndpoint();
    }
  }, [endpoint, streamFromEndpoint]);

  return {
    schema: state.schema,
    loading: state.loading,
    error: state.error,
    patches: state.patches,
    applyPatches,
    reset,
    stream: streamFromEndpoint
  };
};
