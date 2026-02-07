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

/**
 * UI → Agent: UI evaluation event (accessibility reports, audits)
 */
export type UIEvaluationEvent = {
  type: "ui.evaluation";
  payload: {
    report: {
      score: number;
      issues: Array<{
        criterion: string;
        level: string;
        status: string;
        message: string;
        path?: string;
      }>;
    };
  };
  timestamp?: number;
};

export type UIEvent = UIUpdateEvent | UIInteractionEvent | UIEvaluationEvent;

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
 * Create UI evaluation event
 */
export const createUIEvaluation = (report: UIEvaluationEvent["payload"]["report"]): UIEvaluationEvent => {
  return {
    type: "ui.evaluation",
    payload: {
      report
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
 * Check if event is UI evaluation
 */
export const isUIEvaluation = (event: UIEvent): event is UIEvaluationEvent => {
  return event.type === "ui.evaluation";
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
  if (
    parsed.type === "ui.update" ||
    parsed.type === "ui.interaction" ||
    parsed.type === "ui.evaluation"
  ) {
    return parsed as UIEvent;
  }
  throw new Error(`Invalid event type: ${parsed.type}`);
};
