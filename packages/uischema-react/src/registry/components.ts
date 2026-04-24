import React from "react";
import type { UISchemaNode, UISchemaProps } from "@uischema/core";
import { normalizeProps } from "../utils/props";

export type UISchemaComponentProps = {
  node: UISchemaNode;
  children?: React.ReactNode;
  onEvent?: (name: string, params?: Record<string, unknown>) => void;
};

export type UISchemaComponent = (props: UISchemaComponentProps) => React.ReactElement | null;

const defaultRenderers: Record<string, UISchemaComponent> = {
  Container: ({ children, node }) =>
    React.createElement("div", { ...normalizeProps(node.props) }, children),
  Row: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        style: { display: "flex", flexDirection: "row", ...(node.props?.style ?? {}) }
      },
      children
    ),
  Column: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        style: { display: "flex", flexDirection: "column", ...(node.props?.style ?? {}) }
      },
      children
    ),
  Grid: ({ children, node }) =>
    React.createElement(
      "div",
      { ...normalizeProps(node.props), style: { display: "grid", ...(node.props?.style ?? {}) } },
      children
    ),
  Text: ({ node }) =>
    React.createElement("span", { ...normalizeProps(node.props) }, node.props?.text ?? ""),
  Button: ({ node, onEvent }) =>
    React.createElement(
      "button",
      {
        ...normalizeProps(node.props),
        onClick: () => onEvent?.(node.events?.onClick?.name ?? "onClick", node.events?.onClick?.params)
      },
      node.props?.text ?? "Button"
    ),
  Input: ({ node, onEvent }) => {
    const inputId = node.id ?? node.props?.id as string | undefined;
    const label = node.props?.label as string | undefined;
    const input = React.createElement("input", {
      ...normalizeProps(node.props),
      id: inputId,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value
        })
    });
    if (!label) return input;
    return React.createElement(
      "label",
      {},
      React.createElement("span", {}, label),
      input
    );
  },
  Textarea: ({ node, onEvent }) => {
    const inputId = node.id ?? node.props?.id as string | undefined;
    const label = node.props?.label as string | undefined;
    const textarea = React.createElement("textarea", {
      ...normalizeProps(node.props),
      id: inputId,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value
        })
    });
    if (!label) return textarea;
    return React.createElement(
      "label",
      {},
      React.createElement("span", {}, label),
      textarea
    );
  },
  Select: ({ node, onEvent }) => {
    const inputId = node.id ?? node.props?.id as string | undefined;
    const label = node.props?.label as string | undefined;
    const select = React.createElement("select", {
      ...normalizeProps(node.props),
      id: inputId,
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value
        })
    });
    if (!label) return select;
    return React.createElement(
      "label",
      {},
      React.createElement("span", {}, label),
      select
    );
  },
  Checkbox: ({ node, onEvent }) => {
    const inputId = node.id ?? node.props?.id as string | undefined;
    const label = node.props?.label as string | undefined;
    const checkbox = React.createElement("input", {
      ...normalizeProps(node.props),
      id: inputId,
      type: "checkbox",
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          checked: event.target.checked
        })
    });
    if (!label) return checkbox;
    return React.createElement(
      "label",
      {},
      checkbox,
      React.createElement("span", {}, label)
    );
  }
};

const registry = new Map<string, UISchemaComponent>(Object.entries(defaultRenderers));

export const registerComponent = (type: string, component: UISchemaComponent) => {
  registry.set(type, component);
};

export const getComponent = (type: string): UISchemaComponent | undefined => registry.get(type);

export const getRegistrySnapshot = () => Object.fromEntries(registry.entries());
