import React from "react";
import { UISchemaRenderer as BaseUISchemaRenderer, type UISchemaRendererProps } from "../renderer/react";
import { useUIStream } from "../hooks/useUIStream";
import type { UISchemaDocument, UISchemaNode } from "@uischema/core";

/**
 * DX-First API: Simple drop-in component (re-exported for convenience)
 * Hides schema/protocol complexity until needed
 */
export const UISchemaRenderer = BaseUISchemaRenderer;

/**
 * DX-First API: Simple generation hook
 * For now, returns a placeholder - in production would call LLM
 */
export const generateUISchema = async (
  prompt: string
): Promise<UISchemaDocument> => {
  // Placeholder implementation
  // In production, this would call an LLM with structured output
  return {
    schemaVersion: "0.1.0",
    root: {
      type: "Container",
      props: {
        ariaLabel: "Generated UI",
        text: `Generated from: ${prompt}`
      },
      children: [
        {
          type: "Text",
          props: {
            text: prompt,
            ariaLabel: "Generated text"
          }
        }
      ]
    }
  };
};

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
