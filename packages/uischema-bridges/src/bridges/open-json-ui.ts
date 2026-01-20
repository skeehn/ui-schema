import type { UISchemaNode, UISchemaDocument } from "@uischema/core";

/**
 * Open-JSON-UI component structure
 * Based on OpenAI's open standardization of declarative Generative UI
 */
export type OpenJSONUIComponent = {
  id?: string;
  type: string;
  properties?: Record<string, unknown>;
  children?: OpenJSONUIComponent[];
  style?: Record<string, unknown>;
};

export type OpenJSONUIDocument = {
  version?: string;
  components: OpenJSONUIComponent[];
};

/**
 * Maps Open-JSON-UI component type to UISchema component type
 */
const TYPE_MAP: Record<string, string> = {
  container: "Container",
  card: "Card",
  text: "Text",
  button: "Button",
  input: "Input",
  textarea: "Textarea",
  select: "Select",
  checkbox: "Checkbox",
  image: "Image",
  link: "Link",
  list: "List",
  "list-item": "ListItem",
  grid: "Grid",
  row: "Row",
  column: "Column"
};

/**
 * Convert Open-JSON-UI component to UISchema node
 */
export const fromOpenJSONUI = (component: OpenJSONUIComponent): UISchemaNode => {
  const uischemaType = TYPE_MAP[component.type] ?? (`custom:${component.type}` as any);

  const props: Record<string, unknown> = {
    ...(component.properties ?? {})
  };

  // Map common properties
  if (component.properties?.title) {
    props.text = component.properties.title;
  }
  if (component.properties?.label) {
    props.text = component.properties.label;
  }
  if (component.properties?.href) {
    props.href = component.properties.href as string;
  }
  if (component.properties?.src) {
    props.src = component.properties.src as string;
  }

  // Merge style into props
  if (component.style) {
    props.style = component.style;
  }

  // Ensure ariaLabel for interactive components
  const interactiveTypes = ["Button", "Input", "Textarea", "Select", "Checkbox", "Link"];
  if (interactiveTypes.includes(uischemaType) && !props.ariaLabel && props.text) {
    props.ariaLabel = String(props.text);
  }

  return {
    id: component.id,
    type: uischemaType as any,
    props: Object.keys(props).length > 0 ? props : undefined,
    children: component.children?.map(fromOpenJSONUI)
  };
};

/**
 * Convert Open-JSON-UI document to UISchema document
 */
export const fromOpenJSONUIDocument = (doc: OpenJSONUIDocument): UISchemaDocument => {
  if (doc.components.length === 0) {
    throw new Error("Open-JSON-UI document must have at least one component");
  }

  // If single component, use it as root; otherwise wrap in Container
  const root =
    doc.components.length === 1
      ? fromOpenJSONUI(doc.components[0])
      : {
          type: "Container" as const,
          props: { ariaLabel: "Root container" },
          children: doc.components.map(fromOpenJSONUI)
        };

  return {
    schemaVersion: doc.version,
    root
  };
};

/**
 * Convert UISchema node to Open-JSON-UI component
 */
export const toOpenJSONUI = (node: UISchemaNode): OpenJSONUIComponent => {
  const reverseTypeMap: Record<string, string> = Object.fromEntries(
    Object.entries(TYPE_MAP).map(([k, v]) => [v, k])
  );

  const openType = reverseTypeMap[node.type] ?? node.type.replace(/^custom:/, "");

  const properties: Record<string, unknown> = {
    ...(node.props ?? {})
  };

  // Extract style if present
  if (properties.style) {
    // Style will be handled separately
  }

  // Map text to title/label based on component type
  if (properties.text) {
    if (["Button", "Link"].includes(node.type)) {
      properties.label = properties.text;
    } else {
      properties.title = properties.text;
    }
    delete properties.text;
  }

  return {
    id: node.id,
    type: openType,
    properties: Object.keys(properties).length > 0 ? properties : undefined,
    style: node.props?.style as Record<string, unknown> | undefined,
    children: node.children?.map(toOpenJSONUI)
  };
};

/**
 * Convert UISchema document to Open-JSON-UI document
 */
export const toOpenJSONUIDocument = (doc: UISchemaDocument): OpenJSONUIDocument => {
  // If root is Container with single purpose, extract children; otherwise use root
  const components =
    doc.root.type === "Container" && doc.root.children
      ? doc.root.children.map(toOpenJSONUI)
      : [toOpenJSONUI(doc.root)];

  return {
    version: doc.schemaVersion,
    components
  };
};
