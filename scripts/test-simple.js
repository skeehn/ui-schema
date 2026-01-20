#!/usr/bin/env node

/**
 * Simple test that works before building
 * Tests source files directly
 */

const fs = require("node:fs");
const path = require("node:path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    log(`✅ ${name}`, "green");
    passed++;
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, "red");
    failed++;
  }
}

log("\n🧪 Simple Source Tests", "blue");
log("=".repeat(50), "blue");

// Test 1: Files exist
test("Core package files exist", () => {
  const files = [
    "packages/uischema-core/src/index.ts",
    "packages/uischema-core/src/types.ts",
    "packages/uischema-core/src/validators/zod.ts",
    "packages/uischema-core/src/validators/basic-a11y.ts",
    "packages/uischema-core/schema/uischema.json"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test("Compressed package files exist", () => {
  const files = [
    "packages/uischema-compressed/src/index.ts",
    "packages/uischema-compressed/src/shorthand/cfg.ts",
    "packages/uischema-compressed/src/expansion/expand.ts",
    "packages/uischema-compressed/src/pipeline/coarse-to-fine.ts"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test("Bridges package files exist", () => {
  const files = [
    "packages/uischema-bridges/src/index.ts",
    "packages/uischema-bridges/src/bridges/open-json-ui.ts",
    "packages/uischema-bridges/src/bridges/ag-ui.ts",
    "packages/uischema-bridges/src/bridges/mcp-apps.ts"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test("Protocol package files exist", () => {
  const files = [
    "packages/uischema-protocol/src/index.ts",
    "packages/uischema-protocol/src/patches.ts",
    "packages/uischema-protocol/src/events.ts",
    "packages/uischema-protocol/src/state.ts"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test("React package files exist", () => {
  const files = [
    "packages/uischema-react/src/index.ts",
    "packages/uischema-react/src/renderer/react.tsx",
    "packages/uischema-react/src/registry/components.ts",
    "packages/uischema-react/src/hooks/useUIStream.ts",
    "packages/uischema-react/src/api/dx-first.ts"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test("CLI package files exist", () => {
  const files = [
    "packages/uischema-cli/src/cli.ts",
    "packages/uischema-cli/src/commands/validate.ts",
    "packages/uischema-cli/src/commands/preview.ts",
    "packages/uischema-cli/src/commands/generate-types.ts"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

// Test 2: Example files exist
test("Example files exist", () => {
  const files = [
    "examples/hello-world/uischema.json",
    "examples/nextjs-vercel-ai-sdk/package.json"
  ];
  files.forEach(file => {
    const fullPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

// Test 3: JSON Schema is valid JSON
test("JSON Schema is valid", () => {
  const schemaPath = path.join(__dirname, "..", "packages/uischema-core/schema/uischema.json");
  const content = fs.readFileSync(schemaPath, "utf-8");
  JSON.parse(content);
});

// Test 4: Example schema is valid JSON
test("Example schema is valid JSON", () => {
  const schemaPath = path.join(__dirname, "..", "examples/hello-world/uischema.json");
  const content = fs.readFileSync(schemaPath, "utf-8");
  const schema = JSON.parse(content);
  if (!schema.root || !schema.root.type) {
    throw new Error("Invalid schema structure");
  }
});

// Test 5: Package.json files are valid
test("Package.json files are valid", () => {
  const packages = [
    "packages/uischema-core/package.json",
    "packages/uischema-compressed/package.json",
    "packages/uischema-bridges/package.json",
    "packages/uischema-protocol/package.json",
    "packages/uischema-react/package.json",
    "packages/uischema-cli/package.json"
  ];
  packages.forEach(pkg => {
    const fullPath = path.join(__dirname, "..", pkg);
    const content = fs.readFileSync(fullPath, "utf-8");
    const pkgJson = JSON.parse(content);
    if (!pkgJson.name || !pkgJson.version) {
      throw new Error(`Invalid package.json: ${pkg}`);
    }
  });
});

// Summary
log("\n" + "=".repeat(50), "blue");
log(`\n📊 Results:`, "blue");
log(`✅ Passed: ${passed}`, "green");
if (failed > 0) {
  log(`❌ Failed: ${failed}`, "red");
  process.exit(1);
} else {
  log(`❌ Failed: ${failed}`, "green");
  log("\n✅ All file structure tests passed!", "green");
  log("\n💡 Next step: Build packages with 'npm run build'", "blue");
  process.exit(0);
}
