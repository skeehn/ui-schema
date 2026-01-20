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
  | `x-${string}`
  | `custom:${string}`;

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
