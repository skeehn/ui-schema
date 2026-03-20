const { WebDOMAdapter } = require("@uischema/dom");
const { WCAGEngine } = require("@uischema/eval");
const { createUIEvaluation, serializeEvent } = require("@uischema/protocol");
const { JSDOM } = require("jsdom");

async function runDemo() {
  console.log("🚀 Starting UISchema v1.1 Pipeline Demo");

  // 1. Simulate a rendered UI using JSDOM
  const dom = new JSDOM(`
    <div id="root">
      <button id="btn1">Click Me</button>
      <img src="logo.png" />
      <input type="text" aria-label="Search" />
    </div>
  `);
  const root = dom.window.document.getElementById("root");

  // 2. Initialize DOM Adapter
  const adapter = new WebDOMAdapter(root);
  console.log("✅ DOM Adapter initialized");

  // 3. Initialize WCAG Engine and run Audit
  const engine = new WCAGEngine(adapter);
  const report = await engine.audit();
  console.log("✅ WCAG Audit completed. Score:", report.score);
  console.log("Found", report.issues.length, "issues/manual checks.");

  // 4. Flow results through Protocol Layer
  const evaluationEvent = createUIEvaluation({
    score: report.score,
    issues: report.issues.map(i => ({
      criterion: i.criterion,
      level: i.level,
      status: i.status,
      message: i.message
    }))
  });

  const serialized = serializeEvent(evaluationEvent);
  console.log("✅ Serialized Protocol Event:");
  console.log(serialized);

  console.log("\n✨ v1.1 Pipeline Demo Finished Successfully");
}

runDemo().catch(console.error);
