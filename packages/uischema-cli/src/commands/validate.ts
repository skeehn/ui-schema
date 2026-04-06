var fs = require("fs");
var path = require("path");
var core = require("@uischema/core");
var kleur = require("kleur");

function renderBar(score: number, width = 24): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return kleur.green("█".repeat(filled)) + kleur.gray("░".repeat(empty));
}

async function validateCommand(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    console.error(kleur.red("Error: File path required"));
    console.error(kleur.gray("Usage: uischema validate <file>"));
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  console.log(kleur.gray(`\n  Validating ${kleur.white(fullPath)}\n`));

  let schemaScore = 0;
  let a11yScore = 0;
  let schemaErrors: string[] = [];
  let a11yIssues: string[] = [];

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch (e) {
      console.error(kleur.red("  ✖  Invalid JSON: ") + kleur.gray(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }

    // Schema validation
    const result = core.validateUISchemaDocument(json);
    if (!result.success) {
      result.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
        schemaErrors.push(`${err.path.join(".")}: ${err.message}`);
      });
      schemaScore = 0;
    } else {
      schemaScore = 100;
    }

    // A11y validation
    if (result.success) {
      const issues = core.validateBasicA11y(result.data.root) as Array<{ path: string; message: string }>;
      a11yIssues = issues.map((i) => `${i.path}: ${i.message}`);
      a11yScore = issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      console.error(kleur.red(`  ✖  File not found: ${filePath}`));
    } else {
      console.error(kleur.red(`  ✖  ${error instanceof Error ? error.message : String(error)}`));
    }
    process.exit(1);
  }

  // ── Schema result ──────────────────────────────────────
  if (schemaScore === 100) {
    console.log(`  ${kleur.green("✔")}  Schema         ${kleur.green("valid")}`);
  } else {
    console.log(`  ${kleur.red("✖")}  Schema         ${kleur.red("invalid")}`);
    schemaErrors.forEach((e) => console.log(`       ${kleur.gray("·")} ${kleur.yellow(e)}`));
  }

  // ── A11y result ────────────────────────────────────────
  if (a11yScore === 100) {
    console.log(`  ${kleur.green("✔")}  Accessibility  ${kleur.green("passed")}`);
  } else {
    console.log(`  ${kleur.yellow("⚠")}  Accessibility  ${kleur.yellow(`${a11yIssues.length} issue(s)`)}`);
    a11yIssues.forEach((i) => console.log(`       ${kleur.gray("·")} ${kleur.yellow(i)}`));
  }

  // ── Overall score ──────────────────────────────────────
  const overallScore = Math.round((schemaScore + a11yScore) / 2);
  const scoreColor = overallScore === 100 ? kleur.green : overallScore >= 70 ? kleur.yellow : kleur.red;

  console.log(`\n  ${kleur.bold("Score")}  ${renderBar(overallScore)} ${scoreColor(overallScore + "%")}\n`);

  if (schemaScore < 100) {
    process.exit(1);
  }
}

module.exports = { validateCommand };
