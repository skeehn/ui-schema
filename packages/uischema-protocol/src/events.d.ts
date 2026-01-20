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
export declare const createUIUpdate: (node: UISchemaNode, path?: string) => UIUpdateEvent;
/**
 * Create UI interaction event
 */
export declare const createUIInteraction: (componentType: string, eventName: string, params?: Record<string, unknown>, componentId?: string) => UIInteractionEvent;
/**
 * Check if event is UI update
 */
export declare const isUIUpdate: (event: UIEvent) => event is UIUpdateEvent;
/**
 * Check if event is UI interaction
 */
export declare const isUIInteraction: (event: UIEvent) => event is UIInteractionEvent;
/**
 * Serialize event to JSON (for transport)
 */
export declare const serializeEvent: (event: UIEvent) => string;
/**
 * Deserialize event from JSON
 */
export declare const deserializeEvent: (json: string) => UIEvent;
//# sourceMappingURL=events.d.ts.map