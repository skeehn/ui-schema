# UISchema

> The Elysia of Generative UI — fast, type-safe, token-efficient, and ergonomic. The standard for AI-generated interfaces.

[![npm](https://img.shields.io/npm/v/@uischema/core?label=npm&color=6366f1)](https://www.npmjs.com/package/@uischema/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e)](./LICENSE)
[![Open Source](https://img.shields.io/badge/open--source-yes-f59e0b)](#)

UISchema is a formal, framework-agnostic **Generative UI IR** — the schema standard + streaming protocol for building AI-generated interfaces in real time. It gives AI models a precise vocabulary to describe UIs, and gives your app a reliable way to render them.

Think of it as the **intermediate representation** between an AI prompt and rendered components:

```
User prompt → AI model → UISchema JSON → Your renderer → Rendered UI
```

**3-5x fewer tokens** than raw HTML. **Streaming-first** via JSONL patches. **Type-safe** end to end.

---

## Quickstart (30 seconds)

```bash
# Scaffold a new project instantly
npx @uischema/cli@latest init my-app
cd my-app && npm install && npm run dev
```

Or drop into an existing React/Next.js project:

```bash
npm install @uischema/core @uischema/react
```

```tsx
import { UISchemaRenderer } from '@uischema/react';

export default function Page() {
  return (
    <UISchemaRenderer
      schema={{
        schemaVersion: '0.1.0',
        root: {
          type: 'Container',
          props: { ariaLabel: 'Demo' },
          children: [
            { type: 'Text', props: { text: 'Hello, UISchema!' } },
            { type: 'Button', props: { text: 'Click me', ariaLabel: 'Primary action' } },
          ],
        },
      }}
      onEvent={(name, params) => console.log(name, params)}
    />
  );
}
```

**That's it.** The AI generates the JSON; UISchema renders it.

---

## Why UISchema?

| | UISchema | Raw HTML/JSX from AI | Prompt Kit / AI UI |
|--|--|--|--|
| Token efficiency | **3-5x fewer** | Baseline | ~1.5x |
| Streaming | **JSONL patches** | Full rerenders | String chunks |
| Type safety | **Full (Zod + TS)** | None | Partial |
| Accessibility | **Schema-level constraints** | Optional | Manual |
| Agent-friendly | **Yes (bus + MCP)** | No | No |
| Framework | **React, Vue, DOM** | Framework-specific | React only |

---

## Features

- **Token-Efficient** — 3-5x token reduction via CFG compressed shorthand
- **Streaming-First** — `useUIStream` hook + JSONL patch protocol for progressive rendering
- **Type-Safe** — Strict TypeScript throughout; Zod validators; full inference
- **Beautiful Defaults** — Styled component registry with design tokens; zero config
- **23 Core Components** — Layout, Display, Input, Action — extensible via `x-` and `custom:` prefixes
- **Accessibility Built-In** — Schema-level `ariaLabel` constraints; WCAG preflight
- **Multi-Provider AI** — OpenAI, Anthropic, OpenRouter, Vercel AI SDK — all supported
- **Agent Bus** — `UISchemaEventBus` for pub/sub agent↔UI communication
- **Bridges** — Open-JSON-UI, AG-UI, MCP Apps interoperability
- **CLI** — `validate`, `preview`, `init`, `generate` commands with beautiful output

---

## Core Concepts

### Schema Structure

```json
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": { "ariaLabel": "Dashboard" },
    "children": [
      { "type": "Card", "props": { "ariaLabel": "Metrics card" },
        "children": [
          { "type": "Text", "props": { "text": "Revenue", "level": "h3" } },
          { "type": "Text", "props": { "text": "$48,295" } }
        ]
      },
      { "type": "Button", "props": { "text": "Refresh", "ariaLabel": "Refresh data" },
        "events": { "onClick": { "type": "action", "name": "refreshData" } }
      }
    ]
  }
}
```

### Streaming (Real-Time AI)

```tsx
import { useUIStream } from '@uischema/react';

function AIGeneratedUI() {
  const { schema, loading } = useUIStream({
    endpoint: '/api/generate-ui',
    initialSchema: skeletonNode,
  });

  return loading
    ? <Skeleton />
    : <UISchemaRenderer schema={schema} onEvent={handleEvent} />;
}
```

### Builder API (Type-Safe)

```ts
import { schema, node } from '@uischema/core';

const ui = schema()
  .root(
    node('Container')
      .children([
        node('Text').props({ text: 'Hello' }),
        node('Button').props({ text: 'Go', ariaLabel: 'Primary action' })
          .on('onClick', { type: 'action', name: 'navigate' }),
      ])
  )
  .build();
```

### Agent Event Bus

```ts
import { createEventBus } from '@uischema/protocol';

const bus = createEventBus();

// AI agent publishes UI updates
bus.emit({ type: 'ui.update', payload: { node: generatedNode } });

// App subscribes to interactions
bus.on('ui.interaction', ({ payload }) => {
  console.log('User clicked:', payload.eventName);
});
```

### Generate from Prompt

```ts
import { generateUISchema } from '@uischema/react/ai';

const schema = await generateUISchema('A login form with email and password', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
});
```

---

## Component Types

### Layout
| Type | Description |
|------|-------------|
| `Container` | Generic flex container |
| `Row` | Horizontal flex row |
| `Column` | Vertical flex column |
| `Grid` | CSS grid container |
| `Card` | Bordered, shadowed surface |
| `List` | Ordered/unordered list |
| `ListItem` | List item |

### Display
| Type | Description |
|------|-------------|
| `Text` | Text with semantic level (h1–h6, body, caption) |
| `Image` | Responsive image |
| `Icon` | Icon from registry |
| `Badge` | Colored status pill |
| `Divider` | Horizontal rule |
| `Spacer` | Flexible space |

### Input
| Type | Description |
|------|-------------|
| `Input` | Text/email/password/number input |
| `Textarea` | Multi-line text |
| `Select` | Dropdown select |
| `Checkbox` | Boolean toggle |
| `RadioGroup` | Single-choice group |
| `Switch` | Toggle switch |
| `Slider` | Range slider |

### Action
| Type | Description |
|------|-------------|
| `Button` | Clickable action |
| `Link` | Navigation link |
| `Form` | Form wrapper with submit |

### Extensibility
```json
{ "type": "x-my-chart", "props": { "data": [...] } }
{ "type": "custom:ds:DataTable", "props": { "columns": [...] } }
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@uischema/core` | Schema definition, Zod validators, TypeScript types, builder API |
| `@uischema/react` | React adapter: `UISchemaRenderer`, `useUIStream`, `generateUISchema` |
| `@uischema/compressed` | CFG shorthand parser for 3-5x token reduction |
| `@uischema/protocol` | JSONL patches, events, `UISchemaEventBus` |
| `@uischema/bridges` | Open-JSON-UI, AG-UI, MCP Apps bridges |
| `@uischema/cli` | CLI: `init`, `validate`, `preview`, `generate` |

---

## For AI Agents

UISchema is designed to be trivially discoverable and usable by AI coding agents.

**One-liner to understand this codebase:**
```
This is UISchema — a JSON schema + streaming protocol for AI-generated UI components.
AI models output UISchema JSON; apps render it with UISchemaRenderer.
See llms.txt for the full machine-readable spec.
```

**Key entry points:**
- `packages/uischema-core/src/types.ts` — all TypeScript types
- `packages/uischema-core/schema/uischema.json` — JSON Schema definition
- `packages/uischema-react/src/index.ts` — React adapter public API
- `packages/uischema-protocol/src/bus.ts` — event bus for agent↔UI communication

**To generate UISchema from a prompt:** call `POST /api/generate` with `{ "prompt": "..." }`.

**See also:** [`llms.txt`](./llms.txt) for the full machine-readable project spec.

---

## CLI

```bash
# Scaffold a new UISchema project
npx @uischema/cli init my-project

# Validate a schema file
npx @uischema/cli validate ./uischema.json

# Start interactive preview server
npx @uischema/cli preview

# Generate schema from a prompt (requires OPENAI_API_KEY or ANTHROPIC_API_KEY)
npx @uischema/cli generate "a login form with email and password"
```

---

## Development

```bash
# Clone and install
git clone https://github.com/skeehn/ui-schema
cd ui-schema
npm install

# Build all packages
npm run build

# Type check
npm run type-check

# Lint (Biome)
npm run lint

# Unit tests (Vitest)
npm run test:unit

# AI integration tests (requires API key in .env)
npm run test:openai

# Start docs site
cd docs-site && npm install && npm run dev
```

---

## Architecture

```
User Prompt
    ↓
AI Model (OpenAI / Anthropic / any)
    ↓
UISchema JSON (3-5x fewer tokens than HTML)
    ↓
┌──────────────────────────────────────────┐
│  Protocol Layer (JSONL patches + events) │
│  ← streaming patches progressively →    │
└──────────────────────────────────────────┘
    ↓
React Renderer / Vue / DOM
    ↓
Rendered UI components
```

**5-Layer Architecture:**
1. **Compressed** — CFG shorthand → full schema (3-5x token reduction)
2. **Core** — Schema definition, types, validators, builder
3. **Bridges** — Open-JSON-UI, AG-UI, MCP Apps interoperability
4. **Protocol** — JSONL patches, events, state, event bus
5. **Runtime** — React adapter (Vue & DOM adapters available)

Full architecture details: [docs/architecture.md](./docs/architecture.md)

---

## Examples

- [Hello World](./examples/hello-world/) — Basic schema with Container, Text, Button
- [Next.js + Vercel AI SDK](./examples/nextjs-vercel-ai-sdk/) — Full production example
- [OpenAI Integration](./examples/test-openai-real.js) — Direct OpenAI API usage
- [Anthropic Integration](./examples/test-anthropic-real.js) — Anthropic Claude usage

---

## Interoperability

- [Open-JSON-UI](./docs/open-json-ui-mapping.md) — Bidirectional bridge
- [AG-UI Protocol](./docs/ag-ui-mapping.md) — Agent-generated UI compatibility
- [MCP Apps](./docs/mcp-apps-mapping.md) — Model Context Protocol integration

---

## Roadmap

### v1.0 (Current — Stable)
- ✅ Core schema (23 component types + extensions)
- ✅ Compressed representation (3-5x token reduction)
- ✅ Spec bridges (Open-JSON-UI, AG-UI, MCP Apps)
- ✅ Streaming protocol (JSONL patches + `useUIStream`)
- ✅ React adapter + styled defaults
- ✅ Agent event bus (`UISchemaEventBus`)
- ✅ Builder API (fluent, type-safe)
- ✅ CLI (`init`, `validate`, `preview`, `generate`)
- ✅ Vitest unit tests
- ✅ Biome linting
- ✅ Docs site with live playground

### v1.1 (Next)
- Full WCAG 2.1 engine (automated scoring)
- Vue & DOM adapter feature parity
- MCP server for agent discovery
- Code export (schema → standalone React/Vue)
- VS Code extension

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT © [UISchema Contributors](https://github.com/skeehn/ui-schema/graphs/contributors)
