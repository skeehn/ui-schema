import React from "react";
import type { UISchemaNode, UISchemaProps } from "@uischema/core";

export type UISchemaComponentProps = {
  node: UISchemaNode;
  children?: React.ReactNode;
  onEvent?: (name: string, params?: Record<string, unknown>) => void;
};

export type UISchemaComponent = (props: UISchemaComponentProps) => React.ReactElement | null;

const normalizeProps = (props?: UISchemaProps) => {
  if (!props) {
    return undefined;
  }
  const { ariaLabel, ...rest } = props;
  return ariaLabel ? { ...rest, "aria-label": ariaLabel } : rest;
};

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
  Input: ({ node, onEvent }) =>
    React.createElement("input", {
      ...normalizeProps(node.props),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value
        })
    }),
  Textarea: ({ node, onEvent }) =>
    React.createElement("textarea", {
      ...normalizeProps(node.props),
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value
        })
    }),
  Select: ({ node, onEvent }) =>
    React.createElement("select", {
      ...normalizeProps(node.props),
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value
        })
    }),
  Checkbox: ({ node, onEvent }) =>
    React.createElement("input", {
      ...normalizeProps(node.props),
      type: "checkbox",
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          checked: event.target.checked
        })
    })
};

const registry = new Map<string, UISchemaComponent>(Object.entries(defaultRenderers));

export const registerComponent = (type: string, component: UISchemaComponent) => {
  registry.set(type, component);
};

export const getComponent = (type: string): UISchemaComponent | undefined => registry.get(type);

export const getRegistrySnapshot = () => Object.fromEntries(registry.entries());
