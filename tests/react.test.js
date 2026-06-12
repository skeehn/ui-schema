const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");

const {
  renderUISchema,
  normalizeProps,
  registerComponent,
  getComponent,
  getRegistrySnapshot
} = require("@uischema/react");

// Walk a rendered element tree, invoking registry components and unwrapping
// fragments, and return the fully resolved host-element tree.
const resolve = (element) => {
  if (element === null || element === undefined || typeof element === "string") {
    return element;
  }
  if (Array.isArray(element)) {
    return element.flatMap((child) => {
      const resolved = resolve(child);
      return Array.isArray(resolved) ? resolved : [resolved];
    });
  }
  if (typeof element.type === "function") {
    return resolve(element.type(element.props));
  }
  const children = resolve(React.Children.toArray(element.props?.children ?? []));
  if (element.type === React.Fragment) {
    return children;
  }
  return { type: element.type, props: element.props, children };
};

test("renderUISchema renders documents and bare nodes", () => {
  const doc = {
    schemaVersion: "0.1.0",
    root: { type: "Container", props: { ariaLabel: "Root" } }
  };
  assert.ok(React.isValidElement(renderUISchema(doc)));
  assert.ok(React.isValidElement(renderUISchema(doc.root)));
});

test("registry components resolve to the expected host elements", () => {
  const tree = resolve(
    renderUISchema({
      type: "Container",
      props: { ariaLabel: "Root" },
      children: [
        { type: "Text", props: { text: "Hello" } },
        { type: "Button", props: { text: "Go", ariaLabel: "Go" } }
      ]
    })
  );
  assert.equal(tree.type, "div");
  assert.equal(tree.props["aria-label"], "Root");
  const [text, button] = tree.children;
  assert.equal(text.type, "span");
  assert.equal(button.type, "button");
  assert.equal(button.props["aria-label"], "Go");
});

test("unknown types fall back to a tagged div", () => {
  const tree = resolve(renderUISchema({ type: "x-map", props: { ariaLabel: "Map" } }));
  assert.equal(tree.type, "div");
  assert.equal(tree.props["data-uischema-type"], "x-map");
});

test("Button onClick dispatches the schema event", () => {
  let received = null;
  const tree = resolve(
    renderUISchema(
      {
        type: "Button",
        props: { text: "Save", ariaLabel: "Save" },
        events: { onClick: { type: "action", name: "saveForm", params: { id: 1 } } }
      },
      (name, params) => {
        received = { name, params };
      }
    )
  );
  tree.props.onClick();
  assert.deepEqual(received, { name: "saveForm", params: { id: 1 } });
});

test("Input renders a wrapping label when a label prop is provided", () => {
  const labelled = resolve(
    renderUISchema({ type: "Input", props: { ariaLabel: "Email", label: "Email" } })
  );
  assert.equal(labelled.type, "label");

  const bare = resolve(renderUISchema({ type: "Input", props: { ariaLabel: "Email" } }));
  assert.equal(bare.type, "input");
});

test("registerComponent overrides rendering for a type", () => {
  registerComponent("custom:greeting", ({ node }) =>
    React.createElement("h1", {}, node.props?.text ?? "")
  );
  assert.ok(getComponent("custom:greeting"));
  assert.ok(getRegistrySnapshot()["custom:greeting"]);

  const tree = resolve(renderUISchema({ type: "custom:greeting", props: { text: "Hi" } }));
  assert.equal(tree.type, "h1");
});

test("normalizeProps blocks dangerous sinks", () => {
  const normalized = normalizeProps({
    dangerouslySetInnerHTML: { __html: "<img onerror=alert(1)>" },
    innerHTML: "<b>x</b>",
    outerHTML: "<b>x</b>",
    id: "ok"
  });
  assert.deepEqual(normalized, { id: "ok" });
});

test("normalizeProps drops props outside the allowlist", () => {
  const normalized = normalizeProps({
    onClick: "javascript:alert(1)",
    srcDoc: "<script></script>",
    className: "card",
    href: "/next"
  });
  assert.deepEqual(normalized, { className: "card", href: "/next" });
});

test("normalizeProps maps camelCase aria props and passes aria-/data- through", () => {
  const normalized = normalizeProps({
    ariaLabel: "Close",
    ariaExpanded: false,
    "aria-hidden": "true",
    "data-test": "x"
  });
  assert.deepEqual(normalized, {
    "aria-label": "Close",
    "aria-expanded": false,
    "aria-hidden": "true",
    "data-test": "x"
  });
});

test("normalizeProps handles missing props", () => {
  assert.deepEqual(normalizeProps(undefined), {});
});
