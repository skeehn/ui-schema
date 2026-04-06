import React from "react";
import type { UISchemaNode, UISchemaProps } from "@uischema/core";
import { normalizeProps } from "../utils/props";
import { defaultTokens } from "../styles/tokens";

export type UISchemaComponentProps = {
  node: UISchemaNode;
  children?: React.ReactNode;
  onEvent?: (name: string, params?: Record<string, unknown>) => void;
};

export type UISchemaComponent = (props: UISchemaComponentProps) => React.ReactElement | null;

// ─── Shared style helpers ─────────────────────────────────────────────────────

const t = defaultTokens;

const baseInputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: `${t.space.sm} ${t.space.md}`,
  fontSize: t.font.sizeBase,
  fontFamily: t.font.sans,
  lineHeight: t.font.lineHeight,
  color: t.colors.text,
  backgroundColor: t.colors.surface,
  border: `1px solid ${t.colors.border}`,
  borderRadius: t.radius.md,
  outline: "none",
  transition: `border-color ${t.transition}, box-shadow ${t.transition}`,
};

const focusStyle = `
  &:focus {
    border-color: ${t.colors.borderFocus};
    box-shadow: 0 0 0 3px ${t.colors.primary}22;
  }
`;

// ─── Default Renderers ────────────────────────────────────────────────────────

