import type {
  UISchemaDocument,
  UISchemaNode,
  UISchemaComponentType,
  UISchemaProps,
  UISchemaEvent,
  UISchemaBinding,
  UISchemaMeta,
} from "./types";

/**
 * Fluent builder for type-safe UISchema construction.
 *
 * @example
 * ```ts
 * import { schema, node } from '@uischema/core';
 *
 * const ui = schema()
 *   .root(
 *     node('Container')
 *       .children([
 *         node('Text').props({ text: 'Hello', level: 'h1' }),
 *         node('Button')
 *           .props({ text: 'Submit', ariaLabel: 'Submit form', variant: 'primary' })
 *           .on('onClick', { type: 'action', name: 'handleSubmit' }),
 *       ])
 *   )
 *   .meta({ name: 'My UI', description: 'Generated with builder API' })
 *   .build();
 * ```
 */

export class UISchemaNodeBuilder {
  private _node: UISchemaNode;

  constructor(type: UISchemaComponentType) {
    this._node = { type };
  }

  /** Set props (merged with existing) */
  props(props: UISchemaProps): this {
    this._node.props = { ...this._node.props, ...props };
    return this;
  }

  /** Set explicit id */
  id(id: string): this {
    this._node.id = id;
    return this;
  }

  /** Set explicit key (for list rendering) */
  key(key: string): this {
    this._node.key = key;
    return this;
  }

  /** Set children (accepts builders or plain nodes) */
  children(children: Array<UISchemaNodeBuilder | UISchemaNode>): this {
    this._node.children = children.map((c) =>
      c instanceof UISchemaNodeBuilder ? c.build() : c
    );
    return this;
  }

  /** Add a single child */
  child(child: UISchemaNodeBuilder | UISchemaNode): this {
    if (!this._node.children) this._node.children = [];
    this._node.children.push(child instanceof UISchemaNodeBuilder ? child.build() : child);
    return this;
  }

  /** Register a named event handler */
  on(eventName: string, event: UISchemaEvent): this {
    if (!this._node.events) this._node.events = {};
    this._node.events[eventName] = event;
    return this;
  }

  /** Add a data binding */
  bind(propName: string, binding: UISchemaBinding): this {
    if (!this._node.bindings) this._node.bindings = {};
    this._node.bindings[propName] = binding;
    return this;
  }

  /** Set slots */
  slots(slots: Record<string, UISchemaNodeBuilder | UISchemaNode | Array<UISchemaNodeBuilder | UISchemaNode>>): this {
    this._node.slots = {};
    for (const [key, value] of Object.entries(slots)) {
      if (Array.isArray(value)) {
        this._node.slots[key] = value.map((v) =>
          v instanceof UISchemaNodeBuilder ? v.build() : v
        );
      } else {
        this._node.slots[key] = value instanceof UISchemaNodeBuilder ? value.build() : value;
      }
    }
    return this;
  }

  /** Set metadata */
  meta(meta: UISchemaMeta): this {
    this._node.meta = meta;
    return this;
  }

  /** Set extension data */
  ext(ext: Record<string, unknown>): this {
    this._node.ext = ext;
    return this;
  }

  /** Build and return the plain UISchemaNode */
  build(): UISchemaNode {
    return { ...this._node };
  }
}

export class UISchemaDocumentBuilder {
  private _root?: UISchemaNode;
  private _meta?: UISchemaMeta;
  private _version = "0.1.0";

  /** Set the root node (accepts builder or plain node) */
  root(rootNode: UISchemaNodeBuilder | UISchemaNode): this {
    this._root = rootNode instanceof UISchemaNodeBuilder ? rootNode.build() : rootNode;
    return this;
  }

  /** Set schema metadata */
  meta(meta: UISchemaMeta): this {
    this._meta = meta;
    return this;
  }

  /** Set schema version (default: "0.1.0") */
  version(v: string): this {
    this._version = v;
    return this;
  }

  /** Build the complete UISchemaDocument */
  build(): UISchemaDocument {
    if (!this._root) {
      throw new Error("UISchemaDocumentBuilder: root node is required. Call .root() before .build()");
    }
    const doc: UISchemaDocument = {
      schemaVersion: this._version,
      root: this._root,
    };
    if (this._meta) doc.meta = this._meta;
    return doc;
  }
}

/**
 * Start building a UISchemaDocument.
 *
 * @example
 * const doc = schema().root(node('Container').children([...])).build();
 */
export const schema = (): UISchemaDocumentBuilder => new UISchemaDocumentBuilder();

/**
 * Start building a UISchemaNode of the given component type.
 *
 * @example
 * const btn = node('Button').props({ text: 'Submit', ariaLabel: 'Submit' });
 */
export const node = (type: UISchemaComponentType): UISchemaNodeBuilder =>
  new UISchemaNodeBuilder(type);
