var fs = require("fs");
var path = require("path");

async function generateTypesCommand(args: string[]): Promise<void> {
  const outputPath = args[0] || "uischema-types.ts";

  try {
    // Generate TypeScript types from JSON Schema
    // This is a simplified version - in production would use a proper JSON Schema to TypeScript converter
    const types = `// Auto-generated TypeScript types from UISchema JSON Schema
// Generated at: ${new Date().toISOString()}

export type UISchemaDocument = {
  schemaVersion?: string;
  root: UISchemaNode;
  meta?: UISchemaMeta;
};

export type UISchemaMeta = {
  name?: string;
  description?: string;
  locale?: string;
};

export type CoreComponentType =
  | "Container"
  | "Row"
  | "Column"
  | "Grid"
  | "Card"
  | "List"
  | "ListItem"
  | "Text"
  | "Image"
  | "Icon"
  | "Badge"
  | "Button"
  | "Link"
  | "Input"
  | "Textarea"
  | "Select"
  | "Checkbox"
  | "RadioGroup"
  | "Switch"
  | "Slider"
  | "Form"
  | "Divider"
  | "Spacer";

export type UISchemaComponentType =
  | CoreComponentType
  | \`x-\${string}\`
  | \`custom:\${string}\`;

export type UISchemaProps = {
  id?: string;
  className?: string;
  style?: Record<string, string | number | boolean | null>;
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
  text?: string;
  value?: string | number | boolean | null;
  placeholder?: string;
  href?: string;
  src?: string;
  [key: string]: unknown;
};

export type UISchemaBinding = {
  path: string;
  type?: "string" | "number" | "boolean" | "array" | "object" | "date";
  default?: unknown;
  transform?: string;
};

export type UISchemaEvent = {
  type: "action" | "navigate" | "submit" | "custom";
  name: string;
  params?: Record<string, unknown>;
};

export type UISchemaNode = {
  id?: string;
  key?: string;
  type: UISchemaComponentType;
  props?: UISchemaProps;
  children?: UISchemaNode[];
  slots?: Record<string, UISchemaNode | UISchemaNode[]>;
  bindings?: Record<string, UISchemaBinding>;
  events?: Record<string, UISchemaEvent>;
  meta?: UISchemaMeta;
  ext?: Record<string, unknown>;
};
`;

    fs.writeFileSync(path.resolve(outputPath), types, "utf-8");
    console.log(`✅ TypeScript types generated: ${outputPath}`);

    // Generate JSON Schema snippet for LLMs
    // Try to find schema relative to CLI package
    const possiblePaths = [
      path.join(__dirname, "../../../uischema-core/schema/uischema.json"),
      path.join(process.cwd(), "packages/uischema-core/schema/uischema.json"),
      path.join(process.cwd(), "node_modules/@uischema/core/schema/uischema.json")
    ];
    
    let schemaPath: string | null = null;
    for (const p of possiblePaths) {
      try {
        fs.readFileSync(p, "utf-8");
        schemaPath = p;
        break;
      } catch {
        // Continue to next path
      }
    }
    
    if (!schemaPath) {
      console.warn("⚠️  Could not find uischema.json schema file, skipping JSON Schema snippet generation");
    } else {
      try {
        const jsonSchemaSnippet = fs.readFileSync(schemaPath, "utf-8");
        const snippetPath = outputPath.replace(".ts", "-schema.json");
        fs.writeFileSync(path.resolve(snippetPath), jsonSchemaSnippet, "utf-8");
        console.log(`✅ JSON Schema snippet generated: ${snippetPath}`);
        console.log(`\n💡 Use this JSON Schema with OpenAI structured outputs or Llama JSON mode`);
      } catch (error: unknown) {
        console.warn("⚠️  Could not read schema file:", error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

module.exports = { generateTypesCommand };