const defaultRenderers: Record<string, UISchemaComponent> = {
  Container: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          fontFamily: t.font.sans,
          color: t.colors.text,
          lineHeight: t.font.lineHeight,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children
    ),

  Row: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: t.space.md,
          flexWrap: "wrap",
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children
    ),

  Column: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          display: "flex",
          flexDirection: "column",
          gap: t.space.md,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children
    ),

  Grid: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          display: "grid",
          gap: t.space.md,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children
    ),

  Card: ({ children, node }) =>
    React.createElement(
      "div",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          backgroundColor: t.colors.surface,
          border: `1px solid ${t.colors.border}`,
          borderRadius: t.radius.lg,
          padding: t.space.lg,
          boxShadow: t.shadow.sm,
          display: "flex",
          flexDirection: "column",
          gap: t.space.sm,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children
    ),

  List: ({ children, node }) =>
    React.createElement(
      "ul",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: t.space.xs,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children
    ),

  ListItem: ({ children, node }) =>
    React.createElement(
      "li",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          padding: `${t.space.xs} ${t.space.sm}`,
          borderRadius: t.radius.sm,
          fontSize: t.font.sizeBase,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      children ?? node.props?.text ?? ""
    ),

  Text: ({ node }) => {
    const level = (node.props?.level as string) ?? "body";
    const levelMap: Record<string, { tag: string; style: React.CSSProperties }> = {
      h1: { tag: "h1", style: { fontSize: t.font.size3xl, fontWeight: t.font.weightBold, lineHeight: "1.2", margin: 0 } },
      h2: { tag: "h2", style: { fontSize: t.font.size2xl, fontWeight: t.font.weightBold, lineHeight: "1.25", margin: 0 } },
      h3: { tag: "h3", style: { fontSize: t.font.sizeXl, fontWeight: t.font.weightSemibold, lineHeight: "1.3", margin: 0 } },
      h4: { tag: "h4", style: { fontSize: t.font.sizeLg, fontWeight: t.font.weightSemibold, lineHeight: "1.4", margin: 0 } },
      h5: { tag: "h5", style: { fontSize: t.font.sizeBase, fontWeight: t.font.weightSemibold, margin: 0 } },
      h6: { tag: "h6", style: { fontSize: t.font.sizeSm, fontWeight: t.font.weightSemibold, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 } },
      caption: { tag: "span", style: { fontSize: t.font.sizeSm, color: t.colors.textMuted } },
      muted: { tag: "span", style: { color: t.colors.textMuted } },
      body: { tag: "span", style: { fontSize: t.font.sizeBase } },
    };
    const { tag, style: levelStyle } = levelMap[level] ?? levelMap.body;
    return React.createElement(
      tag,
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: { fontFamily: t.font.sans, ...levelStyle, ...(node.props?.style as React.CSSProperties ?? {}) },
      },
      node.props?.text ?? ""
    );
  },

  Image: ({ node }) =>
    React.createElement("img", {
      ...normalizeProps(node.props),
      "data-uischema-type": node.type,
      src: node.props?.src as string ?? "",
      alt: node.props?.alt as string ?? node.props?.ariaLabel as string ?? "",
      style: {
        maxWidth: "100%",
        height: "auto",
        borderRadius: t.radius.md,
        ...(node.props?.style as React.CSSProperties ?? {}),
      },
    }),

  Badge: ({ node }) => {
    const variant = (node.props?.variant as string) ?? "default";
    const variantColors: Record<string, { bg: string; color: string }> = {
      default: { bg: t.colors.badge, color: t.colors.badgeFg },
      success: { bg: "#dcfce7", color: "#166534" },
      warning: { bg: "#fef9c3", color: "#854d0e" },
      danger: { bg: "#fee2e2", color: "#991b1b" },
      primary: { bg: "#ede9fe", color: "#5b21b6" },
    };
    const { bg, color } = variantColors[variant] ?? variantColors.default;
    return React.createElement(
      "span",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          display: "inline-flex",
          alignItems: "center",
          padding: `2px ${t.space.sm}`,
          fontSize: t.font.sizeSm,
          fontWeight: t.font.weightMedium,
          fontFamily: t.font.sans,
          lineHeight: "1.5",
          borderRadius: t.radius.full,
          backgroundColor: bg,
          color,
          whiteSpace: "nowrap",
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      node.props?.text ?? ""
    );
  },

  Divider: ({ node }) =>
    React.createElement("hr", {
      ...normalizeProps(node.props),
      "data-uischema-type": node.type,
      style: {
        border: "none",
        borderTop: `1px solid ${t.colors.border}`,
        margin: `${t.space.md} 0`,
        ...(node.props?.style as React.CSSProperties ?? {}),
      },
    }),

  Spacer: ({ node }) =>
    React.createElement("div", {
      ...normalizeProps(node.props),
      "data-uischema-type": node.type,
      style: {
        flex: 1,
        minHeight: t.space.md,
        ...(node.props?.style as React.CSSProperties ?? {}),
      },
    }),

  Button: ({ node, onEvent }) => {
    const variant = (node.props?.variant as string) ?? "primary";
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: t.colors.primary,
        color: t.colors.primaryFg,
        border: "none",
      },
      secondary: {
        backgroundColor: "transparent",
        color: t.colors.text,
        border: `1px solid ${t.colors.border}`,
      },
      ghost: {
        backgroundColor: "transparent",
        color: t.colors.primary,
        border: "none",
      },
      danger: {
        backgroundColor: t.colors.danger,
        color: "#ffffff",
        border: "none",
      },
    };
    const vStyle = variantStyles[variant] ?? variantStyles.primary;
    return React.createElement(
      "button",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        disabled: node.props?.disabled as boolean ?? false,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: t.space.xs,
          padding: `${t.space.sm} ${t.space.md}`,
          fontSize: t.font.sizeBase,
          fontWeight: t.font.weightMedium,
          fontFamily: t.font.sans,
          lineHeight: "1",
          borderRadius: t.radius.md,
          cursor: "pointer",
          transition: `background-color ${t.transition}, opacity ${t.transition}, box-shadow ${t.transition}`,
          whiteSpace: "nowrap",
          ...vStyle,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
        onClick: () => onEvent?.(node.events?.onClick?.name ?? "onClick", node.events?.onClick?.params),
      },
      node.props?.text ?? "Button"
    );
  },

  Link: ({ node, onEvent, children }) =>
    React.createElement(
      "a",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        href: node.props?.href as string ?? "#",
        style: {
          color: t.colors.primary,
          textDecoration: "underline",
          textDecorationColor: `${t.colors.primary}66`,
          fontFamily: t.font.sans,
          cursor: "pointer",
          transition: `color ${t.transition}`,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
        onClick: (e: React.MouseEvent) => {
          if (!node.props?.href) e.preventDefault();
          onEvent?.(node.events?.onClick?.name ?? "onClick", node.events?.onClick?.params);
        },
      },
      children ?? node.props?.text ?? ""
    ),

  Input: ({ node, onEvent }) =>
    React.createElement("input", {
      ...normalizeProps(node.props),
      "data-uischema-type": node.type,
      type: node.props?.type as string ?? "text",
      placeholder: node.props?.placeholder as string ?? "",
      disabled: node.props?.disabled as boolean ?? false,
      required: node.props?.required as boolean ?? false,
      style: { ...baseInputStyle, ...(node.props?.style as React.CSSProperties ?? {}) },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value,
        }),
    }),

  Textarea: ({ node, onEvent }) =>
    React.createElement("textarea", {
      ...normalizeProps(node.props),
      "data-uischema-type": node.type,
      placeholder: node.props?.placeholder as string ?? "",
      disabled: node.props?.disabled as boolean ?? false,
      rows: node.props?.rows as number ?? 4,
      style: {
        ...baseInputStyle,
        resize: "vertical" as const,
        minHeight: "80px",
        ...(node.props?.style as React.CSSProperties ?? {}),
      },
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: event.target.value,
        }),
    }),

  Select: ({ node, onEvent, children }) =>
    React.createElement(
      "select",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        disabled: node.props?.disabled as boolean ?? false,
        style: {
          ...baseInputStyle,
          cursor: "pointer",
          appearance: "none" as const,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: "36px",
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
          onEvent?.(node.events?.onChange?.name ?? "onChange", {
            ...(node.events?.onChange?.params ?? {}),
            value: event.target.value,
          }),
      },
      children
    ),

  Checkbox: ({ node, onEvent }) =>
    React.createElement(
      "label",
      {
        "data-uischema-type": node.type,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: t.space.sm,
          fontSize: t.font.sizeBase,
          fontFamily: t.font.sans,
          cursor: "pointer",
          color: t.colors.text,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      React.createElement("input", {
        type: "checkbox",
        disabled: node.props?.disabled as boolean ?? false,
        style: {
          width: "16px",
          height: "16px",
          accentColor: t.colors.primary,
          cursor: "pointer",
        },
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          onEvent?.(node.events?.onChange?.name ?? "onChange", {
            ...(node.events?.onChange?.params ?? {}),
            checked: event.target.checked,
          }),
      }),
      node.props?.label as string ?? node.props?.text as string ?? ""
    ),

  Switch: ({ node, onEvent }) =>
    React.createElement(
      "label",
      {
        "data-uischema-type": node.type,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: t.space.sm,
          cursor: "pointer",
          fontFamily: t.font.sans,
          fontSize: t.font.sizeBase,
          color: t.colors.text,
        },
      },
      React.createElement("input", {
        type: "checkbox",
        role: "switch",
        style: {
          width: "36px",
          height: "20px",
          appearance: "none" as const,
          backgroundColor: t.colors.border,
          borderRadius: t.radius.full,
          cursor: "pointer",
          position: "relative" as const,
          transition: `background-color ${t.transition}`,
        },
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          event.target.style.backgroundColor = event.target.checked ? t.colors.primary : t.colors.border;
          onEvent?.(node.events?.onChange?.name ?? "onChange", {
            ...(node.events?.onChange?.params ?? {}),
            checked: event.target.checked,
          });
        },
      }),
      node.props?.label as string ?? node.props?.text as string ?? ""
    ),

  RadioGroup: ({ node, onEvent, children }) =>
    React.createElement(
      "fieldset",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          border: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: t.space.sm,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      node.props?.label
        ? React.createElement(
            "legend",
            {
              style: {
                fontSize: t.font.sizeSm,
                fontWeight: t.font.weightMedium,
                color: t.colors.textMuted,
                marginBottom: t.space.xs,
                fontFamily: t.font.sans,
              },
            },
            node.props.label as string
          )
        : null,
      children
    ),

  Slider: ({ node, onEvent }) =>
    React.createElement("input", {
      ...normalizeProps(node.props),
      "data-uischema-type": node.type,
      type: "range",
      min: node.props?.min as number ?? 0,
      max: node.props?.max as number ?? 100,
      step: node.props?.step as number ?? 1,
      style: {
        width: "100%",
        accentColor: t.colors.primary,
        cursor: "pointer",
        ...(node.props?.style as React.CSSProperties ?? {}),
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onEvent?.(node.events?.onChange?.name ?? "onChange", {
          ...(node.events?.onChange?.params ?? {}),
          value: Number(event.target.value),
        }),
    }),

  Form: ({ children, node, onEvent }) =>
    React.createElement(
      "form",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        style: {
          display: "flex",
          flexDirection: "column",
          gap: t.space.md,
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
        onSubmit: (event: React.FormEvent) => {
          event.preventDefault();
          onEvent?.(node.events?.onSubmit?.name ?? "onSubmit", node.events?.onSubmit?.params);
        },
      },
      children
    ),

  Icon: ({ node }) =>
    React.createElement(
      "span",
      {
        ...normalizeProps(node.props),
        "data-uischema-type": node.type,
        role: "img",
        "aria-label": node.props?.ariaLabel as string ?? node.props?.name as string ?? "icon",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1em",
          height: "1em",
          fontSize: node.props?.size as string ?? "1.25em",
          ...(node.props?.style as React.CSSProperties ?? {}),
        },
      },
      node.props?.text ?? "◆"
    ),
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<string, UISchemaComponent>(Object.entries(defaultRenderers));

export const registerComponent = (type: string, component: UISchemaComponent) => {
  registry.set(type, component);
};

export const getComponent = (type: string): UISchemaComponent | undefined => registry.get(type);

export const getRegistrySnapshot = () => Object.fromEntries(registry.entries());
