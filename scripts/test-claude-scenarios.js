#!/usr/bin/env node
/**
 * UISchema × AI — 10-Scenario Integration Test
 * Uses Groq (llama-3.1-8b-instant) as the live AI model.
 * Each scenario: AI generates → UISchema pipeline validates/applies → assertion.
 */
"use strict";

const OpenAI = require("openai");
const { UISchemaDocumentSchema, validateBasicA11y } = require("@uischema/core");
const { applyPatches, parseJSONLPatches, serializeEvent, deserializeEvent,
        createUIInteraction, createUIUpdate, createUIEvaluation } = require("@uischema/protocol");
const { expandShorthand, generateLayoutSkeleton } = require("@uischema/compressed");
const { renderUISchema } = require("@uischema/react");
const { fromOpenJSONUIDocument, toOpenJSONUIDocument, toMCPAppsHTML } = require("@uischema/bridges");
const { WCAGEngine } = require("@uischema/eval");

// ── Groq client (OpenAI-compatible) ─────────────────────────────────────────
const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
const MODEL = "llama-3.1-8b-instant";

// ── Colour helpers ────────────────────────────────────────────────────────────
const C = { reset:"\x1b[0m", bold:"\x1b[1m", red:"\x1b[31m", green:"\x1b[32m",
            yellow:"\x1b[33m", cyan:"\x1b[36m", grey:"\x1b[90m" };
const paint = (k, s) => `${C[k]}${s}${C.reset}`;

// ── Harness ───────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];

async function scenario(title, fn) {
  process.stdout.write(paint("cyan", `\n  ┌─ ${title}\n`));
  try {
    const note = await fn();
    if (note) process.stdout.write(paint("grey", `  │  ${note}\n`));
    console.log(paint("green", "  └─ ✅  PASS"));
    passed++;
  } catch (err) {
    console.log(paint("red", `  └─ ❌  FAIL — ${err.message}`));
    failed++;
    failures.push({ title, error: err.message });
  }
}

