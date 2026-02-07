import React from "react";
import type { UISchemaDocument, UISchemaNode } from "@uischema/core";
import { getComponent } from "../registry/components";
import type { UISchemaComponentProps } from "../registry/components";
import { normalizeProps as normalizeUISchemaProps } from "../utils/props";

export type UISchemaRendererProps = {
  schema: UISchemaDocument | UISchemaNode;
  onEvent?: UISchemaComponentProps["onEvent"];
};

const normalizeProps = (node: UISchemaNode) => {
  return {
    ...normalizeUISchemaProps(node.props),
    "data-uischema-type": node.type
  };
};

const FallbackComponent = ({ node, children }: UISchemaComponentProps) =>
  React.createElement("div", normalizeProps(node), children);

const renderNode = (node: UISchemaNode, onEvent?: UISchemaComponentProps["onEvent"]) => {
  const Component = getComponent(node.type) ?? FallbackComponent;

  const childElements = (node.children ?? []).map((child, index) => (
    <React.Fragment key={child.key ?? child.id ?? index}>
      {renderNode(child, onEvent)}
    </React.Fragment>
  ));

  const slotElements = Object.entries(node.slots ?? {}).flatMap(([slotName, slotValue]) => {
    const slotNodes = Array.isArray(slotValue) ? slotValue : [slotValue];
    return slotNodes.map((slotNode, index) => (
      <React.Fragment key={`${slotName}-${slotNode.key ?? slotNode.id ?? index}`}>
        {renderNode(slotNode, onEvent)}
      </React.Fragment>
    ));
  });

  const children = [...childElements, ...slotElements];

  return <Component node={node} onEvent={onEvent}>{children.length ? children : undefined}</Component>;
};

export const UISchemaRenderer = ({ schema, onEvent }: UISchemaRendererProps) => {
  const node = "root" in schema ? schema.root : schema;
  return renderNode(node, onEvent);
};

export const renderUISchema = (schema: UISchemaDocument | UISchemaNode, onEvent?: UISchemaComponentProps["onEvent"]) => {
  const node = "root" in schema ? schema.root : schema;
  return renderNode(node, onEvent);
};
