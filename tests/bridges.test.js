const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  fromOpenJSONUI,
  fromOpenJSONUIDocument,
  toOpenJSONUI,
  toOpenJSONUIDocument,
  toAGUIEvent,
  fromAGUIEvent,
  createAGUIUpdate,
  mapUISchemaEventsToAGUI,
  toMCPAppsHTML,
  toMCPAppsResource,
  createMCPAppsUpdateMessage
} = require("@uischema/bridges");

// --- Open-JSON-UI ---

test("fromOpenJSONUI maps known types and label/title to text", () => {
  const node = fromOpenJSONUI({
    type: "button",
    properties: { label: "Save" }
  });
  assert.equal(node.type, "Button");
  assert.equal(node.props.text, "Save");
  assert.equal(node.props.label, undefined, "source label key should not leak through");
  assert.equal(node.props.ariaLabel, "Save", "interactive components get ariaLabel fallback");
});

test("fromOpenJSONUI maps unknown types to custom:", () => {
  assert.equal(fromOpenJSONUI({ type: "carousel" }).type, "custom:carousel");
});

test("fromOpenJSONUIDocument wraps multiple components in a Container", () => {
  const doc = fromOpenJSONUIDocument({
    components: [{ type: "text", properties: { title: "A" } }, { type: "text", properties: { title: "B" } }]
  });
  assert.equal(doc.root.type, "Container");
  assert.equal(doc.root.children.length, 2);
});

test("fromOpenJSONUIDocument throws on empty documents", () => {
  assert.throws(() => fromOpenJSONUIDocument({ components: [] }), /at least one component/);
});

test("toOpenJSONUI emits style once, on the top-level field", () => {
  const component = toOpenJSONUI({
    type: "Card",
    props: { text: "Hello", style: { padding: "8px" } }
  });
  assert.deepEqual(component.style, { padding: "8px" });
  assert.equal(component.properties.style, undefined, "style must not be duplicated into properties");
  assert.equal(component.properties.title, "Hello");
});

test("toOpenJSONUI maps Button/Link text to label, others to title", () => {
  assert.equal(toOpenJSONUI({ type: "Button", props: { text: "Go" } }).properties.label, "Go");
  assert.equal(toOpenJSONUI({ type: "Text", props: { text: "Hi" } }).properties.title, "Hi");
});

test("Open-JSON-UI roundtrip preserves structure", () => {
  const original = {
    components: [
      {
        type: "card",
        properties: { title: "Profile" },
        children: [{ type: "button", properties: { label: "Edit" } }]
      }
    ]
  };
  const uischema = fromOpenJSONUIDocument(original);
  const back = toOpenJSONUIDocument(uischema);
  assert.equal(back.components.length, 1);
  assert.equal(back.components[0].type, "card");
  assert.equal(back.components[0].properties.title, "Profile");
  assert.equal(back.components[0].children[0].properties.label, "Edit");
});

// --- AG-UI ---

test("toAGUIEvent maps action/submit to ui.interaction and navigate to ui.state-change", () => {
  const node = { id: "n1", type: "Button" };
  assert.equal(toAGUIEvent("onClick", { type: "action", name: "save" }, node).type, "ui.interaction");
  assert.equal(toAGUIEvent("onSubmit", { type: "submit", name: "send" }, node).type, "ui.interaction");
  assert.equal(toAGUIEvent("onNav", { type: "navigate", name: "go" }, node).type, "ui.state-change");
});

test("fromAGUIEvent returns null for non-interaction events and decodes payloads", () => {
  assert.equal(fromAGUIEvent({ type: "ui.update", payload: {} }), null);
  const event = fromAGUIEvent({
    type: "ui.interaction",
    payload: { eventType: "submit", eventName: "send", params: { a: 1 } }
  });
  assert.deepEqual(event, { type: "submit", name: "send", params: { a: 1 } });
});

test("fromAGUIEvent falls back to action for unknown event types", () => {
  const event = fromAGUIEvent({
    type: "ui.interaction",
    payload: { eventType: "bogus", eventName: "x" }
  });
  assert.equal(event.type, "action");
});

test("mapUISchemaEventsToAGUI maps every event and handles undefined", () => {
  const node = { id: "n1", type: "Form" };
  assert.deepEqual(mapUISchemaEventsToAGUI(undefined, node), []);
  const events = mapUISchemaEventsToAGUI(
    {
      onSubmit: { type: "submit", name: "submitForm" },
      onReset: { type: "action", name: "resetForm" }
    },
    node
  );
  assert.equal(events.length, 2);
  assert.ok(events.every((e) => e.payload.componentId === "n1"));
});

test("createAGUIUpdate summarizes children", () => {
  const update = createAGUIUpdate({
    id: "root",
    type: "Container",
    children: [{ id: "a", type: "Text" }]
  });
  assert.equal(update.type, "ui.update");
  assert.deepEqual(update.payload.children, [{ id: "a", type: "Text" }]);
});

// --- MCP Apps ---

test("toMCPAppsHTML neutralizes </script> in schema content", () => {
  const html = toMCPAppsHTML(
    {
      root: {
        type: "Text",
        props: { text: '</script><script>alert("xss")</script>' }
      }
    },
    "ui://test"
  );
  assert.ok(!/<\/script><script>alert/.test(html), "raw close-tag injection must be escaped");
  assert.ok(html.includes("<\\/script>"));
});

test("toMCPAppsHTML neutralizes </script> in allowedOrigin", () => {
  const html = toMCPAppsHTML({ root: { type: "Text" } }, "ui://test", "</script><script>1</script>");
  assert.ok(!html.includes("</script><script>1"));
});

test("toMCPAppsResource sets the MCP Apps mime type and metadata", () => {
  const resource = toMCPAppsResource(
    { root: { type: "Container" }, meta: { description: "demo" } },
    "ui://widget",
    "Widget"
  );
  assert.equal(resource.mimeType, "text/html;profile=mcp-app");
  assert.equal(resource.description, "demo");
  assert.equal(resource.uri, "ui://widget");
});

test("createMCPAppsUpdateMessage embeds the node as structured content", () => {
  const message = createMCPAppsUpdateMessage({ id: "n1", type: "Text" }, 7);
  assert.equal(message.jsonrpc, "2.0");
  assert.equal(message.id, 7);
  assert.deepEqual(message.params.structuredContent.uischema, { id: "n1", type: "Text" });
});
