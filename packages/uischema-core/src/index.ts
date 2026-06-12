export type {
  UISchemaDocument,
  UISchemaNode,
  UISchemaMeta,
  UISchemaProps,
  UISchemaBinding,
  UISchemaEvent,
  UISchemaComponentType,
  CoreComponentType
} from "./types";

export {
  UISchemaDocumentSchema,
  UISchemaNodeSchema,
  validateUISchemaDocument
} from "./validators/zod";

export { validateBasicA11y } from "./validators/basic-a11y";
export type { A11yIssue } from "./validators/basic-a11y";
