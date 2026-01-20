"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeEvent = exports.serializeEvent = exports.isUIInteraction = exports.isUIUpdate = exports.createUIInteraction = exports.createUIUpdate = void 0;
/**
 * Create UI update event
 */
const createUIUpdate = (node, path) => {
    return {
        type: "ui.update",
        payload: {
            node,
            path
        },
        timestamp: Date.now()
    };
};
exports.createUIUpdate = createUIUpdate;
/**
 * Create UI interaction event
 */
const createUIInteraction = (componentType, eventName, params, componentId) => {
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
exports.createUIInteraction = createUIInteraction;
/**
 * Check if event is UI update
 */
const isUIUpdate = (event) => {
    return event.type === "ui.update";
};
exports.isUIUpdate = isUIUpdate;
/**
 * Check if event is UI interaction
 */
const isUIInteraction = (event) => {
    return event.type === "ui.interaction";
};
exports.isUIInteraction = isUIInteraction;
/**
 * Serialize event to JSON (for transport)
 */
const serializeEvent = (event) => {
    return JSON.stringify(event);
};
exports.serializeEvent = serializeEvent;
/**
 * Deserialize event from JSON
 */
const deserializeEvent = (json) => {
    const parsed = JSON.parse(json);
    if (parsed.type === "ui.update" || parsed.type === "ui.interaction") {
        return parsed;
    }
    throw new Error(`Invalid event type: ${parsed.type}`);
};
exports.deserializeEvent = deserializeEvent;
//# sourceMappingURL=events.js.map