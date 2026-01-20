import type { UISchemaNode } from "@uischema/core";

/**
 * Minimal event protocol for agent ↔ UI communication
 * Compatible with AG-UI's event model and MCP Apps message format
 */

/**
 * Agent → UI: UI update event
 */
export type UIUpdateEvent = {
  type: "ui.update";
  payload: {
    node: UISchemaNode;
    path?: string;
  };
  timestamp?: number;
};

/**
 * UI → Agent: UI interaction event
 */
export type UIInteractionEvent = {
  type: "ui.interaction";
  payload: {
    componentId?: string;
    componentType: string;
    eventName: string;
    params?: Record<string, unknown>;
  };
  timestamp?: number;
};

export type UIEvent = UIUpdateEvent | UIInteractionEvent;

/**
 * Create UI update event
 */
export const createUIUpdate = (node: UISchemaNode, path?: string): UIUpdateEvent => {
  return {
    type: "ui.update",
    payload: {
      node,
      path
    },
    timestamp: Date.now()
  };
};

/**
 * Create UI interaction event
 */
export const createUIInteraction = (
  componentType: string,
  eventName: string,
  params?: Record<string, unknown>,
  componentId?: string
): UIInteractionEvent => {
  return {
    type: "ui.interaction",
    payload: {
      componentId,
      componentType,
      eventName,
      params
    },
    timestamp: Date.now()
  };
};

/**
 * Check if event is UI update
 */
export const isUIUpdate = (event: UIEvent): event is UIUpdateEvent => {
  return event.type === "ui.update";
};

/**
 * Check if event is UI interaction
 */
export const isUIInteraction = (event: UIEvent): event is UIInteractionEvent => {
  return event.type === "ui.interaction";
};

/**
 * Serialize event to JSON (for transport)
 */
export const serializeEvent = (event: UIEvent): string => {
  return JSON.stringify(event);
};

/**
 * Deserialize event from JSON
 */
export const deserializeEvent = (json: string): UIEvent => {
  const parsed = JSON.parse(json);
  if (parsed.type === "ui.update" || parsed.type === "ui.interaction") {
    return parsed as UIEvent;
  }
  throw new Error(`Invalid event type: ${parsed.type}`);
};
