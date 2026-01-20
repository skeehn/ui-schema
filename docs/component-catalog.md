# Component Catalog Guide

A component catalog defines which components, actions, and data bindings AI can use when generating UISchema. This provides guardrails similar to json-render, ensuring AI-generated UI stays within your defined boundaries.

## What is a Component Catalog?

A component catalog is a schema definition that:

- **Constrains AI output** - Only components you define can be generated
- **Validates props** - Uses Zod schemas to ensure correct prop types
- **Defines actions** - Specifies what actions components can trigger
- **Enables data binding** - Maps component props to data paths

This approach is similar to json-render's catalog system, providing a safe, predictable way to generate UI.

## Defining a Catalog

### Basic Catalog Structure

```typescript
import { z } from 'zod';

export const catalog = {
  components: {
    // Component definitions go here
  },
  actions: {
    // Action definitions go here
  }
};
```

### Component Definition

Each component in the catalog defines:

- **props**: Zod schema for component props
- **hasChildren**: Whether the component can have children (optional)

Example:

```typescript
import { z } from 'zod';

export const catalog = {
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
        variant: z.enum(['default', 'outlined', 'elevated']).optional(),
      }),
      hasChildren: true,
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        format: z.enum(['currency', 'percent', 'number']).optional(),
      }),
    },
    Button: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['primary', 'secondary', 'outline']).optional(),
        disabled: z.boolean().optional(),
        ariaLabel: z.string(), // Required for accessibility
      }),
    },
  },
};
```

### Actions Definition

Actions define what operations components can trigger:

```typescript
export const catalog = {
  components: {
    // ... components
  },
  actions: {
    export: {
      params: z.object({
        format: z.string(),
        data: z.record(z.unknown()).optional(),
      }),
    },
    navigate: {
      params: z.object({
        path: z.string(),
      }),
    },
    submit: {
      params: z.object({
        formData: z.record(z.unknown()),
      }),
    },
  },
};
```

## Using with AI Generation

### Constraining AI Output

When generating UISchema with AI, use the catalog to constrain output:

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { catalog } from './catalog';
import { z } from 'zod';

// Convert catalog to JSON Schema for AI
const componentSchema = z.object({
  type: z.enum(Object.keys(catalog.components) as [string, ...string[]]),
  props: z.record(z.unknown()), // Will be validated against catalog
  children: z.array(z.lazy(() => componentSchema)).optional(),
});

const result = await generateObject({
  model: openai('gpt-4o-mini'),
  prompt: 'Create a dashboard with a card showing revenue metrics',
  schema: componentSchema,
});
```

### Validation

Validate generated UISchema against your catalog:

```typescript
import { validateUISchemaDocument } from '@uischema/core';
import { catalog } from './catalog';

const result = validateUISchemaDocument(generatedSchema);

if (!result.success) {
  console.error('Validation failed:', result.error);
  return;
}

// Additional catalog-specific validation
const node = result.data.root;
if (!(node.type in catalog.components)) {
  throw new Error(`Unknown component type: ${node.type}`);
}

// Validate props against Zod schema
const componentDef = catalog.components[node.type];
const propsValidation = componentDef.props.safeParse(node.props);
if (!propsValidation.success) {
  throw new Error(`Invalid props for ${node.type}:`, propsValidation.error);
}
```

## Advanced Patterns

### Custom Components

Define custom components with `x-` or `custom:` prefixes:

```typescript
export const catalog = {
  components: {
    'x-CustomChart': {
      props: z.object({
        chartType: z.enum(['line', 'bar', 'pie']),
        data: z.array(z.record(z.unknown())),
      }),
    },
    'custom:DataTable': {
      props: z.object({
        columns: z.array(z.string()),
        rows: z.array(z.array(z.unknown())),
      }),
    },
  },
};
```

### Data Bindings

Map component props to data paths:

```typescript
export const catalog = {
  components: {
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(), // JSON Pointer path
        format: z.enum(['currency', 'percent']).optional(),
      }),
    },
  },
};

