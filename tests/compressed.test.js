const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  parseShorthand,
  expandShorthand,
  applyPatches,
  generateLayoutSkeleton
} = require("@uischema/compressed");
const { UISchemaNodeSchema } = require("@uischema/core");

test("parses a bare component", () => {
  assert.deepEqual(parseShorthand("btn"), { type: "btn", props: {}, children: [] });
});

test("parses props including quoted values and colons in values", () => {
  const node = parseShorthand('link[text:"Read more";href:https://example.com/a:b]');
  assert.equal(node.props.text, "Read more");
  assert.equal(node.props.href, "https://example.com/a:b");
});

test("parses nested children split on top-level pipes only", () => {
  const node = parseShorthand(
    "c[children:row[children:txt[text:A]|txt[text:B]]|btn[text:OK]]"
  );
  assert.equal(node.children.length, 2);
  assert.equal(node.children[0].type, "row");
  assert.equal(node.children[0].children.length, 2);
  assert.equal(node.children[1].type, "btn");
});

test("parses prop values containing semicolons inside nested brackets", () => {
  const node = parseShorthand("txt[style:[color:red;margin:0]]");
  assert.equal(node.props.style, "[color:red;margin:0]");
});

test("throws on empty input", () => {
  assert.throws(() => parseShorthand("   "), /empty/i);
});

test("throws on unmatched brackets", () => {
  assert.throws(() => parseShorthand("c[text:hi"), /Unmatched bracket/);
});

test("throws when input does not start with an identifier", () => {
  assert.throws(() => parseShorthand("[text:hi]"), /identifier/);
});

test("expands shorthand aliases to canonical types", () => {
  const expanded = expandShorthand(
    "c[ariaLabel:Demo][children:txt[text:Hi]|btn[text:OK;ariaLabel:Confirm]]"
  );
  assert.equal(expanded.type, "Container");
  assert.equal(expanded.children[0].type, "Text");
  assert.equal(expanded.children[1].type, "Button");
  assert.equal(expanded.children[1].props.ariaLabel, "Confirm");
});

test("expands unknown aliases to custom: types", () => {
  assert.equal(expandShorthand("chart[ariaLabel:Sales]").type, "custom:chart");
});

test("expanded shorthand validates against the core node schema", () => {
  const expanded = expandShorthand(
    "form[ariaLabel:Login][children:in[placeholder:Email;ariaLabel:Email]|btn[text:Submit;ariaLabel:Submit]]"
  );
  const result = UISchemaNodeSchema.safeParse(expanded);
  assert.equal(result.success, true);
});

test("pipeline applyPatches sets and removes values", () => {
  const root = { type: "Container", props: { ariaLabel: "Root" }, children: [] };
  const patched = applyPatches(root, [
    { op: "set", path: "/props/text", value: "Hello" },
    { op: "remove", path: "/props/ariaLabel" }
  ]);
  assert.equal(patched.props.text, "Hello");
  assert.equal(patched.props.ariaLabel, undefined);
  // Original is untouched (pipeline clones)
  assert.equal(root.props.ariaLabel, "Root");
});

test("generateLayoutSkeleton produces a schema-valid tree", () => {
  const skeleton = generateLayoutSkeleton("dashboard");
  const result = UISchemaNodeSchema.safeParse(skeleton);
  assert.equal(result.success, true);
});
