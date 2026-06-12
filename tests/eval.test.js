const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const { WCAGEngine } = require("@uischema/eval");
const { WebDOMAdapter } = require("@uischema/dom");

test("preflight passes a clean tree", async () => {
  const engine = new WCAGEngine();
  const issues = await engine.preflight({
    type: "Container",
    props: { ariaLabel: "Root" },
    children: [
      { type: "Image", props: { src: "/a.png", alt: "A chart" } },
      { type: "Button", props: { text: "Go", ariaLabel: "Go" } }
    ]
  });
  assert.deepEqual(issues, []);
});

test("preflight flags images without alt or ariaLabel (1.1.1)", async () => {
  const engine = new WCAGEngine();
  const issues = await engine.preflight({
    type: "Container",
    children: [{ type: "Image", props: { src: "/a.png" } }]
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].criterion, "1.1.1");
  assert.equal(issues[0].path, "root.children[0]");
});

test("preflight flags images without src too — alt text is about description, not src", async () => {
  const engine = new WCAGEngine();
  const issues = await engine.preflight({ type: "Image" });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].criterion, "1.1.1");
});

test("preflight flags unnamed interactive components (4.1.2)", async () => {
  const engine = new WCAGEngine();
  const issues = await engine.preflight({ type: "Button" });
  assert.ok(issues.some((i) => i.criterion === "4.1.2" && i.status === "FAIL"));
});

test("preflight warns on positive tabIndex (2.1.1) and traverses slots", async () => {
  const engine = new WCAGEngine();
  const issues = await engine.preflight({
    type: "Card",
    slots: {
      footer: [{ type: "Text", props: { text: "Hi", tabIndex: 5 } }]
    }
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].criterion, "2.1.1");
  assert.equal(issues[0].status, "WARNING");
  assert.equal(issues[0].path, "root.slots.footer[0]");
});

test("audit requires an adapter", async () => {
  const engine = new WCAGEngine();
  await assert.rejects(() => engine.audit(), /DOMAdapter is required/);
});

test("audit flags focusable elements without accessible names", async () => {
  const dom = new JSDOM(`<div id="app">
    <button></button>
    <button aria-label="Save"></button>
  </div>`);
  const adapter = new WebDOMAdapter(dom.window.document.getElementById("app"));
  const engine = new WCAGEngine(adapter);
  const report = await engine.audit();

  const nameFailures = report.issues.filter(
    (i) => i.criterion === "4.1.2" && i.status === "FAIL"
  );
  assert.equal(nameFailures.length, 1);
  assert.ok(report.score < 100);
});

test("audit accepts text content as an accessible name (works under jsdom)", async () => {
  const dom = new JSDOM(`<div id="app"><button>Save</button></div>`);
  const adapter = new WebDOMAdapter(dom.window.document.getElementById("app"));
  const engine = new WCAGEngine(adapter);
  const report = await engine.audit();

  const nameFailures = report.issues.filter(
    (i) => i.criterion === "4.1.2" && i.status === "FAIL"
  );
  assert.deepEqual(nameFailures, []);
  assert.equal(report.score, 100);
});

test("audit emits single manual-check summaries for focus and contrast", async () => {
  const dom = new JSDOM(`<div id="app">
    <p>Some text</p>
    <p>More text</p>
    <button aria-label="A">A</button>
    <button aria-label="B">B</button>
  </div>`);
  const adapter = new WebDOMAdapter(dom.window.document.getElementById("app"));
  const engine = new WCAGEngine(adapter);
  const report = await engine.audit();

  assert.equal(report.issues.filter((i) => i.criterion === "2.4.7").length, 1);
  assert.equal(report.issues.filter((i) => i.criterion === "1.4.3").length, 1);
});

test("audit skips hidden elements", async () => {
  const dom = new JSDOM(`<div id="app">
    <button hidden></button>
    <button aria-hidden="true"></button>
  </div>`);
  const adapter = new WebDOMAdapter(dom.window.document.getElementById("app"));
  const engine = new WCAGEngine(adapter);
  const report = await engine.audit();
  assert.deepEqual(report.issues.filter((i) => i.status === "FAIL"), []);
});
