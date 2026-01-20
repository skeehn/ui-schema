#!/usr/bin/env node

/**
 * Comprehensive test suite for UISchema
 * Tests all packages and integration points
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

let passed = 0;
let failed = 0;
const failures = [];

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    fn();
    log(`✅ ${name}`, "green");
    passed++;
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, "red");
    failed++;
    failures.push({ name, error: error.message });
  }
}

// Test 1: Core Package
log("\n📦 Testing @uischema/core", "blue");
test("Schema validation", () => {
  const { UISchemaDocumentSchema } = require("@uischema/core");
  const schemaPath = path.join(__dirname, "..", "examples", "hello-world", "uischema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const result = UISchemaDocumentSchema.safeParse(schema);
  if (!result.success) {
    throw new Error("Schema validation failed");
  }
});

test("Accessibility validation", () => {
  const { validateBasicA11y, UISchemaDocumentSchema } = require("@uischema/core");
  const schemaPath = path.join(__dirname, "..", "examples", "hello-world", "uischema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const result = UISchemaDocumentSchema.safeParse(schema);
  const issues = validateBasicA11y(result.data.root);
  if (issues.length > 0) {
    throw new Error(`Accessibility issues found: ${issues.length}`);
  }
});

test("Type exports", () => {
  const core = require("@uischema/core");
  if (!core.UISchemaDocumentSchema) {
    throw new Error("Missing UISchemaDocumentSchema export");
  }
  if (!core.validateBasicA11y) {
    throw new Error("Missing validateBasicA11y export");
  }
});

// Test 2: Compressed Package
log("\n📦 Testing @uischema/compressed", "blue");
test("Shorthand parsing", () => {
  const { parseShorthand } = require("@uischema/compressed");
  const parsed = parseShorthand("c[ariaLabel:Test]");
  if (!parsed || parsed.type !== "c") {
    throw new Error("Shorthand parsing failed");
  }
});

test("Shorthand expansion", () => {
  const { expandShorthand } = require("@uischema/compressed");
  const node = expandShorthand("c[ariaLabel:Test][children:txt[text:Hello]]");
  if (!node || node.type !== "Container") {
    throw new Error("Shorthand expansion failed");
  }
});

test("Coarse-to-fine pipeline", () => {
  const { generateLayoutSkeleton, applyPatches } = require("@uischema/compressed");
  const skeleton = generateLayoutSkeleton("Test dashboard");
  if (!skeleton || skeleton.type !== "Container") {
    throw new Error("Layout skeleton generation failed");
  }
  const patches = [{ op: "set", path: "/props/text", value: "Updated" }];
  const updated = applyPatches(skeleton, patches);
  if (!updated) {
    throw new Error("Patch application failed");
  }
});

// Test 3: Bridges Package
log("\n📦 Testing @uischema/bridges", "blue");
test("Open-JSON-UI conversion", () => {
  const { fromOpenJSONUIDocument, toOpenJSONUIDocument } = require("@uischema/bridges");
  const openJsonUI = {
    version: "1.0",
    components: [
      {
        type: "container",
        properties: { title: "Hello" },
        children: [{ type: "text", properties: { title: "World" } }]
      }
    ]
  };
  const uischema = fromOpenJSONUIDocument(openJsonUI);
  if (!uischema || !uischema.root) {
    throw new Error("Open-JSON-UI conversion failed");
  }
  const back = toOpenJSONUIDocument(uischema);
  if (!back || !back.components) {
    throw new Error("UISchema to Open-JSON-UI conversion failed");
  }
});

test("AG-UI event mapping", () => {
  const { toAGUIEvent, fromAGUIEvent } = require("@uischema/bridges");
  const node = { type: "Button", id: "btn1", props: { ariaLabel: "Click" } };
  const event = { type: "action", name: "onClick", params: {} };
  const agEvent = toAGUIEvent("onClick", event, node);
  if (!agEvent || agEvent.type !== "ui.interaction") {
    throw new Error("AG-UI event conversion failed");
  }
});

test("MCP Apps message format", () => {
  const { createMCPAppsUpdateMessage } = require("@uischema/bridges");
  const node = { type: "Container", props: { ariaLabel: "Test" } };
  const message = createMCPAppsUpdateMessage(node, 1);
  if (!message || message.jsonrpc !== "2.0") {
    throw new Error("MCP Apps message creation failed");
  }
});

// Test 4: Protocol Package
log("\n📦 Testing @uischema/protocol", "blue");
test("Patch operations", () => {
  const { applyPatches, createSetPatch } = require("@uischema/protocol");
  const root = { type: "Container", props: { text: "Original" } };
  const updated = applyPatches(root, [createSetPatch("/props/text", "Updated")]);
  if (updated.props.text !== "Updated") {
    throw new Error("Patch operation failed");
  }
});

test("JSONL patch parsing", () => {
  const { parseJSONLPatches, serializePatchesToJSONL } = require("@uischema/protocol");
  const patches = [{ op: "set", path: "/props/text", value: "Test" }];
  const jsonl = serializePatchesToJSONL(patches);
  const parsed = parseJSONLPatches(jsonl);
  if (parsed.length !== 1 || parsed[0].op !== "set") {
    throw new Error("JSONL patch parsing failed");
  }
});

test("Event serialization", () => {
  const { createUIUpdate, serializeEvent, deserializeEvent } = require("@uischema/protocol");
  const node = { type: "Container", props: {} };
  const event = createUIUpdate(node);
  const json = serializeEvent(event);
  const deserialized = deserializeEvent(json);
  if (deserialized.type !== "ui.update") {
    throw new Error("Event serialization failed");
  }
});

test("State management", () => {
  const { createUIWidgetState, updateModelContent, getModelContent } = require("@uischema/protocol");
  const state = createUIWidgetState({ count: 0 });
  const updated = updateModelContent(state, { count: 1 });
  const content = getModelContent(updated);
  if (content.count !== 1) {
    throw new Error("State management failed");
  }
});

// Test 5: React Package
log("\n📦 Testing @uischema/react", "blue");
test("Component registry", () => {
  const { getRegistrySnapshot } = require("@uischema/react");
  const registry = getRegistrySnapshot();
  if (!registry.Container || !registry.Text || !registry.Button) {
    throw new Error("Component registry missing required components");
  }
});

test("Renderer exports", () => {
  const react = require("@uischema/react");
  if (!react.UISchemaRenderer) {
    throw new Error("Missing UISchemaRenderer export");
  }
  if (!react.useUIStream) {
    throw new Error("Missing useUIStream export");
  }
});

test("DX-first API", () => {
  const { generateUISchema, StreamingUISchemaRenderer } = require("@uischema/react");
  if (!generateUISchema) {
    throw new Error("Missing generateUISchema export");
  }
  if (!StreamingUISchemaRenderer) {
    throw new Error("Missing StreamingUISchemaRenderer export");
  }
});

// Test 6: Integration Tests
log("\n🔗 Testing Integration", "blue");
test("End-to-end: Schema → Render", () => {
  const { UISchemaDocumentSchema } = require("@uischema/core");
  const { renderUISchema } = require("@uischema/react");
  const schemaPath = path.join(__dirname, "..", "examples", "hello-world", "uischema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const result = UISchemaDocumentSchema.safeParse(schema);
  const element = renderUISchema(result.data);
  if (!element) {
    throw new Error("Rendering failed");
  }
});

test("Shorthand → Expand → Render", () => {
  const { expandShorthand } = require("@uischema/compressed");
  const { renderUISchema } = require("@uischema/react");
  const node = expandShorthand("c[ariaLabel:Test][children:txt[text:Hello]]");
  const element = renderUISchema({ root: node });
  if (!element) {
    throw new Error("Shorthand → Render pipeline failed");
  }
});

// Summary
log("\n" + "=".repeat(50), "blue");
log(`\n📊 Test Results:`, "blue");
log(`✅ Passed: ${passed}`, "green");
if (failed > 0) {
  log(`❌ Failed: ${failed}`, "red");
  log("\nFailures:", "yellow");
  failures.forEach(({ name, error }) => {
    log(`  - ${name}: ${error}`, "red");
  });
} else {
  log(`❌ Failed: ${failed}`, "green");
}

log("\n" + "=".repeat(50), "blue");

if (failed > 0) {
  process.exit(1);
} else {
  log("\n🎉 All tests passed!", "green");
  process.exit(0);
}
