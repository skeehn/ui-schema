# Open-JSON-UI → UISchema Mapping

This document describes how Open-JSON-UI components map to UISchema and vice versa.

## Overview

Open-JSON-UI is OpenAI's open standardization of declarative Generative UI. UISchema provides bidirectional conversion to enable interoperability.

## Component Type Mapping

| Open-JSON-UI Type | UISchema Type |
|-------------------|---------------|
| `container` | `Container` |
| `card` | `Card` |
| `text` | `Text` |
| `button` | `Button` |
| `input` | `Input` |
| `textarea` | `Textarea` |
| `select` | `Select` |
| `checkbox` | `Checkbox` |
| `image` | `Image` |
| `link` | `Link` |
| `list` | `List` |
| `list-item` | `ListItem` |
| `grid` | `Grid` |
| `row` | `Row` |
| `column` | `Column` |

Custom types are preserved with `custom:` prefix in UISchema.

## Property Mapping

### Common Properties

- `title` → `text` (for display components)
- `label` → `text` (for interactive components)
- `href` → `href` (for links)
- `src` → `src` (for images)
- `style` → `style` (merged into props)

### Accessibility

UISchema automatically adds `ariaLabel` for interactive components if not present, using `text` or `label` as fallback.

## Example Conversion

### Open-JSON-UI Input

```json
{
  "version": "1.0",
  "components": [
    {
      "type": "container",
      "properties": {
        "title": "Hello World"
      },
      "children": [
        {
          "type": "button",
          "properties": {
            "label": "Click me"
          }
        }
      ]
    }
  ]
}
```

### UISchema Output

```json
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": {
      "text": "Hello World"
    },
    "children": [
      {
        "type": "Button",
        "props": {
          "text": "Click me",
          "ariaLabel": "Click me"
        }
      }
    ]
  }
}
```

## Usage

```typescript
import { fromOpenJSONUIDocument, toOpenJSONUIDocument } from '@uischema/bridges';

// Convert Open-JSON-UI to UISchema
const uischema = fromOpenJSONUIDocument(openJsonUIDoc);

// Convert UISchema to Open-JSON-UI
const openJsonUI = toOpenJSONUIDocument(uischemaDoc);
```

## Limitations

- Open-JSON-UI's `style` object is merged into UISchema `props.style`
- Custom component types are preserved but may need manual mapping
- Some Open-JSON-UI-specific features may not have direct UISchema equivalents
