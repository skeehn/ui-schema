var fs = require("fs");
var path = require("path");
var core = require("@uischema/core");

async function validateCommand(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    console.error("Error: File path required");
    console.error("Usage: uischema validate <file>");
    process.exit(1);
  }

  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    const json = JSON.parse(content);

    // Validate schema
    const result = core.validateUISchemaDocument(json);
    if (!result.success) {
      console.error("❌ Schema validation failed:");
      result.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }

    console.log("✅ Schema validation passed");

    // Validate basic accessibility
    const a11yIssues = core.validateBasicA11y(result.data.root);
    if (a11yIssues.length > 0) {
      console.warn("⚠️  Accessibility issues found:");
      a11yIssues.forEach((issue: { path: string; message: string }) => {
        console.warn(`  - ${issue.path}: ${issue.message}`);
      });
    } else {
      console.log("✅ Basic accessibility checks passed");
    }

    console.log(`\n📊 Schema compliance: 100%`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      console.error(`Error: File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON: ${error.message}`);
    } else {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

module.exports = { validateCommand };
