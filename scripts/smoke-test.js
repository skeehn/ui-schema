const fs = require("node:fs");
const path = require("node:path");

const { UISchemaDocumentSchema, validateBasicA11y } = require("@uischema/core");
const { expandShorthand } = require("@uischema/compressed");
const { renderUISchema, getRegistrySnapshot } = require("@uischema/react");

const schemaPath = path.join(__dirname, "..", "examples", "hello-world", "uischema.json");
const schemaRaw = fs.readFileSync(schemaPath, "utf-8");
const schema = JSON.parse(schemaRaw);

const result = UISchemaDocumentSchema.safeParse(schema);
if (!result.success) {
  console.error("Schema validation failed.");
  console.error(result.error.format());
  process.exit(1);
}

const a11yIssues = validateBasicA11y(result.data.root);
if (a11yIssues.length > 0) {
  console.error("A11y validation failed.");
  console.error(a11yIssues);
  process.exit(1);
}

const registry = getRegistrySnapshot();
["Container", "Text", "Button"].forEach((component) => {
  if (!registry[component]) {
    console.error(`Missing registry component: ${component}`);
    process.exit(1);
  }
});

const shorthand = "c[ariaLabel:Demo][children:txt[text:Hi]|btn[text:OK;ariaLabel:Confirm]]";
const expanded = expandShorthand(shorthand);
if (!expanded || !expanded.type) {
  console.error("Shorthand expansion failed.");
  process.exit(1);
}

const element = renderUISchema(result.data);
if (!element) {
  console.error("Renderer did not return a React element.");
  process.exit(1);
}

console.log("Smoke test passed.");
