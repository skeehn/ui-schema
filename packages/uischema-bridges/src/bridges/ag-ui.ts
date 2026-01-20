import type { UISchemaNode, UISchemaEvent } from "@uischema/core";

/**
 * AG-UI Protocol event structure
 * AG-UI is a User Interaction protocol (not a spec) that supports multiple UI specs
 */
export type AGUIEvent = {
  type: "ui.update" | "ui.interaction" | "ui.state-change" | "ui.error";
  payload: unknown;
  timestamp?: number;
};

/**
 * Convert UISchema event to AG-UI event format
 */
export const toAGUIEvent = (
  eventName: string,
  event: UISchemaEvent,
  node: UISchemaNode
): AGUIEvent => {
  const agEventType =
    event.type === "action" || event.type === "submit"
      ? "ui.interaction"
      : event.type === "navigate"
        ? "ui.state-change"
        : "ui.interaction";

  return {
    type: agEventType,
    payload: {
      componentId: node.id,
      componentType: String(node.type),
      eventName,
      eventType: String(event.type),
      params: event.params ?? {}
    },
    timestamp: Date.now()
  };
};

/**
 * Convert AG-UI event to UISchema event
 */
export const fromAGUIEvent = (agEvent: AGUIEvent): UISchemaEvent | null => {
  if (agEvent.type !== "ui.interaction") {
    return null;
  }

  const payload = agEvent.payload as Record<string, unknown>;

  const eventType = (payload.eventType as string) ?? "action";
  const validTypes: Array<"action" | "navigate" | "submit" | "custom"> = ["action", "navigate", "submit", "custom"];
  const type = validTypes.includes(eventType as any) ? (eventType as "action" | "navigate" | "submit" | "custom") : "action";

  return {
    type,
    name: (payload.eventName as string) ?? "unknown",
    params: (payload.params as Record<string, unknown>) ?? {}
  };
};

/**
 * Create AG-UI compatible update event for UISchema node changes
 */
export const createAGUIUpdate = (node: UISchemaNode): AGUIEvent => {
  return {
    type: "ui.update",
    payload: {
      componentId: node.id,
      componentType: node.type,
      props: node.props,
      children: node.children?.map((child) => ({
        id: child.id,
        type: child.type
      }))
    },
    timestamp: Date.now()
  };
};

/**
 * Map UISchema events object to AG-UI events array
 */
export const mapUISchemaEventsToAGUI = (
  events: Record<string, UISchemaEvent> | undefined,
  node: UISchemaNode
): AGUIEvent[] => {
  if (!events) {
    return [];
  }

  return Object.entries(events).map(([eventName, event]) =>
    toAGUIEvent(eventName, event, node)
  );
};
