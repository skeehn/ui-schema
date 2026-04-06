import { describe, it, expect } from "vitest";
import { validateUISchemaDocument } from "../validators/zod";
import { validateBasicA11y } from "../validators/basic-a11y";
import type { UISchemaDocument, UISchemaNode } from "../types";

// ─── Valid fixtures ────────────────────────────────────────────────────────────

const validDocument: UISchemaDocument = {
  schemaVersion: "0.1.0",
  root: {
    type: "Container",
    props: { ariaLabel: "Test container" },
    children: [
      { type: "Text", props: { text: "Hello" } },
      {
        type: "Button",
        props: { text: "Click", ariaLabel: "Primary action" },
        events: { onClick: { type: "action", name: "handleClick" } },
      },
    ],
  },
  meta: { name: "Test", description: "A test schema" },
};

// ─── validateUISchemaDocument ─────────────────────────────────────────────────

describe("validateUISchemaDocument", () => {
  it("accepts a valid document", () => {
    const result = validateUISchemaDocument(validDocument);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.root.type).toBe("Container");
    }
  });

  it("rejects a document missing root", () => {
    const result = validateUISchemaDocument({ schemaVersion: "0.1.0" });
    expect(result.success).toBe(false);
  });

  it("rejects a document with missing root.type", () => {
    const result = validateUISchemaDocument({ root: { props: {} } });
    expect(result.success).toBe(false);
  });

  it("accepts a document without schemaVersion", () => {
    const result = validateUISchemaDocument({ root: { type: "Container" } });
    expect(result.success).toBe(true);
  });

  it("accepts a document with deeply nested children", () => {
    const result = validateUISchemaDocument({
      root: {
        type: "Container",
        children: [
          {
            type: "Card",
            children: [
              { type: "Row", children: [{ type: "Text", props: { text: "deep" } }] },
            ],
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts custom component types (x- prefix)", () => {
    const result = validateUISchemaDocument({ root: { type: "x-my-chart" } });
    expect(result.success).toBe(true);
  });

  it("accepts custom component types (custom: prefix)", () => {
    const result = validateUISchemaDocument({ root: { type: "custom:ds:DataTable" } });
    expect(result.success).toBe(true);
  });

  it("rejects null", () => {
    const result = validateUISchemaDocument(null);
    expect(result.success).toBe(false);
  });

  it("rejects array", () => {
    const result = validateUISchemaDocument([]);
    expect(result.success).toBe(false);
  });
});

// ─── validateBasicA11y ────────────────────────────────────────────────────────

describe("validateBasicA11y", () => {
  it("returns no issues for a fully accessible node", () => {
    const issues = validateBasicA11y(validDocument.root);
    expect(issues).toHaveLength(0);
  });

  it("returns a11y issue when Button missing ariaLabel", () => {
    const node: UISchemaNode = {
      type: "Button",
      props: { text: "Click" }, // no ariaLabel
    };
    const issues = validateBasicA11y(node);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/ariaLabel|accessible name/i);
  });

  it("returns a11y issue when Input missing ariaLabel", () => {
    const node: UISchemaNode = { type: "Input", props: { placeholder: "Email" } };
    const issues = validateBasicA11y(node);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("returns no issue when Input has ariaLabel", () => {
    const node: UISchemaNode = {
      type: "Input",
      props: { placeholder: "Email", ariaLabel: "Email address" },
    };
    const issues = validateBasicA11y(node);
    expect(issues).toHaveLength(0);
  });

  it("returns no issue for non-interactive Image (basic-a11y only checks interactive types)", () => {
    const node: UISchemaNode = { type: "Image", props: { src: "/img.png" } };
    const issues = validateBasicA11y(node);
    // Image is not in the InteractiveTypes set — basic-a11y doesn't flag missing alt
    expect(issues).toHaveLength(0);
  });

  it("recursively checks children", () => {
    const node: UISchemaNode = {
      type: "Container",
      props: { ariaLabel: "Container" },
      children: [
        { type: "Button", props: { text: "No label" } }, // missing ariaLabel
      ],
    };
    const issues = validateBasicA11y(node);
    expect(issues.length).toBeGreaterThan(0);
  });
});
