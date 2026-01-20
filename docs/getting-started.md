# Getting Started with UISchema

UISchema is a formal, framework-agnostic UI schema standard for AI-generated interfaces. This guide will get you up and running in **<5 minutes**.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher ([download](https://nodejs.org/))
- **npm** 9 or higher (comes with Node.js)
- **Git** (for cloning the repository, if needed)

Verify your installation:

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
git --version   # Any recent version
```

## Installation

### Option 1: Install in Your Project

If you want to use UISchema in an existing project:

```bash
npm install @uischema/core @uischema/react
```

### Option 2: Clone and Develop

If you want to contribute or explore the codebase:

```bash
# Clone the repository
git clone <repo-url>
cd uischema

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests to verify setup
npm test
```

## Hello World (<5 minutes)

### Step 1: Create a UISchema JSON file

Create `uischema.json`:

```json
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": {
      "ariaLabel": "Hello world container"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Hello, UISchema!",
          "ariaLabel": "Greeting text"
        }
      },
      {
        "type": "Button",
        "props": {
          "text": "Click me",
          "ariaLabel": "Example button"
        }
      }
    ]
  }
}
```

### Step 2: Render in React

```tsx
import { UISchemaRenderer } from '@uischema/react';
import schema from './uischema.json';

export default function Page() {
  return <UISchemaRenderer schema={schema} />;
}
```

That's it! You now have a working UISchema UI.

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Next.js Example](../examples/nextjs-vercel-ai-sdk/) - Full Next.js + Vercel AI SDK integration
- [Spec Bridges](./spec-bridges.md) - Interoperability with Open-JSON-UI, AG-UI, MCP Apps

## DX-First API

For even simpler usage, use the DX-first API:

```tsx
import { generateUISchema, UISchemaRenderer } from '@uischema/react';

export default async function Page() {
  const schema = await generateUISchema('Create a weather dashboard');
  return <UISchemaRenderer schema={schema} />;
}
```

## Streaming UI Updates

For real-time UI updates via JSONL patches:

```tsx
import { StreamingUISchemaRenderer } from '@uischema/react';

export default function Page() {
  return (
    <StreamingUISchemaRenderer
      endpoint="/api/stream-ui"
      onEvent={(name, params) => {
        console.log('UI event:', name, params);
      }}
    />
  );
}
```

## Validation

Validate your UISchema files:

```bash
npx @uischema/cli validate uischema.json
```

## Troubleshooting

### Common Issues

#### Build Errors

**Problem**: `npm run build` fails with TypeScript errors

**Solution**:
```bash
# Clean build artifacts
npm run clean

# Rebuild
npm run build
```

#### Module Resolution Errors

**Problem**: `Cannot find module '@uischema/core'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild packages
npm run build
```

#### Type Errors

**Problem**: TypeScript complains about missing types

**Solution**:
```bash
# Verify types are generated
npm run build

# Check TypeScript configuration
npx tsc --noEmit
```

#### CLI Not Found

**Problem**: `npx @uischema/cli` command not found

**Solution**:
```bash
# Build CLI package
cd packages/uischema-cli
npm run build

# Or use from root
npm run build
npx @uischema/cli validate examples/hello-world/uischema.json
```

### Getting Help

- Check the [API Reference](./api-reference.md) for detailed function documentation
- Review [Architecture](./architecture.md) for system design
- See [Examples](../examples/) for working code samples
- Open an issue on GitHub for bugs or feature requests

## Next Steps

### Learn More

- [Component Catalog Guide](./component-catalog.md) - Define component guardrails (coming soon)
- [Streaming UI Guide](./streaming-ui.md) - Progressive rendering with JSONL patches (coming soon)
- [Code Export Guide](./export-as-code.md) - Export generated UI as standalone code (coming soon)

### Advanced Topics

- [Compressed Shorthand](../packages/uischema-compressed/) - 3-5x token reduction
- [Spec Bridges](../packages/uischema-bridges/) - Interoperability with Open-JSON-UI, AG-UI, MCP Apps
- [Protocol Layer](../packages/uischema-protocol/) - Events, patches, and state synchronization

### Production Examples

- [Next.js + Vercel AI SDK](../examples/nextjs-vercel-ai-sdk/) - Full production integration
- [Hello World](../examples/hello-world/) - Simple example to get started
