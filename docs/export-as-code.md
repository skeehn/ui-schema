# Code Export Guide

Code export allows you to convert generated UISchema into standalone React components with no runtime dependencies. This enables you to generate production-ready code that can be deployed independently.

## What is Code Export?

Code export converts UISchema to:

- **Standalone React Components**: No UISchema runtime required
- **Complete Projects**: Includes package.json, styles, and configuration
- **Production-Ready Code**: Optimized and ready to deploy
- **No Dependencies**: Generated code has no UISchema dependencies

## Exporting UI

### Basic Export

Convert a UISchema to React components:

```typescript
import { exportToReact } from '@uischema/react';
import schema from './uischema.json';

const code = exportToReact(schema);
console.log(code);
```

Output:

```tsx
"use client";

import React from 'react';

export default function GeneratedUI() {
  return (
    <div aria-label="Hello world container">
      <p aria-label="Greeting text">Hello, UISchema!</p>
      <button aria-label="Example button">Click me</button>
    </div>
  );
}
```

### With Custom Components

Export with custom component mappings:

```typescript
import { exportToReact } from '@uischema/react';

const customComponents = {
  Card: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  Metric: ({ label, value }: { label: string; value: string }) => (
    <div className="metric">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  ),
};

const code = exportToReact(schema, { components: customComponents });
```

### With Styles

Include CSS styles in export:

```typescript
const code = exportToReact(schema, {
  styles: `
    .card {
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric {
      display: flex;
      flex-direction: column;
    }
  `,
});
```

### With Data Bindings

Export components that use data bindings:

```typescript
const code = exportToReact(schema, {
  data: {
    analytics: {
      revenue: 125000,
      salesByRegion: [
        { label: 'US', value: 45000 },
        { label: 'EU', value: 35000 },
      ],
    },
  },
});
```

## Generated Code Structure

### Component Files

Exported components are organized by structure:

```typescript
// Generated from UISchema
export function Dashboard() {
  return (
    <Container>
      <Card title="Revenue">
        <Metric label="Total Revenue" value="$125,000" />
        <Chart data={salesData} />
      </Card>
    </Container>
  );
}
```

### Styles

Styles can be inline or in separate files:

```typescript
// Inline styles
const styles = `
  .container { ... }
  .card { ... }
`;

// Or separate CSS file
import './styles.css';
```

### Dependencies

Generated code includes only necessary dependencies:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Configuration

Includes configuration files:

```json
// package.json
{
  "name": "generated-ui",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

## Examples

### Simple Export

```typescript
import { exportToReact } from '@uischema/react';

const schema = {
  schemaVersion: '0.1.0',
  root: {
    type: 'Container',
    props: { ariaLabel: 'Main container' },
    children: [
      {
        type: 'Text',
        props: { text: 'Hello World', ariaLabel: 'Greeting' },
      },
    ],
  },
};

const code = exportToReact(schema);
// Returns React component code
```

### Complex Export

```typescript
import { exportToReact } from '@uischema/react';

const schema = {
  schemaVersion: '0.1.0',
  root: {
    type: 'Container',
    props: { ariaLabel: 'Dashboard' },
    children: [
      {
        type: 'Card',
        props: { title: 'Revenue' },
        children: [
          {
            type: 'Metric',
            props: {
              label: 'Total Revenue',
              valuePath: '/analytics/revenue',
              format: 'currency',
            },
          },
          {
            type: 'Chart',
            props: {
              type: 'bar',
              dataPath: '/analytics/salesByRegion',
            },
          },
        ],
      },
    ],
  },
};

const code = exportToReact(schema, {
  data: {
    analytics: {
      revenue: 125000,
      salesByRegion: [
        { label: 'US', value: 45000 },
        { label: 'EU', value: 35000 },
      ],
    },
  },
  styles: `
    .card { padding: 20px; }
    .metric { display: flex; }
  `,
});
```

### Next.js Project Export

Export as a complete Next.js project:

```typescript
import { exportToNextJS } from '@uischema/react';

const project = exportToNextJS(schema, {
  projectName: 'my-dashboard',
  includeStyles: true,
  includeTypes: true,
});

// Returns:
// {
//   'app/page.tsx': '...',
//   'app/layout.tsx': '...',
//   'package.json': '...',
//   'tsconfig.json': '...',
//   'styles.css': '...',
// }
```

### Standalone React App

Export as a standalone React app:

```typescript
import { exportToStandalone } from '@uischema/react';

const app = exportToStandalone(schema, {
  appName: 'my-app',
  buildTool: 'vite', // or 'create-react-app', 'next'
});

// Returns complete project structure
```

## Export Workflow

### 1. Generate UISchema

```typescript
const schema = await generateUISchema('Create a dashboard');
```

### 2. Export to Code

```typescript
const code = exportToReact(schema);
```

### 3. Save Files

```typescript
import { writeFileSync } from 'fs';

writeFileSync('generated-ui.tsx', code);
```

### 4. Deploy

```bash
# Copy to new project
cp generated-ui.tsx my-project/src/

# Install dependencies
cd my-project
npm install

# Build and deploy
npm run build
```

## Advanced Usage

### Custom Component Mapping

Map UISchema components to custom React components:

```typescript
const componentMap = {
  Card: ({ title, children }) => (
    <div className="custom-card">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  Metric: ({ label, value }) => (
    <div className="custom-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  ),
};

const code = exportToReact(schema, { components: componentMap });
```

### Data Transformation

Transform data during export:

```typescript
const code = exportToReact(schema, {
  transformData: (data) => {
    // Transform data before export
    return {
      ...data,
      analytics: {
        ...data.analytics,
        revenue: formatCurrency(data.analytics.revenue),
      },
    };
  },
});
```

### Code Formatting

Format exported code:

```typescript
import { format } from 'prettier';

const code = exportToReact(schema);
const formatted = format(code, { parser: 'typescript' });
```

## Best Practices

1. **Validate Before Export**: Ensure schema is valid
2. **Include Styles**: Export with proper styling
3. **Optimize Code**: Remove unused code and dependencies
4. **Test Exported Code**: Verify exported code works
5. **Version Control**: Track exported code versions
6. **Documentation**: Include comments in exported code

## Next Steps

- Learn about [Component Catalog](./component-catalog.md) for constraining generation
- Explore [Streaming UI](./streaming-ui.md) for progressive rendering
- Check the [API Reference](./api-reference.md) for detailed function docs
