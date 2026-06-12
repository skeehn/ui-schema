import { validateUISchemaDocument, type UISchemaDocument } from "@uischema/core";

export class UISchemaParseError extends Error {
  constructor(
    message: string,
    /** The raw model output that failed to parse/validate. */
    public readonly raw: string,
    /** Human-readable validation errors, when the JSON parsed but failed the schema. */
    public readonly validationErrors?: string
  ) {
    super(message);
    this.name = "UISchemaParseError";
  }
}

/**
 * Extracts the JSON payload from raw model output: strips markdown fences and
 * any prose before/after the outermost JSON object.
 */
export const extractJSON = (text: string): string => {
  let candidate = text.trim();
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    candidate = fenced[1].trim();
  }
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new UISchemaParseError("Model output contains no JSON object.", text);
  }
  return candidate.slice(start, end + 1);
};

const formatZodIssues = (issues: Array<{ path: Array<string | number>; message: string }>): string =>
  issues
    .map((issue) => `${issue.path.length ? issue.path.join(".") : "(document)"}: ${issue.message}`)
    .join("\n");

/**
 * Parses JSON, tolerating the most common LLM output defect — trailing
 * commas — as a fallback when strict parsing fails. The cleanup only touches
 * commas directly before } or ] outside of string literals.
 */
const parseJSONLeniently = (json: string): unknown => {
  try {
    return JSON.parse(json);
  } catch (strictError) {
    let cleaned = "";
    let inString = false;
    for (let i = 0; i < json.length; i += 1) {
      const char = json[i];
      if (inString) {
        cleaned += char;
        if (char === "\\") {
          cleaned += json[i + 1] ?? "";
          i += 1;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
        cleaned += char;
        continue;
      }
      if (char === ",") {
        const rest = json.slice(i + 1).match(/^\s*([}\]])/);
        if (rest) {
          continue; // drop the trailing comma
        }
      }
      cleaned += char;
    }
    try {
      return JSON.parse(cleaned);
    } catch {
      throw strictError;
    }
  }
};

/**
 * Parses raw model output into a validated UISchemaDocument.
 * Accepts bare nodes (wraps them in a document) for resilience.
 * Throws UISchemaParseError with actionable messages on failure.
 */
export const parseUISchemaResponse = (text: string): UISchemaDocument => {
  const json = extractJSON(text);

  let parsed: unknown;
  try {
    parsed = parseJSONLeniently(json);
  } catch (cause) {
    throw new UISchemaParseError(
      `Model output is not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
      text
    );
  }

  // Some models return the node directly instead of a {root} document.
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    !("root" in parsed) &&
    "type" in parsed
  ) {
    parsed = { schemaVersion: "0.1.0", root: parsed };
  }

  const result = validateUISchemaDocument(parsed);
  if (!result.success) {
    const errors = formatZodIssues(result.error.issues);
    throw new UISchemaParseError(
      `Model output failed UISchema validation:\n${errors}`,
      text,
      errors
    );
  }
  return result.data;
};
