export {
  UISCHEMA_SYSTEM_PROMPT,
  buildUserPrompt,
  buildRepairPrompt
} from "./prompt";

export {
  parseUISchemaResponse,
  extractJSON,
  UISchemaParseError
} from "./parse";

export {
  generateUISchema,
  type GenerateTextFn,
  type GenerateUISchemaOptions,
  type GenerateUISchemaResult
} from "./generate";

/**
 * The UISchema JSON Schema (draft 2020-12) — pass it to providers that
 * support structured outputs / JSON Schema response formats, or use it as a
 * tool/function parameter schema.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const uischemaJsonSchema: Record<string, unknown> = require("@uischema/core/schema/uischema.json");
