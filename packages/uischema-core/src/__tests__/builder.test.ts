import { describe, it, expect } from "vitest";
import { schema, node, UISchemaNodeBuilder, UISchemaDocumentBuilder } from "../builder";

describe("node builder", () => {
  it("creates a node with the given type", () => {
    const n = node("Button").build();
    expect(n.type).toBe("Button");
  });

  it("sets props", () => {
    const n = node("Button").props({ text: "Click", ariaLabel: "Primary" }).build();
    expect(n.props?.text).toBe("Click");
    expect(n.props?.ariaLabel).toBe("Primary");
  });

  it("merges props on multiple .props() calls", () => {
    const n = node("Button")
      .props({ text: "Click" })
      .props({ ariaLabel: "OK" })
      .build();
    expect(n.props?.text).toBe("Click");
    expect(n.props?.ariaLabel).toBe("OK");
  });

  it("sets id and key", () => {
    const n = node("Text").id("my-id").key("my-key").build();
    expect(n.id).toBe("my-id");
    expect(n.key).toBe("my-key");
  });

  it("sets children from builders", () => {
    const n = node("Container")
      .children([node("Text").props({ text: "Hi" }), node("Button").props({ text: "Go" })])
      .build();
    expect(n.children).toHaveLength(2);
    expect(n.children?.[0].type).toBe("Text");
    expect(n.children?.[1].type).toBe("Button");
  });

  it("adds a single child with .child()", () => {
    const n = node("Container").child(node("Text")).child(node("Button")).build();
    expect(n.children).toHaveLength(2);
  });

  it("registers events with .on()", () => {
    const n = node("Button")
      .on("onClick", { type: "action", name: "doThing", params: { x: 1 } })
      .build();
    expect(n.events?.onClick.name).toBe("doThing");
    expect(n.events?.onClick.params?.x).toBe(1);
  });

  it("sets bindings", () => {
    const n = node("Input")
      .bind("value", { path: "/state/email", type: "string" })
      .build();
    expect(n.bindings?.value.path).toBe("/state/email");
  });

  it("returns a plain object (not builder instance)", () => {
    const n = node("Text").build();
    expect(n).not.toBeInstanceOf(UISchemaNodeBuilder);
    expect(n.type).toBe("Text");
  });
});

describe("schema builder", () => {
  it("builds a valid document", () => {
    const doc = schema()
      .root(node("Container").children([node("Text").props({ text: "Hello" })]))
      .build();
    expect(doc.schemaVersion).toBe("0.1.0");
    expect(doc.root.type).toBe("Container");
    expect(doc.root.children?.[0].type).toBe("Text");
  });

  it("sets meta", () => {
    const doc = schema()
      .root(node("Container"))
      .meta({ name: "My UI", description: "Test" })
      .build();
    expect(doc.meta?.name).toBe("My UI");
  });

  it("overrides schemaVersion", () => {
    const doc = schema().root(node("Container")).version("1.0.0").build();
    expect(doc.schemaVersion).toBe("1.0.0");
  });

  it("throws if .build() called without .root()", () => {
    expect(() => schema().build()).toThrow(/root/i);
  });

  it("accepts a plain node object in .root()", () => {
    const doc = schema().root({ type: "Container" }).build();
    expect(doc.root.type).toBe("Container");
  });
});
