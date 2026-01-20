import { z } from "zod";
import type { UISchemaComponentType, UISchemaDocument, UISchemaNode } from "../types";

const CoreComponentTypes = [
  "Container",
  "Row",
  "Column",
  "Grid",
  "Card",
  "List",
  "ListItem",
  "Text",
  "Image",
  "Icon",
  "Badge",
  "Button",
  "Link",
  "Input",
  "Textarea",
  "Select",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "Slider",
  "Form",
  "Divider",
  "Spacer"
] as const;

const MetaSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    locale: z.string().optional()
  })
  .strict();

const PropsSchema = z
  .object({
    id: z.string().optional(),
    className: z.string().optional(),
    style: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    ariaLabel: z.string().optional(),
    role: z.string().optional(),
    tabIndex: z.number().int().min(-1).max(32767).optional(),
    text: z.string().optional(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    placeholder: z.string().optional(),
    href: z.string().optional(),
    src: z.string().optional()
  })
  .passthrough();

const BindingSchema = z
  .object({
    path: z.string(),
    type: z.enum(["string", "number", "boolean", "array", "object", "date"]).optional(),
    default: z.unknown().optional(),
    transform: z.string().optional()
  })
  .strict();

const EventSchema = z
  .object({
    type: z.enum(["action", "navigate", "submit", "custom"]),
    name: z.string(),
    params: z.record(z.unknown()).optional()
  })
  .strict();

const ComponentTypeSchema = z.custom<UISchemaComponentType>((value) => {
  if (typeof value !== "string") {
    return false;
  }
  if (CoreComponentTypes.includes(value as (typeof CoreComponentTypes)[number])) {
    return true;
  }
  return value.startsWith("x-") || value.startsWith("custom:");
});

const A11yLabelTypes = new Set([
  "Button",
  "Link",
  "Input",
  "Textarea",
  "Select",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "Slider"
]);

export const UISchemaNodeSchema: z.ZodType<UISchemaNode> = z.lazy(() =>
  z
    .object({
      id: z.string().optional(),
      key: z.string().optional(),
      type: ComponentTypeSchema,
      props: PropsSchema.optional(),
      children: z.array(UISchemaNodeSchema).optional(),
      slots: z
        .record(z.union([UISchemaNodeSchema, z.array(UISchemaNodeSchema)]))
        .optional(),
      bindings: z.record(BindingSchema).optional(),
      events: z.record(EventSchema).optional(),
      meta: MetaSchema.optional(),
      ext: z.record(z.unknown()).optional()
    })
    .strict()
    .superRefine((node, ctx) => {
      if (A11yLabelTypes.has(String(node.type))) {
        const ariaLabel = node.props?.ariaLabel;
        if (typeof ariaLabel !== "string" || ariaLabel.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "props.ariaLabel is required for interactive components.",
            path: ["props", "ariaLabel"]
          });
        }
      }
    })
);

export const UISchemaDocumentSchema: z.ZodType<UISchemaDocument> = z
  .object({
    schemaVersion: z.string().optional(),
    root: UISchemaNodeSchema,
    meta: MetaSchema.optional()
  })
  .strict();

export const validateUISchemaDocument = (input: unknown) =>
  UISchemaDocumentSchema.safeParse(input);
