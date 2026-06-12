const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  applyPatches,
  parseJSONLPatches,
  serializePatchesToJSONL,
  createSetPatch,
  createAddPatch,
  createRemovePatch,
  createUIUpdate,
  createUIInteraction,
  isUIUpdate,
  isUIInteraction,
  serializeEvent,
  deserializeEvent,
  createUIWidgetState,
  updateModelContent,
  updatePrivateState,
  getModelContent,
  mergeState
} = require("@uischema/protocol");

const baseTree = () => ({
  type: "Container",
  props: { ariaLabel: "Root" },
  children: [
    { type: "Text", props: { text: "One" } },
    { type: "Text", props: { text: "Two" } }
  ]
});

test("set replaces a nested property", () => {
  const next = applyPatches(baseTree(), [createSetPatch("/children/0/props/text", "Uno")]);
  assert.equal(next.children[0].props.text, "Uno");
});

test("set/replace at the root swaps the whole tree", () => {
  const replacement = { type: "Text", props: { text: "New" } };
  assert.deepEqual(applyPatches(baseTree(), [createSetPatch("/", replacement)]), replacement);
  assert.deepEqual(applyPatches(baseTree(), [{ op: "replace", path: "", value: replacement }]), replacement);
});

test("add appends with /- and inserts at an index", () => {
  const appended = applyPatches(baseTree(), [
    createAddPatch("/children/-", { type: "Text", props: { text: "Three" } })
  ]);
  assert.equal(appended.children.length, 3);
  assert.equal(appended.children[2].props.text, "Three");

  const inserted = applyPatches(baseTree(), [
    createAddPatch("/children/1", { type: "Divider" })
  ]);
  assert.equal(inserted.children.length, 3);
  assert.equal(inserted.children[1].type, "Divider");
  assert.equal(inserted.children[2].props.text, "Two");
});

test("remove deletes array elements and object keys", () => {
  const fewer = applyPatches(baseTree(), [createRemovePatch("/children/0")]);
  assert.equal(fewer.children.length, 1);
  assert.equal(fewer.children[0].props.text, "Two");

  const stripped = applyPatches(baseTree(), [createRemovePatch("/props/ariaLabel")]);
  assert.equal(stripped.props.ariaLabel, undefined);
});

test("removing a non-existent path is a no-op", () => {
  const tree = baseTree();
  const next = applyPatches(tree, [createRemovePatch("/slots/header/props/text")]);
  assert.deepEqual(next, tree);
});

test("patching uses structural sharing for untouched branches", () => {
  const tree = baseTree();
  const next = applyPatches(tree, [createSetPatch("/children/0/props/text", "Uno")]);
  assert.notEqual(next, tree);
  assert.notEqual(next.children[0], tree.children[0]);
  // Sibling branch is the same object reference
  assert.equal(next.children[1], tree.children[1]);
});

test("input tree is never mutated", () => {
  const tree = baseTree();
  applyPatches(tree, [
    createSetPatch("/children/0/props/text", "Changed"),
    createAddPatch("/children/-", { type: "Spacer" })
  ]);
  assert.deepEqual(tree, baseTree());
});

test("JSON Pointer ~0 and ~1 escapes are decoded", () => {
  const next = applyPatches({ type: "Container", props: {} }, [
    createSetPatch("/props/a~1b", 1),
    createSetPatch("/props/c~0d", 2)
  ]);
  assert.equal(next.props["a/b"], 1);
  assert.equal(next.props["c~d"], 2);
});

test("invalid paths and operations throw", () => {
  assert.throws(() => applyPatches(baseTree(), [createSetPatch("children/0", {})]), /must start with/);
  assert.throws(() => applyPatches(baseTree(), [createSetPatch("/children/x", {})]), /Invalid array index/);
  assert.throws(() => applyPatches(baseTree(), [createSetPatch("/children/-", {})]), /append/);
  assert.throws(() => applyPatches(baseTree(), [createRemovePatch("")]), /root/);
  assert.throws(() => applyPatches(baseTree(), [createAddPatch("", {})]), /root/);
});

test("JSONL patches roundtrip through serialize/parse", () => {
  const patches = [
    createSetPatch("/props/text", "Hi"),
    createAddPatch("/children/-", { type: "Text" }),
    createRemovePatch("/children/0")
  ];
  const jsonl = serializePatchesToJSONL(patches);
  assert.equal(jsonl.split("\n").length, 3);
  assert.deepEqual(parseJSONLPatches(jsonl), patches);
});

test("parseJSONLPatches rejects malformed lines", () => {
  assert.throws(() => parseJSONLPatches('{"op":"set"}\n{not json}'), /Invalid JSON/);
});

test("events roundtrip through serialize/deserialize with type guards", () => {
  const update = createUIUpdate({ type: "Text", props: { text: "Hi" } }, "/children/0");
  const interaction = createUIInteraction("Button", "onClick", { x: 1 }, "btn-1");

  const parsedUpdate = deserializeEvent(serializeEvent(update));
  const parsedInteraction = deserializeEvent(serializeEvent(interaction));

  assert.ok(isUIUpdate(parsedUpdate));
  assert.ok(isUIInteraction(parsedInteraction));
  assert.equal(parsedUpdate.payload.path, "/children/0");
  assert.equal(parsedInteraction.payload.componentId, "btn-1");
});

test("deserializeEvent rejects unknown event types and bad JSON", () => {
  assert.throws(() => deserializeEvent('{"type":"ui.bogus"}'), /Invalid event type/);
  assert.throws(() => deserializeEvent("not json"), /Failed to parse/);
});

test("widget state updates are immutable and merge correctly", () => {
  const initial = createUIWidgetState({ count: 1 });
  const next = updateModelContent(initial, { count: 2, name: "a" });

  assert.equal(getModelContent(initial).count, 1);
  assert.deepEqual(getModelContent(next), { count: 2, name: "a" });

  const withPrivate = updatePrivateState(next, { draft: true });
  assert.equal(withPrivate.privateState.draft, true);
  assert.deepEqual(next.privateState, {});

  const merged = mergeState(withPrivate, {
    widgetState: { modelContent: { count: 3 } },
    privateState: { open: false }
  });
  assert.deepEqual(getModelContent(merged), { count: 3, name: "a" });
  assert.deepEqual(merged.privateState, { draft: true, open: false });
});
