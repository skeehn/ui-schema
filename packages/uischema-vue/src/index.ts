import { h, defineComponent, type PropType } from "vue";
import type { UISchemaDocument, UISchemaNode } from "@uischema/core";

/**
 * UISchemaRenderer for Vue 3.
 * A thin shim that renders UISchema nodes using Vue's render function.
 */
export const UISchemaRenderer = defineComponent({
  name: "UISchemaRenderer",
  props: {
    schema: {
      type: Object as PropType<UISchemaDocument | UISchemaNode>,
      required: true
    },
    onEvent: {
      type: Function as PropType<(name: string, params?: Record<string, unknown>) => void>,
      required: false
    }
  },
  setup(props: any) {
    const renderNode = (node: UISchemaNode): any => {
      const tag = mapTypeToTag(node.type);
      const attributes = normalizeVueProps(node, props.onEvent);

      const children: any[] = (node.children ?? []).map(renderNode);

      // Handle slots
      if (node.slots) {
        Object.entries(node.slots).forEach(([_, slotValue]) => {
          const slotNodes = Array.isArray(slotValue) ? slotValue : [slotValue];
          slotNodes.forEach((slotNode) => {
            if (slotNode) children.push(renderNode(slotNode));
          });
        });
      }

      // Handle Text content
      if (node.type === "Text" && node.props?.text) {
        return h(tag, attributes, node.props.text);
      }

      return h(tag, attributes, children.length > 0 ? children : undefined);
    };

    return () => {
      const rootNode = "root" in props.schema ? props.schema.root : props.schema;
      return renderNode(rootNode);
    };
  }
});

function mapTypeToTag(type: string): string {
  switch (type) {
    case "Container":
    case "Row":
    case "Column":
    case "Grid":
      return "div";
    case "Text":
      return "span";
    case "Button":
      return "button";
    case "Input":
      return "input";
    case "Link":
      return "a";
    default:
      return "div";
  }
}

const ALLOWED_PROPS = new Set([
  "id",
  "style",
  "role",
  "tabIndex",
  "src",
  "href",
  "alt",
  "title",
  "placeholder",
  "value",
  "type",
  "disabled",
  "required",
  "readOnly",
  "name",
  "label"
]);

function normalizeVueProps(
  node: UISchemaNode,
  onEvent?: (name: string, params?: Record<string, unknown>) => void
) {
  const props = node.props ?? {};
  const normalized: Record<string, any> = {
    "data-uischema-type": node.type
  };

  if (props.className) {
    normalized.class = props.className;
  }

  for (const [key, value] of Object.entries(props)) {
    // ARIA mapping: camelCase to kebab-case
    if (key.startsWith("aria") && key.length > 4 && /[A-Z]/.test(key[4])) {
      const ariaKey = `aria-${key.slice(4).toLowerCase()}`;
      normalized[ariaKey] = value;
      continue;
    }

    if (key.startsWith("aria-") || key.startsWith("data-") || ALLOWED_PROPS.has(key)) {
      normalized[key] = value;
    }
  }

  // Event handling
  if (node.type === "Button" && onEvent) {
    normalized.onClick = () =>
      onEvent(node.events?.onClick?.name ?? "onClick", node.events?.onClick?.params);
  }

  return normalized;
}
