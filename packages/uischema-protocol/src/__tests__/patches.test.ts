import { describe, it, expect } from "vitest";
import {
  applyPatches,
  parseJSONLPatches,
  serializePatchesToJSONL,
  createSetPatch,
  createAddPatch,
  createReplacePatch,
  createRemovePatch,
} from "../patches";
import type { UISchemaNode } from "@uischema/core";

const root: UISchemaNode = {
  type: "Container",
  props: { ariaLabel: "Root" },
  children: [
    { type: "Text", props: { text: "Hello" } },
    { type: "Button", props: { text: "Click", ariaLabel: "Button" } },
  ],
};

describe("patch helpers", () => {
  it("createSetPatch creates correct patch", () => {
    const p = createSetPatch("/root", { type: "Container" });
    expect(p.op).toBe("set");
    expect(p.path).toBe("/root");
  });

  it("createAddPatch creates correct patch", () => {
    const p = createAddPatch("/children/-", { type: "Text" });
    expect(p.op).toBe("add");
  });

  it("createReplacePatch creates correct patch", () => {
    const p = createReplacePatch("/props/text", "New text");
    expect(p.op).toBe("replace");
    expect(p.value).toBe("New text");
  });

  it("createRemovePatch creates correct patch", () => {
    const p = createRemovePatch("/children/0");
    expect(p.op).toBe("remove");
    expect(p.value).toBeUndefined();
  });
});

describe("applyPatches", () => {
  it("applies a replace patch to update a prop", () => {
    const patches = [createReplacePatch("/props/ariaLabel", "Updated")];
    const updated = applyPatches(root, patches);
    expect(updated.props?.ariaLabel).toBe("Updated");
    // Original should not be mutated
    expect(root.props?.ariaLabel).toBe("Root");
  });

  it("applies a set patch to set root type", () => {
    const patches = [createSetPatch("/type", "Card")];
    const updated = applyPatches(root, patches);
    expect(updated.type).toBe("Card");
  });

  it("does not mutate the original node", () => {
    const patches = [createReplacePatch("/props/ariaLabel", "Changed")];
    applyPatches(root, patches);
    expect(root.props?.ariaLabel).toBe("Root");
  });
});

describe("JSONL patches", () => {
  it("serializes patches to JSONL", () => {
    const patches = [createSetPatch("/type", "Card"), createReplacePatch("/props/text", "Hi")];
    const jsonl = serializePatchesToJSONL(patches);
    const lines = jsonl.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(() => JSON.parse(lines[0])).not.toThrow();
  });

  it("parses a JSONL line back to patches", () => {
    const patch = createSetPatch("/type", "Card");
    const line = JSON.stringify(patch);
    const parsed = parseJSONLPatches(line);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].op).toBe("set");
  });

  it("round-trips patches through JSONL", () => {
    const patches = [
      createSetPatch("/type", "Card"),
      createReplacePatch("/props/text", "Test"),
    ];
    const jsonl = serializePatchesToJSONL(patches);
    const lines = jsonl.trim().split("\n");
    const reparsed = lines.flatMap((l) => parseJSONLPatches(l));
    expect(reparsed).toHaveLength(2);
    expect(reparsed[0].op).toBe("set");
    expect(reparsed[1].op).toBe("replace");
  });
});
