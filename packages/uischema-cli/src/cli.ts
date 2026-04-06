#!/usr/bin/env node

var validateModule = require("./commands/validate");
var previewModule = require("./commands/preview");
var generateTypesModule = require("./commands/generate-types");
var initModule = require("./commands/init");
var generateModule = require("./commands/generate");
var kleur = require("kleur");

const VERSION = "0.1.0";

const USAGE = `
  ${kleur.bold().cyan("uischema")} ${kleur.gray(`v${VERSION}`)}

  ${kleur.bold("Usage")}
    ${kleur.cyan("uischema")} <command> [options]

  ${kleur.bold("Commands")}
    ${kleur.green("init")} ${kleur.gray("[name]")}           Scaffold a new UISchema project
    ${kleur.green("validate")} ${kleur.gray("<file>")}       Validate a UISchema JSON file
    ${kleur.green("preview")} ${kleur.gray("[port]")}        Start an interactive preview server
    ${kleur.green("generate")} ${kleur.gray("<prompt>")}     Generate UISchema from a natural language prompt
    ${kleur.green("generate-types")}          Generate TypeScript types from schema

  ${kleur.bold("Examples")}
    ${kleur.gray("$")} npx @uischema/cli init my-app
    ${kleur.gray("$")} uischema validate ./uischema.json
    ${kleur.gray("$")} uischema preview
    ${kleur.gray("$")} uischema generate "a login form with email and password"

  ${kleur.bold("Environment")}
    ${kleur.cyan("OPENAI_API_KEY")}       OpenAI API key for ${kleur.bold("generate")} command
    ${kleur.cyan("ANTHROPIC_API_KEY")}    Anthropic API key for ${kleur.bold("generate")} command
    ${kleur.cyan("AI_SDK_MODEL")}         Model override (e.g. gpt-4o, claude-3-5-haiku-20241022)
`;

const commands: Record<string, (args: string[]) => Promise<void>> = {
  init: initModule.initCommand,
  validate: validateModule.validateCommand,
  preview: previewModule.previewCommand,
  generate: generateModule.generateCommand,
  "generate-types": generateTypesModule.generateTypesCommand,
};

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    process.exit(command ? 0 : 1);
  }

  if (command === "--version" || command === "-v") {
    console.log(VERSION);
    process.exit(0);
  }

  if (!(command in commands)) {
    console.error(`\n  ${kleur.red("✖")}  Unknown command: ${kleur.bold(command)}`);
    console.error(`  Run ${kleur.cyan("uischema --help")} to see available commands.\n`);
    process.exit(1);
  }

  const commandFn = commands[command];
  commandFn(args.slice(1)).catch((error: unknown) => {
    console.error(`\n  ${kleur.red("✖")}  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { main };
