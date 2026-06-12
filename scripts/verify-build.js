#!/usr/bin/env node

/**
 * Verify all packages build correctly
 */

const fs = require("node:fs");
const path = require("node:path");

const packages = [
  "uischema-core",
  "uischema-ai",
  "uischema-compressed",
  "uischema-bridges",
  "uischema-protocol",
  "uischema-react",
  "uischema-vue",
  "uischema-dom",
  "uischema-eval",
  "uischema-cli"
];

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log("\n🔨 Verifying Build Output", "blue");
log("=".repeat(50), "blue");

let allPassed = true;

packages.forEach((pkg) => {
  const distPath = path.join(__dirname, "..", "packages", pkg, "dist");
  const indexPath = path.join(distPath, "index.js");
  const typesPath = path.join(distPath, "index.d.ts");

  if (!fs.existsSync(distPath)) {
    log(`❌ ${pkg}: dist/ directory missing`, "red");
    allPassed = false;
    return;
  }

  if (!fs.existsSync(indexPath)) {
    log(`❌ ${pkg}: dist/index.js missing`, "red");
    allPassed = false;
    return;
  }

  if (!fs.existsSync(typesPath)) {
    log(`❌ ${pkg}: dist/index.d.ts missing`, "red");
    allPassed = false;
    return;
  }

  log(`✅ ${pkg}: Build output verified`, "green");
});

log("\n" + "=".repeat(50), "blue");

if (allPassed) {
  log("\n🎉 All packages built successfully!", "green");
  process.exit(0);
} else {
  log("\n❌ Some packages failed to build", "red");
  log("Run 'npm run build' to build all packages", "red");
  process.exit(1);
}
