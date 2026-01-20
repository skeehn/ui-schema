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
        onError?.(err);
        return {
          ...prev,
          error: err
        };
      }
    });
  }, [onError]);

  // Stream from endpoint
  const streamFromEndpoint = useCallback(async () => {
    if (!endpoint) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Create abort controller if not provided
    const controller = abortSignal
      ? undefined
      : new AbortController();
    if (controller) {
      abortControllerRef.current = controller;
    }

    try {
      const response = await fetch(endpoint, {
        signal: abortSignal ?? controller?.signal,
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
            onError?.(err);
            setState((prev) => ({ ...prev, error: err }));
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const patches = parseJSONLPatches(buffer);
          applyPatchesToSchema(patches);
        } catch (error) {
          // Ignore incomplete JSON at end
        }
      }

      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Abort is expected, don't treat as error
        return;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      setState((prev) => ({ ...prev, loading: false, error: err }));
    }
  }, [endpoint, abortSignal, applyPatchesToSchema, onError]);

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
