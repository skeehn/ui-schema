import type { UIEvent, UIUpdateEvent, UIInteractionEvent, UIEvaluationEvent } from "./events";

export type UIEventType = UIEvent["type"];

type HandlerMap = {
  "ui.update": Array<(event: UIUpdateEvent) => void>;
  "ui.interaction": Array<(event: UIInteractionEvent) => void>;
  "ui.evaluation": Array<(event: UIEvaluationEvent) => void>;
};

/**
 * Typed pub/sub event bus for agent ↔ UI communication.
 *
 * AI agents publish `ui.update` events; the UI renders them.
 * The UI publishes `ui.interaction` events; agents react to them.
 *
 * @example
 * ```ts
 * import { createEventBus } from '@uischema/protocol';
 *
 * const bus = createEventBus();
 *
 * // AI agent publishes UI updates
 * bus.emit({ type: 'ui.update', payload: { node: generatedNode } });
 *
 * // App subscribes to interactions
 * const unsub = bus.on('ui.interaction', ({ payload }) => {
 *   console.log('User clicked:', payload.eventName);
 * });
 *
 * // Clean up
 * unsub();
 * ```
 */
export class UISchemaEventBus {
  private handlers: HandlerMap = {
    "ui.update": [],
    "ui.interaction": [],
    "ui.evaluation": [],
  };

  /**
   * Subscribe to events of a specific type.
   * Returns an unsubscribe function.
   */
  on(eventType: UIEventType, handler: (event: UIEvent) => void): () => void {
    (this.handlers[eventType] as Array<(event: UIEvent) => void>).push(handler);
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe a specific handler.
   */
  off(eventType: UIEventType, handler: (event: UIEvent) => void): void {
    const list = this.handlers[eventType] as Array<(event: UIEvent) => void>;
    const idx = list.indexOf(handler);
    if (idx !== -1) list.splice(idx, 1);
  }

  /**
   * Emit an event to all subscribers.
   */
  emit(event: UIEvent): void {
    const list = this.handlers[event.type] as Array<(event: UIEvent) => void>;
    const stamped = event.timestamp ? event : { ...event, timestamp: Date.now() };
    for (const handler of list) {
      try {
        handler(stamped as UIEvent);
      } catch (err) {
        console.error(`[UISchemaEventBus] Handler error for ${event.type}:`, err);
      }
    }
  }

  /**
   * Remove all subscribers for a given event type (or all if omitted).
   */
  clear(eventType?: UIEventType): void {
    if (eventType) {
      this.handlers[eventType] = [];
    } else {
      this.handlers = { "ui.update": [], "ui.interaction": [], "ui.evaluation": [] };
    }
  }

  /**
   * Number of active subscribers for a given event type.
   */
  listenerCount(eventType: UIEventType): number {
    return this.handlers[eventType].length;
  }
}

/**
 * Create a new isolated UISchemaEventBus instance.
 *
 * @example
 * const bus = createEventBus();
 * bus.on('ui.update', handler);
 * bus.emit({ type: 'ui.update', payload: { node } });
 */
export const createEventBus = (): UISchemaEventBus => new UISchemaEventBus();

/**
 * Shared global bus (singleton) — use for simple apps.
 * For multi-tenant or isolated scenarios, use createEventBus() instead.
 */
export const globalBus = createEventBus();
