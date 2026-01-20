#!/usr/bin/env node

var validateModule = require("./commands/validate");
var previewModule = require("./commands/preview");
var generateTypesModule = require("./commands/generate-types");

var commands: Record<string, (args: string[]) => Promise<void>> = {
  validate: validateModule.validateCommand,
  preview: previewModule.previewCommand,
  "generate-types": generateTypesModule.generateTypesCommand
};

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !(command in commands)) {
    console.error(`Usage: uischema <command>

Commands:
  validate <file>     Validate UISchema JSON file
  preview             Start dev preview server
  generate-types       Generate TypeScript types from schema
`);
    process.exit(1);
  }

  const commandFn = commands[command];
  commandFn(args.slice(1)).catch((error: unknown) => {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { main };
