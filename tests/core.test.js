const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  UISchemaDocumentSchema,
  validateUISchemaDocument,
  validateBasicA11y
} = require("@uischema/core");

const validDoc = {
  schemaVersion: "0.1.0",
  root: {
    type: "Container",
    props: { ariaLabel: "Root" },
    children: [
      { type: "Text", props: { text: "Hello" } },
      { type: "Button", props: { text: "Go", ariaLabel: "Go button" } }
    ]
  }
};

test("accepts a valid document", () => {
  const result = validateUISchemaDocument(validDoc);
  assert.equal(result.success, true);
});

test("rejects interactive components without ariaLabel", () => {
  const result = UISchemaDocumentSchema.safeParse({
    root: { type: "Button", props: { text: "No label" } }
  });
  assert.equal(result.success, false);
  const messages = result.error.issues.map((issue) => issue.message);
  assert.ok(messages.some((m) => m.includes("ariaLabel")));
});

test("rejects interactive components with whitespace-only ariaLabel", () => {
  const result = UISchemaDocumentSchema.safeParse({
    root: { type: "Input", props: { ariaLabel: "   " } }
  });
  assert.equal(result.success, false);
});

test("rejects unknown component types", () => {
  const result = UISchemaDocumentSchema.safeParse({
    root: { type: "Carousel" }
  });
  assert.equal(result.success, false);
});

test("accepts x- and custom: extension types", () => {
  for (const type of ["x-map", "custom:chart"]) {
    const result = UISchemaDocumentSchema.safeParse({ root: { type } });
    assert.equal(result.success, true, `expected ${type} to be accepted`);
  }
});

test("rejects unknown keys on nodes (strict mode)", () => {
  const result = UISchemaDocumentSchema.safeParse({
    root: { type: "Container", unexpected: true }
  });
  assert.equal(result.success, false);
});

test("validates nested children recursively", () => {
  const result = UISchemaDocumentSchema.safeParse({
    root: {
      type: "Container",
      children: [{ type: "Row", children: [{ type: "Button", props: {} }] }]
    }
  });
  assert.equal(result.success, false);
});

test("validates slots containing single nodes and arrays", () => {
  const result = UISchemaDocumentSchema.safeParse({
    root: {
      type: "Card",
      slots: {
        header: { type: "Text", props: { text: "Title" } },
        actions: [{ type: "Button", props: { ariaLabel: "OK", text: "OK" } }]
      }
    }
  });
  assert.equal(result.success, true);
});

test("validateBasicA11y passes for a labelled tree", () => {
  assert.deepEqual(validateBasicA11y(validDoc.root), []);
});

test("validateBasicA11y flags unlabelled interactive components with path", () => {
  const issues = validateBasicA11y({
    type: "Container",
    children: [{ type: "Button", props: { text: "Hi" } }]
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].path, "root.children[0].props.ariaLabel");
});

test("validateBasicA11y flags mismatched roles", () => {
  const issues = validateBasicA11y({
    type: "Button",
    props: { ariaLabel: "Go", role: "link" }
  });
  assert.ok(issues.some((issue) => issue.path.endsWith("props.role")));
});

test("validateBasicA11y flags positive tabIndex", () => {
  const issues = validateBasicA11y({
    type: "Container",
    props: { tabIndex: 3 }
  });
  assert.ok(issues.some((issue) => issue.path.endsWith("props.tabIndex")));
});

test("validateBasicA11y traverses slots", () => {
  const issues = validateBasicA11y({
    type: "Card",
    slots: {
      footer: [{ type: "Link", props: { text: "More" } }]
    }
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].path, "root.slots.footer[0].props.ariaLabel");
});
