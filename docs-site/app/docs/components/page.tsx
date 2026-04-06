import { UISchemaRenderer } from '@uischema/react';
import type { UISchemaNode } from '@uischema/core';

type ComponentEntry = {
  type: string;
  category: string;
  description: string;
  example: UISchemaNode;
};

const COMPONENTS: ComponentEntry[] = [
  // ── Layout ─────────────────────────────────────────────────────────────────
  {
    type: 'Container',
    category: 'Layout',
    description: 'Generic flex container. The root of most UISchema documents.',
    example: {
      type: 'Container',
      props: { ariaLabel: 'Example container', style: { padding: '12px', background: '#f8fafc', borderRadius: '8px' } },
      children: [{ type: 'Text', props: { text: 'Container content' } }],
    },
  },
  {
    type: 'Row',
    category: 'Layout',
    description: 'Horizontal flex row with auto gap.',
    example: {
      type: 'Row',
      children: [
        { type: 'Badge', props: { text: 'One', variant: 'primary' } },
        { type: 'Badge', props: { text: 'Two', variant: 'success' } },
        { type: 'Badge', props: { text: 'Three', variant: 'warning' } },
      ],
    },
  },
  {
    type: 'Column',
    category: 'Layout',
    description: 'Vertical flex column with auto gap.',
    example: {
      type: 'Column',
      children: [
        { type: 'Text', props: { text: 'First item' } },
        { type: 'Text', props: { text: 'Second item' } },
      ],
    },
  },
  {
    type: 'Card',
    category: 'Layout',
    description: 'Bordered, shadowed surface for grouping content.',
    example: {
      type: 'Card',
      props: { ariaLabel: 'Example card' },
      children: [
        { type: 'Text', props: { text: 'Card title', level: 'h4' } },
        { type: 'Text', props: { text: 'Card body text with supporting detail.', level: 'caption' } },
      ],
    },
  },
  // ── Display ────────────────────────────────────────────────────────────────
  {
    type: 'Text',
    category: 'Display',
    description: 'Semantic text with heading levels (h1–h6), body, caption, muted.',
    example: {
      type: 'Column',
      children: [
        { type: 'Text', props: { text: 'Heading', level: 'h3' } },
        { type: 'Text', props: { text: 'Body text for supporting info.' } },
        { type: 'Text', props: { text: 'Caption / metadata text', level: 'caption' } },
      ],
    },
  },
  {
    type: 'Badge',
    category: 'Display',
    description: 'Colored status pill. Variants: default, success, warning, danger, primary.',
    example: {
      type: 'Row',
      children: [
        { type: 'Badge', props: { text: 'Default' } },
        { type: 'Badge', props: { text: 'Success', variant: 'success' } },
        { type: 'Badge', props: { text: 'Warning', variant: 'warning' } },
        { type: 'Badge', props: { text: 'Danger', variant: 'danger' } },
        { type: 'Badge', props: { text: 'Primary', variant: 'primary' } },
      ],
    },
  },
  {
    type: 'Divider',
    category: 'Display',
    description: 'Horizontal separator line.',
    example: {
      type: 'Column',
      children: [
        { type: 'Text', props: { text: 'Above the line' } },
        { type: 'Divider' },
        { type: 'Text', props: { text: 'Below the line' } },
      ],
    },
  },
  // ── Input ──────────────────────────────────────────────────────────────────
  {
    type: 'Button',
    category: 'Action',
    description: 'Clickable action. Variants: primary, secondary, ghost, danger.',
    example: {
      type: 'Row',
      children: [
        { type: 'Button', props: { text: 'Primary', ariaLabel: 'Primary', variant: 'primary' } },
        { type: 'Button', props: { text: 'Secondary', ariaLabel: 'Secondary', variant: 'secondary' } },
        { type: 'Button', props: { text: 'Ghost', ariaLabel: 'Ghost', variant: 'ghost' } },
        { type: 'Button', props: { text: 'Danger', ariaLabel: 'Danger', variant: 'danger' } },
      ],
    },
  },
  {
    type: 'Input',
    category: 'Input',
    description: 'Text input. Supports type: text, email, password, number.',
    example: {
      type: 'Column',
      children: [
        { type: 'Input', props: { placeholder: 'Email address', type: 'email', ariaLabel: 'Email' } },
        { type: 'Input', props: { placeholder: 'Password', type: 'password', ariaLabel: 'Password' } },
      ],
    },
  },
  {
    type: 'Textarea',
    category: 'Input',
    description: 'Multi-line text input.',
    example: {
      type: 'Textarea',
      props: { placeholder: 'Enter your message...', ariaLabel: 'Message', rows: 3 },
    },
  },
  {
    type: 'Select',
    category: 'Input',
    description: 'Dropdown select input.',
    example: {
      type: 'Select',
      props: { ariaLabel: 'Choose option' },
      children: [
        { type: 'Text', props: { text: 'Option A', value: 'a' } },
        { type: 'Text', props: { text: 'Option B', value: 'b' } },
      ],
    },
  },
  {
    type: 'Checkbox',
    category: 'Input',
    description: 'Boolean toggle with label.',
    example: {
      type: 'Checkbox',
      props: { label: 'Accept terms and conditions', ariaLabel: 'Accept terms' },
    },
  },
  {
    type: 'Switch',
    category: 'Input',
    description: 'Toggle switch (on/off).',
    example: {
      type: 'Switch',
      props: { label: 'Enable notifications', ariaLabel: 'Enable notifications' },
    },
  },
  {
    type: 'Slider',
    category: 'Input',
    description: 'Range slider.',
    example: {
      type: 'Slider',
      props: { min: 0, max: 100, step: 10, ariaLabel: 'Volume' },
    },
  },
];

const CATEGORIES = ['Layout', 'Display', 'Action', 'Input'];

export default function ComponentCatalogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Component Catalog</h1>
      <p className="text-muted-foreground mb-8">
        All 23 core UISchema component types with live rendered examples. Extend with{' '}
        <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">x-</code> and{' '}
        <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">custom:</code> prefixes.
      </p>

      {CATEGORIES.map((category) => {
        const items = COMPONENTS.filter((c) => c.category === category);
        return (
          <section key={category} className="mb-12">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground uppercase tracking-wide text-sm">
              {category}
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.type}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
                    <code className="font-mono font-semibold text-sm text-foreground">{item.type}</code>
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  </div>
                  <div className="px-4 py-4">
                    <UISchemaRenderer schema={item.example} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-8 p-4 bg-muted/30 rounded-lg">
        <h2 className="font-semibold mb-2">Custom Components</h2>
        <p className="text-sm text-muted-foreground">
          Register your own components using the{' '}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">registerComponent(type, component)</code>{' '}
          API and reference them in your schema with{' '}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">x-my-component</code> or{' '}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">custom:namespace:name</code>.
        </p>
      </section>
    </div>
  );
}
