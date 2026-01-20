import type { UISchemaComponentType, UISchemaNode } from "@uischema/core";
import { parseShorthand, type ShorthandNode } from "../shorthand/cfg";

const TYPE_MAP: Record<string, UISchemaComponentType> = {
  c: "Container",
  row: "Row",
  col: "Column",
  grid: "Grid",
  card: "Card",
  list: "List",
  li: "ListItem",
  txt: "Text",
  img: "Image",
  icon: "Icon",
  badge: "Badge",
  btn: "Button",
  link: "Link",
  in: "Input",
  ta: "Textarea",
  sel: "Select",
  chk: "Checkbox",
  radio: "RadioGroup",
  sw: "Switch",
  slider: "Slider",
  form: "Form",
  div: "Divider",
  sp: "Spacer"
};

const expandNode = (node: ShorthandNode): UISchemaNode => {
  const mappedType = TYPE_MAP[node.type] ?? (`custom:${node.type}` as UISchemaComponentType);

  return {
    type: mappedType,
    props: Object.keys(node.props).length ? { ...node.props } : undefined,
    children: node.children.length ? node.children.map(expandNode) : undefined
  };
};

export const expandShorthand = (input: string | ShorthandNode): UISchemaNode => {
  const parsed = typeof input === "string" ? parseShorthand(input) : input;
  return expandNode(parsed);
};