// Usage in UISchema
{
  "type": "Metric",
  "props": {
    "label": "Total Revenue",
    "valuePath": "/analytics/revenue",
    "format": "currency"
  },
  "bindings": {
    "value": {
      "path": "/analytics/revenue",
      "type": "number"
    }
  }
}
```

### Conditional Rendering

Use visibility conditions based on data or auth:

```typescript
export const catalog = {
  components: {
    AdminPanel: {
      props: z.object({
        visible: z.boolean().optional(),
      }),
    },
  },
};

// In UISchema
{
  "type": "AdminPanel",
  "props": {
    "visible": true
  },
  "ext": {
    "visibility": {
      "condition": "/user/role === 'admin'"
    }
  }
}
```

## Examples

### Simple Catalog

```typescript
import { z } from 'zod';

export const catalog = {
  components: {
    Card: {
      props: z.object({
        title: z.string(),
      }),
      hasChildren: true,
    },
    Text: {
      props: z.object({
        text: z.string(),
        ariaLabel: z.string(),
      }),
    },
    Button: {
      props: z.object({
        text: z.string(),
        ariaLabel: z.string(),
      }),
    },
  },
  actions: {
    click: {
      params: z.object({}),
    },
  },
};
```

### Complex Catalog

```typescript
import { z } from 'zod';

export const catalog = {
  components: {
    Dashboard: {
      props: z.object({
        title: z.string(),
        layout: z.enum(['grid', 'list']).optional(),
      }),
      hasChildren: true,
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        trend: z.enum(['up', 'down', 'neutral']).optional(),
        format: z.enum(['currency', 'percent', 'number']).optional(),
      }),
    },
    Chart: {
      props: z.object({
        type: z.enum(['line', 'bar', 'pie']),
        dataPath: z.string(),
        title: z.string().optional(),
      }),
    },
    DataTable: {
      props: z.object({
        columns: z.array(z.string()),
        dataPath: z.string(),
        pagination: z.boolean().optional(),
      }),
    },
  },
  actions: {
    export: {
      params: z.object({
        format: z.enum(['csv', 'json', 'pdf']),
        dataPath: z.string().optional(),
      }),
    },
    filter: {
      params: z.object({
        field: z.string(),
        value: z.unknown(),
      }),
    },
  },
};
```

### Integration with Vercel AI SDK

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { catalog } from './catalog';
import { z } from 'zod';

// Create schema from catalog
const createSchemaFromCatalog = (catalog: typeof catalog) => {
  const componentTypes = Object.keys(catalog.components) as [string, ...string[]];
  
  const componentSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
      type: z.enum(componentTypes),
      props: z.record(z.unknown()),
      children: z.array(componentSchema).optional(),
    })
  );

  return z.object({
    root: componentSchema,
  });
};

export async function generateUI(prompt: string) {
  const schema = createSchemaFromCatalog(catalog);
  
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    prompt,
    schema,
  });

  // Validate against catalog
  const validation = validateUISchemaDocument(result.object);
  if (!validation.success) {
    throw new Error('Generated schema failed validation');
  }

  return validation.data;
}
```

## Best Practices

1. **Start Small**: Begin with a minimal catalog and expand as needed
2. **Use Zod Strictly**: Define precise prop types to catch errors early
3. **Document Components**: Add JSDoc comments explaining component purpose
4. **Version Your Catalog**: Track catalog changes to maintain compatibility
5. **Test Validation**: Ensure catalog validation catches invalid schemas
6. **Accessibility First**: Always require `ariaLabel` for interactive components

## Next Steps

- Learn about [Streaming UI](./streaming-ui.md) for progressive rendering
- Explore [Code Export](./export-as-code.md) to generate standalone components
- Check the [API Reference](./api-reference.md) for detailed function docs
