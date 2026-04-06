var fs = require("fs");
var path = require("path");
var kleur = require("kleur");

const SYSTEM_PROMPT = `You are a UI generator. Generate UISchema JSON documents.

UISchema component types:
- Layout: Container, Row, Column, Grid, Card, List, ListItem
- Display: Text, Image, Icon, Badge, Divider, Spacer
- Input: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider
- Action: Button, Link, Form

Rules:
1. All interactive components MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text supports level: h1, h2, h3, h4, h5, h6, body, caption, muted
4. Button supports variant: primary, secondary, ghost, danger
5. Return valid JSON only — no markdown, no explanation

Output format:
{
  "schemaVersion": "0.1.0",
  "root": { "type": "Container", "props": {"ariaLabel": "..."}, "children": [...] },
  "meta": { "name": "...", "description": "..." }
}`;

type Frames = string[];
const spinnerFrames: Frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function createSpinner(text: string) {
  let i = 0;
  let timer: ReturnType<typeof setInterval>;
  return {
    start() {
      process.stdout.write("\x1B[?25l"); // hide cursor
      timer = setInterval(() => {
        process.stdout.write(`\r  ${kleur.cyan(spinnerFrames[i % spinnerFrames.length])}  ${text}`);
        i++;
      }, 80);
    },
    succeed(msg: string) {
      clearInterval(timer);
      process.stdout.write(`\r  ${kleur.green("✔")}  ${msg}          \n`);
      process.stdout.write("\x1B[?25h"); // show cursor
    },
    fail(msg: string) {
      clearInterval(timer);
      process.stdout.write(`\r  ${kleur.red("✖")}  ${msg}          \n`);
      process.stdout.write("\x1B[?25h");
    },
  };
}

async function callOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const body = JSON.stringify({
    model,
    response_format: { type: "json_object" },
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const https = require("https");
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res: { statusCode: number; on: Function }) => {
        let data = "";
        res.on("data", (chunk: string) => { data += chunk; });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.error?.message ?? `HTTP ${res.statusCode}`));
            } else {
              resolve(parsed.choices?.[0]?.message?.content ?? "");
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function callAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
  const body = JSON.stringify({
    model,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const https = require("https");
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res: { statusCode: number; on: Function }) => {
        let data = "";
        res.on("data", (chunk: string) => { data += chunk; });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.error?.message ?? `HTTP ${res.statusCode}`));
            } else {
              // Extract JSON from Anthropic response (may have markdown fences)
              const text = parsed.content?.[0]?.text ?? "";
              const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
              resolve(jsonMatch ? jsonMatch[1] : text);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateCommand(args: string[]): Promise<void> {
  // Load dotenv if available
  try { require("dotenv").config(); } catch {}

  const prompt = args.join(" ").trim();
  if (!prompt) {
    console.error(kleur.red("  Error: prompt is required"));
    console.error(kleur.gray("  Usage: uischema generate \"a login form with email and password\""));
    process.exit(1);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    console.error(`\n  ${kleur.red("✖")}  No API key found.\n`);
    console.error(`  Set ${kleur.cyan("OPENAI_API_KEY")} or ${kleur.cyan("ANTHROPIC_API_KEY")} in your environment.\n`);
    console.error(kleur.gray("  Example:"));
    console.error(kleur.gray("    OPENAI_API_KEY=sk-... uischema generate \"a login form\"\n"));
    process.exit(1);
  }

  console.log(`\n  ${kleur.bold("Generating")} UISchema for:\n  ${kleur.cyan(`"${prompt}"`)}\n`);

  const spinner = createSpinner("Calling AI model...");
  spinner.start();

  let jsonText: string;
  try {
    if (openaiKey) {
      const model = process.env.AI_SDK_MODEL ?? "gpt-4o-mini";
      jsonText = await callOpenAI(prompt, openaiKey, model);
      spinner.succeed(`Generated with ${kleur.bold("OpenAI")} (${model})`);
    } else {
      const model = process.env.AI_SDK_MODEL ?? "claude-3-5-haiku-20241022";
      jsonText = await callAnthropic(prompt, anthropicKey!, model);
      spinner.succeed(`Generated with ${kleur.bold("Anthropic")} (${model})`);
    }
  } catch (err) {
    spinner.fail(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // Parse
  let schema: unknown;
  try {
    schema = JSON.parse(jsonText.trim());
  } catch {
    console.error(`\n  ${kleur.red("✖")}  Failed to parse JSON response\n`);
    console.error(kleur.gray(jsonText.slice(0, 300)));
    process.exit(1);
  }

  // Write to file
  const outFile = path.resolve(process.cwd(), "uischema.json");
  fs.writeFileSync(outFile, JSON.stringify(schema, null, 2) + "\n");
  console.log(`\n  ${kleur.green("✔")}  Written to ${kleur.bold("uischema.json")}`);
  console.log(`\n  ${kleur.gray("Preview it:")}`);
  console.log(`    ${kleur.cyan("uischema preview")}\n`);
}

module.exports = { generateCommand };
