# Hello World Example

This is a minimal example demonstrating UISchema's DX-first API.

## Usage

```bash
# From project root
npm install
npm run build

# Run the example (requires React setup)
# See Next.js example for a complete working setup
```

## Example Schema

The `uischema.json` file contains a simple hello world schema:

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
          "text": "Hello UISchema"
        }
      },
      {
        "type": "Button",
        "props": {
          "text": "Click me",
          "ariaLabel": "Click the primary action"
        }
      }
    ]
  }
}
```

## DX-First API Example

```tsx
import { UISchemaRenderer, generateUISchema } from '@uischema/react';

// Simple usage
export default async function Page() {
  const schema = await generateUISchema('Create a weather dashboard');
  return <UISchemaRenderer schema={schema} />;
}
```

## Validation

Validate the schema:

```bash
npx @uischema/cli validate uischema.json
```
