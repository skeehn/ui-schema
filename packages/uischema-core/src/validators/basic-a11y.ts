import type { UISchemaNode } from "../types";

export type A11yIssue = {
  path: string;
  message: string;
};

const InteractiveTypes = new Set([
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

const RoleHints: Record<string, string> = {
  Button: "button",
  Link: "link",
  Input: "textbox",
  Textarea: "textbox",
  Select: "combobox",
  Checkbox: "checkbox",
  RadioGroup: "radiogroup",
  Switch: "switch",
  Slider: "slider"
};

const walk = (node: UISchemaNode, path: string, issues: A11yIssue[]) => {
  const props = node.props ?? {};

  if (InteractiveTypes.has(String(node.type))) {
    const ariaLabel = props.ariaLabel;
    if (typeof ariaLabel !== "string" || ariaLabel.trim().length === 0) {
      issues.push({
        path: `${path}.props.ariaLabel`,
        message: "Interactive components require a non-empty ariaLabel."
      });
    }
  }

  if (props.role && RoleHints[String(node.type)] && props.role !== RoleHints[String(node.type)]) {
    issues.push({
      path: `${path}.props.role`,
      message: `Role should be "${RoleHints[String(node.type)]}" for ${node.type}.`
    });
  }

  if (typeof props.tabIndex === "number" && props.tabIndex > 0) {
    issues.push({
      path: `${path}.props.tabIndex`,
      message: "Positive tabIndex is discouraged; prefer 0 or -1."
    });
  }

  node.children?.forEach((child, index) => walk(child, `${path}.children[${index}]`, issues));
  if (node.slots) {
    Object.entries(node.slots).forEach(([slotName, slotValue]) => {
      if (Array.isArray(slotValue)) {
        slotValue.forEach((child, index) =>
          walk(child, `${path}.slots.${slotName}[${index}]`, issues)
        );
      } else if (slotValue) {
        walk(slotValue, `${path}.slots.${slotName}`, issues);
      }
    });
  }
};

export const validateBasicA11y = (node: UISchemaNode): A11yIssue[] => {
  const issues: A11yIssue[] = [];
  walk(node, "root", issues);
  return issues;
};
