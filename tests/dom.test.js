const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const { WebDOMAdapter, getVisibleText } = require("@uischema/dom");

const setup = (html) => {
  const dom = new JSDOM(`<div id="app">${html}</div>`);
  const root = dom.window.document.getElementById("app");
  return { adapter: new WebDOMAdapter(root), root };
};

test("query and queryAll scope to the adapter root", () => {
  const { adapter } = setup(`<button class="a"></button><button class="b"></button>`);
  assert.equal(adapter.query("button").className, "a");
  assert.equal(adapter.queryAll("button").length, 2);
  assert.equal(adapter.query(".missing"), null);
});

test("getRole returns explicit roles ahead of implicit ones", () => {
  const { adapter } = setup(`<button role="switch"></button>`);
  assert.equal(adapter.getRole(adapter.query("button")), "switch");
});

test("getRole computes implicit roles", () => {
  const { adapter } = setup(`
    <button></button>
    <a href="/x">link</a>
    <a>not-a-link</a>
    <input type="checkbox">
    <input type="radio">
    <input>
    <textarea></textarea>
    <select></select>
    <nav></nav>
    <main></main>
  `);
  assert.equal(adapter.getRole(adapter.query("button")), "button");
  assert.equal(adapter.getRole(adapter.query("a[href]")), "link");
  assert.equal(adapter.getRole(adapter.query("a:not([href])")), null);
  assert.equal(adapter.getRole(adapter.query("input[type=checkbox]")), "checkbox");
  assert.equal(adapter.getRole(adapter.query("input[type=radio]")), "radio");
  assert.equal(adapter.getRole(adapter.query("input:not([type])")), "textbox");
  assert.equal(adapter.getRole(adapter.query("textarea")), "textbox");
  assert.equal(adapter.getRole(adapter.query("select")), "combobox");
  assert.equal(adapter.getRole(adapter.query("nav")), "navigation");
  assert.equal(adapter.getRole(adapter.query("main")), "main");
});

test("getComputedName prefers aria-label", () => {
  const { adapter } = setup(`<button aria-label="Close">X</button>`);
  assert.equal(adapter.getComputedName(adapter.query("button")), "Close");
});

test("getComputedName resolves aria-labelledby", () => {
  const { adapter } = setup(`<span id="lbl">Search</span><input aria-labelledby="lbl">`);
  assert.equal(adapter.getComputedName(adapter.query("input")), "Search");
});

test("getComputedName falls back to placeholder for inputs", () => {
  const { adapter } = setup(`<input placeholder="Email">`);
  assert.equal(adapter.getComputedName(adapter.query("input")), "Email");
});

test("getComputedName falls back to text content under jsdom", () => {
  // jsdom does not implement innerText; textContent fallback must kick in
  const { adapter } = setup(`<button>Save changes</button>`);
  assert.equal(adapter.getComputedName(adapter.query("button")), "Save changes");
});

test("getComputedName falls back to title", () => {
  const { adapter } = setup(`<button title="Help"></button>`);
  assert.equal(adapter.getComputedName(adapter.query("button")), "Help");
});

test("getVisibleText works without innerText support", () => {
  const { adapter } = setup(`<p>Hello <b>world</b></p>`);
  assert.equal(getVisibleText(adapter.query("p")), "Hello world");
});

test("isFocusable detects interactive and tabindexed elements", () => {
  const { adapter } = setup(`
    <button id="btn"></button>
    <button id="disabled" disabled></button>
    <div id="plain"></div>
    <div id="tabbable" tabindex="0"></div>
    <input id="field">
  `);
  assert.equal(adapter.isFocusable(adapter.query("#btn")), true);
  assert.equal(adapter.isFocusable(adapter.query("#disabled")), false);
  assert.equal(adapter.isFocusable(adapter.query("#plain")), false);
  assert.equal(adapter.isFocusable(adapter.query("#tabbable")), true);
  assert.equal(adapter.isFocusable(adapter.query("#field")), true);
});
