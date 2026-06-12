import React from "react";
import { UISchemaRenderer as BaseUISchemaRenderer, type UISchemaRendererProps } from "../renderer/react";
import { useUIStream } from "../hooks/useUIStream";
import type { UISchemaNode } from "@uischema/core";

/**
 * DX-First API: Simple drop-in component (re-exported for convenience)
 * Hides schema/protocol complexity until needed
 */
export const UISchemaRenderer = BaseUISchemaRenderer;

/**
 * DX-First API: AI generation, re-exported from @uischema/ai.
 * Works with any OpenAI-compatible endpoint (baseURL/apiKey/model) or any
 * LLM SDK via the generateText option. See @uischema/ai for details.
 */
export {
  generateUISchema,
  type GenerateTextFn,
  type GenerateUISchemaOptions,
  type GenerateUISchemaResult
} from "@uischema/ai";

/**
 * DX-First API: Streaming UI component with useUIStream
 */
export type StreamingUISchemaRendererProps = {
  endpoint?: string;
  initialSchema?: UISchemaNode;
  onEvent?: (name: string, params?: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  abortSignal?: AbortSignal;
};

export const StreamingUISchemaRenderer = ({
  endpoint,
  initialSchema,
  onEvent,
  onError,
  abortSignal
}: StreamingUISchemaRendererProps) => {
  const { schema, loading, error } = useUIStream({
    endpoint,
    initialSchema,
    onEvent,
    onError,
    abortSignal
  });

  if (loading && !schema) {
    return React.createElement("div", { "aria-live": "polite" }, "Loading...");
  }

  if (error) {
    return React.createElement(
      "div",
      { "aria-live": "assertive", role: "alert" },
      `Error: ${error.message}`
    );
  }

  if (!schema) {
    return null;
  }

  return React.createElement(BaseUISchemaRenderer, {
    schema,
    onEvent
  });
};