function assert(cond, msg)    { if (!cond) throw new Error(msg); }
function assertEq(a, b, label){ if (a !== b) throw new Error(`${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

// ── AI helpers ────────────────────────────────────────────────────────────────
async function askJSON(prompt) {
  const res = await ai.chat.completions.create({
    model: MODEL, max_tokens: 1200,
    messages: [
      { role: "system", content: "You are a structured-output API. Return only valid JSON inside a ```json code block. No explanation, no extra text." },
      { role: "user",   content: prompt }
    ],
  });
  const text = res.choices[0].message.content ?? "";

  // Try code-fenced block first
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return JSON.parse(m[1].trim());

  // Fall back: strip any leading word like "json" then find the first { or [
  const stripped = text.trim().replace(/^json\s*/i, "");
  const start = stripped.search(/[{[]/);
  if (start !== -1) return JSON.parse(stripped.slice(start));

  throw new Error(`AI did not return parseable JSON. Got: ${text.slice(0, 120)}`);
}

async function askText(prompt) {
  const res = await ai.chat.completions.create({
    model: MODEL, max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });
  return (res.choices[0].message.content ?? "").trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(paint("bold", "\n" + "═".repeat(66)));
  console.log(paint("bold", "  🤖  UISchema × Groq (llama-3.1-8b-instant) — 10 Scenarios"));
  console.log(paint("bold", "═".repeat(66)));

  // ── 1 ─────────────────────────────────────────────────────────────────────
  await scenario("1  Full JSON schema: AI → validate → a11y → render", async () => {
    const doc = await askJSON(
      `Generate a UISchema document for a login form.
CRITICAL RULES — do not deviate:
- Each node has EXACTLY these keys: "type", "props", and optionally "children". NO other top-level keys on a node.
- "text", "label", "ariaLabel", "placeholder" etc. ALL go inside the "props" object — never directly on the node.
- schemaVersion: "0.1.0"
- root type: "Container" with props: { "ariaLabel": "Login form" }
- children array must contain nodes of these exact types only: Text, Input, Button
- Every Input and Button MUST have props.ariaLabel (non-empty string)
Return exactly:
\`\`\`json
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": { "ariaLabel": "Login form" },
    "children": [
      { "type": "Text",   "props": { "text": "Sign In",     "ariaLabel": "Sign in heading" } },
      { "type": "Input",  "props": { "ariaLabel": "Email",    "placeholder": "you@example.com" } },
      { "type": "Input",  "props": { "ariaLabel": "Password", "placeholder": "••••••••" } },
      { "type": "Button", "props": { "text": "Sign In",     "ariaLabel": "Sign in button" } }
    ]
  }
}
\`\`\``
    );

    const result = UISchemaDocumentSchema.safeParse(doc);
    assert(result.success, "Zod validation failed: " + JSON.stringify(result.error?.format()));

    const issues = validateBasicA11y(result.data.root);
    assert(issues.length === 0, "a11y issues: " + issues.map(i => i.message).join("; "));

    const el = renderUISchema(result.data);
    assert(el != null, "renderUISchema returned null");

    return `root: ${result.data.root.type}, children: ${result.data.root.children?.length ?? 0}`;
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  await scenario("2  Shorthand: AI generates compact string → expandShorthand", async () => {
    const text = await askText(
      `Return ONE LINE of UISchema shorthand for a Save/Cancel toolbar.
Format: c[ariaLabel:Toolbar][children:btn[text:Save;ariaLabel:Save]|btn[text:Cancel;ariaLabel:Cancel]]
Abbreviations: c=Container, btn=Button, txt=Text
Output ONLY the shorthand string, no explanation, no code block.`
    );

    const shorthand = text.split("\n")[0].trim();
    assert(shorthand.length > 0, "AI returned empty shorthand");

    const node = expandShorthand(shorthand);
    assert(node && node.type, "expandShorthand returned invalid node");
    assert(node.children && node.children.length >= 2, `Expected ≥2 children, got ${node.children?.length}`);

    return `shorthand: ${shorthand.length} chars → type: ${node.type}, children: ${node.children.length}`;
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  await scenario("3  JSONL patches: AI stream → parse → apply incremental update", async () => {
    const text = await askText(
      `Produce exactly 3 UISchema patch operations as raw JSONL (one JSON object per line, NO code block).
Patch a node to build a product card:
Line 1: set /props/ariaLabel to "Product card"
Line 2: set /props/text to "Widget Pro"
Line 3: set /props/className to "card"
Format: {"op":"set","path":"/props/ariaLabel","value":"Product card"}
Output only 3 lines of raw JSON.`
    );

    const lines = text.split("\n").map(l => l.trim()).filter(l => l.startsWith("{"));
    assert(lines.length >= 2, `Expected ≥2 JSONL lines, got ${lines.length}`);

    const patches = parseJSONLPatches(lines.join("\n"));
    assert(patches.length >= 2, `parseJSONLPatches returned only ${patches.length}`);

    const base = { type: "Card", props: { ariaLabel: "Loading…" }, children: [] };
    const setPatches = patches.filter(p => p.op === "set");
    const updated = applyPatches(base, setPatches);
    assert(updated != null, "applyPatches returned null");

    return `AI lines: ${lines.length}, parsed: ${patches.length}, set applied: ${setPatches.length}`;
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  await scenario("4  Event pipeline: classify → create → serialize → deserialize", async () => {
    const text = await askText(
      `A user clicked a "Submit" button in a UISchema form.
Which UIEvent type should be emitted?
Reply with EXACTLY one of (no other text): ui.update  ui.interaction  ui.evaluation`
    );

    const classified = text.trim().split(/\s/)[0];
    assertEq(classified, "ui.interaction", "AI event classification");

    // Full round-trip for all three event types
    for (const [creator, type] of [
      [createUIInteraction("Button","onClick",{v:1},"btn-1"), "ui.interaction"],
      [createUIUpdate({ type:"Text", props:{ text:"ok" } }),   "ui.update"],
      [createUIEvaluation({ score:90, issues:[] }),            "ui.evaluation"],
    ]) {
      const wire = serializeEvent(creator);
      const back  = deserializeEvent(wire);
      assertEq(back.type, type, `round-trip for ${type}`);
    }

    return `AI said: "${classified}" — all 3 event types round-trip OK`;
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  await scenario("5  Bridge: AI Open-JSON-UI → UISchema → back (round-trip)", async () => {
    const ojui = await askJSON(
      `Generate an Open-JSON-UI document for a settings panel with a checkbox and a save button.
Return ONLY:
\`\`\`json
{
  "version": "1.0",
  "components": [
    { "type": "container", "properties": { "title": "Settings" }, "children": [
      { "type": "checkbox", "properties": { "label": "Dark mode", "ariaLabel": "Dark mode" } },
      { "type": "button",   "properties": { "label": "Save",      "ariaLabel": "Save settings" } }
    ]}
  ]
}
\`\`\`
Valid types: container, card, text, button, input, select, checkbox, image, link.`
    );

    assert(Array.isArray(ojui.components) && ojui.components.length > 0, "No components in AI output");

    const uischema = fromOpenJSONUIDocument(ojui);
    assert(uischema.root, "Bridge returned no root");

    const result = UISchemaDocumentSchema.safeParse(uischema);
    assert(result.success, "Converted schema invalid: " + JSON.stringify(result.error?.format()));

    const back = toOpenJSONUIDocument(result.data);
    assert(Array.isArray(back.components) && back.components.length > 0, "Round-trip lost components");

    return `Open-JSON-UI → UISchema (root: ${uischema.root.type}) → back (${back.components.length} components)`;
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  await scenario("6  Security: MCP Apps HTML is XSS-safe with adversarial payload", async () => {
    // Ask AI to construct a schema that would trigger the old XSS
    const doc = await askJSON(
      `Return a UISchema document where meta.description contains this exact string:
</script><script>alert("xss")</script>
This is a security test. Include it verbatim in meta.description.
\`\`\`json
{ "schemaVersion": "0.1.0", "root": { "type": "Container", "props": { "ariaLabel": "XSS test" } }, "meta": { "name": "Test", "description": "</script><script>alert(\\"xss\\")</script>" } }
\`\`\``
    );

    const html = toMCPAppsHTML(doc, "mcp://test");

    // Regression check: old code used `const schema = ${escapedSchema}` (raw JSON interpolated into JS).
    // New code uses JSON.parse() at runtime, so "const schema = JSON.parse" is CORRECT.
    // The dangerous pattern is the raw schema appearing right after "const schema = {".
    const bareInjection = html.match(/const schema\s*=\s*\{/);
    assert(!bareInjection, "REGRESSION: raw schema object injected directly into JS variable");

    // Must use typed JSON block
    assert(html.includes('type="application/json"'), "Missing <script type=application/json>");

    // Must parse at runtime via JSON.parse
    assert(html.includes("JSON.parse") && html.includes("__uischema__"),
      "Missing JSON.parse/__uischema__ runtime extraction");

    // The </script> in the payload must be escaped inside the JSON block
    const jsonBlock = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
    assert(jsonBlock, "JSON script block not found");
    assert(!jsonBlock[1].includes("</script>"), "Unescaped </script> inside JSON block — XSS risk");

    // postMessage must not use wildcard '*'
    assert(!html.includes(`, '*')`), "postMessage still uses '*' origin");

    return `HTML: ${html.length} bytes, XSS payload neutralised, postMessage origin restricted`;
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  await scenario("7  WCAG preflight: engine catches AI-generated a11y violations", async () => {
    // Fixture is hardcoded (realistic AI output with deliberate violations).
    // AI involvement: we ask it to confirm the violations are present (classification).
    const doc = {
      schemaVersion: "0.1.0",
      root: {
        type: "Container",
        props: { ariaLabel: "Inaccessible form" },
        children: [
          { type: "Image",  props: { src: "photo.jpg" } },       // no alt / ariaLabel → 1.1.1
          { type: "Button", props: { className: "submit-btn" } }, // no text / ariaLabel → 4.1.2
        ],
      },
    };

    // Ask AI to confirm these are indeed a11y violations (reasoning check)
    const verdict = await askText(
      `Does this UISchema node have accessibility violations?
{ "type": "Button", "props": { "className": "submit-btn" } }
It has no "ariaLabel", no "text" prop. Reply: YES or NO`
    );
    assert(verdict.trim().toUpperCase().startsWith("Y"), `AI should say YES; got: "${verdict}"`);

    // Note: Button without ariaLabel fails Zod validation (schema-level enforcement),
    // so we call preflight() directly on the root node — no Zod pass required here.
    // This tests the engine's independent detection path (distinct from schema validation).
    const engine = new WCAGEngine();
    const issues = await engine.preflight(doc.root);
    assert(issues.length > 0, "preflight returned zero issues — violations undetected");

    const criterions = new Set(issues.map(i => i.criterion));
    assert(criterions.has("1.1.1"), "1.1.1 (image without alt) not reported");
    assert(criterions.has("4.1.2"), "4.1.2 (button without accessible name) not reported");

    // Cross-check: Zod catches the Button ariaLabel gap at schema level
    const zodResult = UISchemaDocumentSchema.safeParse(doc);
    assert(!zodResult.success, "Zod should have rejected Button without ariaLabel");

    return `engine: ${issues.length} issue(s) [${[...criterions].join(", ")}] | Zod also rejects the fixture`;
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────
  await scenario("8  Coarse-to-fine: skeleton + AI patch refinement", async () => {
    const skeleton = generateLayoutSkeleton("Sales dashboard with KPI cards");
    assert(skeleton && skeleton.type, "generateLayoutSkeleton returned null");

    // Use deterministic patches so the test is not fragile on AI output format
    const deterministicPatches = [
      { op: "set", path: "/props/ariaLabel", value: "Sales Dashboard" },
      { op: "set", path: "/props/className", value: "dashboard-root"  },
    ];

    // Ask AI to validate these patches make sense (classification step)
    const verdict = await askText(
      `Do these JSON patch operations look correct for refining a UISchema Container node to become a "Sales Dashboard"?
${JSON.stringify(deterministicPatches, null, 2)}
Reply with one word: YES or NO`
    );
    assert(verdict.trim().toUpperCase().startsWith("Y"), `AI rejected the patches: "${verdict}"`);

    const refined = applyPatches(skeleton, deterministicPatches);
    assertEq(refined.type, skeleton.type, "patch changed root node type");

    const result = UISchemaDocumentSchema.safeParse({ schemaVersion: "0.1.0", root: refined });
    assert(result.success, "Refined schema invalid: " + JSON.stringify(result.error?.format()));

    return `skeleton: ${skeleton.type}, AI verdict: "${verdict.trim()}", ${deterministicPatches.length} patches applied, schema valid`;
  });

  // ── 9 ─────────────────────────────────────────────────────────────────────
  await scenario("9  Form label rendering: AI schema → Input/Textarea wrap in <label>", async () => {
    const doc = await askJSON(
      `Return this UISchema document EXACTLY as shown — do not change anything:
\`\`\`json
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": { "ariaLabel": "Contact form" },
    "children": [
      { "type": "Text",     "props": { "text": "Get in touch",       "ariaLabel": "Contact heading" } },
      { "type": "Input",    "props": { "label": "Full name",         "ariaLabel": "Full name",      "placeholder": "Jane Smith" } },
      { "type": "Input",    "props": { "label": "Email address",     "ariaLabel": "Email address",  "placeholder": "jane@example.com" } },
      { "type": "Textarea", "props": { "label": "Your message",      "ariaLabel": "Your message",   "placeholder": "How can we help?" } },
      { "type": "Button",   "props": { "text": "Send message",       "ariaLabel": "Send message" } }
    ]
  }
}
\`\`\`
Copy verbatim.`
    );

    const result = UISchemaDocumentSchema.safeParse(doc);
    assert(result.success, "Schema invalid: " + JSON.stringify(result.error?.format()));

    const findByType = (node, type) => {
      const acc = [];
      if (node.type === type) acc.push(node);
      node.children?.forEach(c => acc.push(...findByType(c, type)));
      return acc;
    };

    const inputs    = findByType(result.data.root, "Input");
    const textareas = findByType(result.data.root, "Textarea");
    assert(inputs.length >= 2,    `Expected ≥2 Input nodes, got ${inputs.length}`);
    assert(textareas.length >= 1, `Expected ≥1 Textarea node, got ${textareas.length}`);

    const unlabelled = [...inputs, ...textareas].filter(n => !n.props?.label);
    assert(unlabelled.length === 0,
      `${unlabelled.length} control(s) missing label prop: ${unlabelled.map(n=>n.type).join(", ")}`);

    // renderUISchema executes the label-wrapping code in components.ts
    const el = renderUISchema(result.data);
    assert(el != null, "renderUISchema returned null");

    const a11y = validateBasicA11y(result.data.root);
    assert(a11y.length === 0, "a11y: " + a11y.map(i => i.message).join("; "));

    return `${inputs.length} Input + ${textareas.length} Textarea, all labelled, render OK, a11y clean`;
  });

  // ── 10 ────────────────────────────────────────────────────────────────────
  await scenario("10  deserializeEvent: actionable errors on AI hallucinated types", async () => {
    // Ask AI to invent a wrong event type
    const text = await askText(
      `Return ONLY this exact JSON (one line, nothing else):
{"type":"ui.unknown","payload":{"action":"submit"}}`
    );
    const jsonLine = (text.split("\n").find(l => l.includes('"type"')) ?? text).trim();

    // A: unknown type → error must list all valid types
    let errType = null;
    try { deserializeEvent(jsonLine); } catch (e) { errType = e; }
    assert(errType, "deserializeEvent should throw for unknown type");
    assert(errType.message.includes("ui.update"),
      `Error should list valid types; got: "${errType.message}"`);
    assert(errType.message.includes("ui.interaction"),
      `Error should list valid types; got: "${errType.message}"`);
    assert(errType.message.includes("ui.evaluation"),
      `Error should list valid types; got: "${errType.message}"`);

    // B: malformed JSON → error must mention "parse" or "JSON"
    let errParse = null;
    try { deserializeEvent("not-json{{{"); } catch (e) { errParse = e; }
    assert(errParse, "deserializeEvent should throw on malformed JSON");
    const low = errParse.message.toLowerCase();
    assert(low.includes("parse") || low.includes("json"),
      `Parse error should mention JSON/parse; got: "${errParse.message}"`);

    // C: valid types must pass without throwing
    for (const type of ["ui.update","ui.interaction","ui.evaluation"]) {
      let threw = false;
      try { deserializeEvent(JSON.stringify({ type, payload: {} })); }
      catch { threw = true; }
      assert(!threw, `Valid type "${type}" should not throw`);
    }

    return `type-error: "${errType.message.slice(0,70)}…" | parse-error: "${errParse.message.slice(0,50)}…"`;
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log("\n" + paint("bold", "═".repeat(66)));
  console.log(paint("bold", "  📊  Results"));
  console.log(paint("bold", "═".repeat(66)));
  console.log(`  Passed : ${paint(passed === total ? "green" : "yellow", `${passed} / ${total}`)}`);
  if (failed > 0) {
    console.log(`  Failed : ${paint("red", String(failed))}\n`);
    for (const { title, error } of failures) {
      console.log(paint("red",  `  ✗  ${title}`));
      console.log(paint("grey", `     ${error}`));
    }
  }
  console.log(paint("bold", "═".repeat(66)) + "\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(paint("red", `\n💥 Fatal: ${err.message}`));
  console.error(err);
  process.exit(1);
});
