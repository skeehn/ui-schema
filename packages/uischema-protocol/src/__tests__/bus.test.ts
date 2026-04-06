import { describe, it, expect, vi } from "vitest";
import { UISchemaEventBus, createEventBus } from "../bus";
import type { UIUpdateEvent, UIInteractionEvent } from "../events";

const makeUpdateEvent = (): UIUpdateEvent => ({
  type: "ui.update",
  payload: { node: { type: "Container" } },
  timestamp: Date.now(),
});

const makeInteractionEvent = (): UIInteractionEvent => ({
  type: "ui.interaction",
  payload: { componentType: "Button", eventName: "onClick" },
});

describe("UISchemaEventBus", () => {
  it("creates a bus instance", () => {
    const bus = createEventBus();
    expect(bus).toBeInstanceOf(UISchemaEventBus);
  });

  it("subscribes and receives events", () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on("ui.update", handler);
    bus.emit(makeUpdateEvent());
    expect(handler).toHaveBeenCalledOnce();
  });

  it("passes the event to the handler", () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on("ui.update", handler);
    const event = makeUpdateEvent();
    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "ui.update" }));
  });

  it("unsubscribes via returned function", () => {
    const bus = createEventBus();
    const handler = vi.fn();
    const unsub = bus.on("ui.update", handler);
    unsub();
    bus.emit(makeUpdateEvent());
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire handler for different event type", () => {
    const bus = createEventBus();
    const updateHandler = vi.fn();
    const interactionHandler = vi.fn();
    bus.on("ui.update", updateHandler);
    bus.on("ui.interaction", interactionHandler);
    bus.emit(makeUpdateEvent());
    expect(updateHandler).toHaveBeenCalledOnce();
    expect(interactionHandler).not.toHaveBeenCalled();
  });

  it("supports multiple handlers for the same event", () => {
    const bus = createEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on("ui.update", h1);
    bus.on("ui.update", h2);
    bus.emit(makeUpdateEvent());
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("clears handlers for a specific event", () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on("ui.update", handler);
    bus.clear("ui.update");
    bus.emit(makeUpdateEvent());
    expect(handler).not.toHaveBeenCalled();
  });

  it("clears all handlers when called without event type", () => {
    const bus = createEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on("ui.update", h1);
    bus.on("ui.interaction", h2);
    bus.clear();
    bus.emit(makeUpdateEvent());
    bus.emit(makeInteractionEvent());
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("reports listener count correctly", () => {
    const bus = createEventBus();
    expect(bus.listenerCount("ui.update")).toBe(0);
    const unsub = bus.on("ui.update", vi.fn());
    expect(bus.listenerCount("ui.update")).toBe(1);
    unsub();
    expect(bus.listenerCount("ui.update")).toBe(0);
  });

  it("adds timestamp if missing from emitted event", () => {
    const bus = createEventBus();
    let received: UIUpdateEvent | undefined;
    bus.on("ui.update", (e) => { received = e as UIUpdateEvent; });
    const event: UIUpdateEvent = { type: "ui.update", payload: { node: { type: "Text" } } };
    bus.emit(event);
    expect(received?.timestamp).toBeTypeOf("number");
  });

  it("does not throw if a handler throws — other handlers still run", () => {
    const bus = createEventBus();
    const badHandler = vi.fn(() => { throw new Error("oops"); });
    const goodHandler = vi.fn();
    bus.on("ui.update", badHandler);
    bus.on("ui.update", goodHandler);
    expect(() => bus.emit(makeUpdateEvent())).not.toThrow();
    expect(goodHandler).toHaveBeenCalled();
  });
});
