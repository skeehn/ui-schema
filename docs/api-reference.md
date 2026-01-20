# UISchema API Reference

Complete API documentation for UISchema packages.

## @uischema/core

### Types

```typescript
import type {
  UISchemaDocument,
  UISchemaNode,
  UISchemaComponentType,
  UISchemaProps,
  UISchemaEvent,
  UISchemaBinding
} from '@uischema/core';
```

### Validation

```typescript
import { validateUISchemaDocument, validateBasicA11y } from '@uischema/core';

// Validate schema structure
const result = validateUISchemaDocument(json);
if (!result.success) {
  console.error(result.error);
}

// Validate basic accessibility
const issues = validateBasicA11y(result.data.root);
issues.forEach(issue => {
  console.warn(`${issue.path}: ${issue.message}`);
});
```

## @uischema/react

### Components

#### `UISchemaRenderer`

Renders a UISchema document or node.

```typescript
import { UISchemaRenderer } from '@uischema/react';

<UISchemaRenderer
  schema={schema}
  onEvent={(name, params) => {
    console.log('Event:', name, params);
  }}
/>
```

#### `StreamingUISchemaRenderer`

Renders UI with streaming updates via JSONL patches.

```typescript
import { StreamingUISchemaRenderer } from '@uischema/react';

<StreamingUISchemaRenderer
  endpoint="/api/stream-ui"
  initialSchema={initialSchema}
  onEvent={(name, params) => {}}
  onError={(error) => {}}
  abortSignal={abortSignal}
/>
```

### Hooks

#### `useUIStream`

Hook for streaming UI updates.

```typescript
import { useUIStream } from '@uischema/react';

const { schema, loading, error, applyPatches, reset } = useUIStream({
  endpoint: '/api/stream-ui',
  initialSchema: initialSchema,
  onEvent: (name, params) => {},
  onError: (error) => {},
  abortSignal: abortSignal
});
```

### Component Registry

```typescript
import { registerComponent, getComponent } from '@uischema/react';

// Register custom component
registerComponent('CustomCard', ({ node, children }) => {
  return <div className="custom-card">{children}</div>;
});

// Get registered component
const Component = getComponent('Button');
```

### DX-First API

```typescript
import { generateUISchema } from '@uischema/react';

// Generate schema from prompt (placeholder - would call LLM in production)
const schema = await generateUISchema('Create a dashboard');
```

## @uischema/protocol

### Patch Operations

```typescript
import {
  applyPatches,
  parseJSONLPatches,
  serializePatchesToJSONL,
  createSetPatch,
  createAddPatch,
  createReplacePatch,
  createRemovePatch
} from '@uischema/protocol';

// Apply patches
const updated = applyPatches(rootNode, [
  createSetPatch('/props/text', 'Updated text'),
  createAddPatch('/children', newChild)
]);

// Parse JSONL stream
const patches = parseJSONLPatches(jsonlString);

// Serialize to JSONL
const jsonl = serializePatchesToJSONL(patches);
```

### Events

```typescript
import {
  createUIUpdate,
  createUIInteraction,
  serializeEvent,
  deserializeEvent
} from '@uischema/protocol';

// Create events
const updateEvent = createUIUpdate(node, '/root');
const interactionEvent = createUIInteraction('Button', 'onClick', { id: 'btn1' });

// Serialize for transport
const json = serializeEvent(updateEvent);
const event = deserializeEvent(json);
```

### State Management

```typescript
import {
  createUIWidgetState,
  updateModelContent,
  updatePrivateContent,
  getModelContent
} from '@uischema/protocol';

// Create state
const state = createUIWidgetState({ userId: '123' });

// Update model-visible content
const updated = updateModelContent(state, { count: 42 });

// Get content visible to agent
const modelContent = getModelContent(updated);
```

## @uischema/bridges

### Open-JSON-UI Bridge

```typescript
import {
  fromOpenJSONUI,
  fromOpenJSONUIDocument,
  toOpenJSONUI,
  toOpenJSONUIDocument
} from '@uischema/bridges';

// Convert Open-JSON-UI to UISchema
const uischema = fromOpenJSONUIDocument(openJsonUIDoc);

// Convert UISchema to Open-JSON-UI
const openJsonUI = toOpenJSONUIDocument(uischemaDoc);
```

### AG-UI Bridge

```typescript
import {
  toAGUIEvent,
  fromAGUIEvent,
  createAGUIUpdate,
  mapUISchemaEventsToAGUI
} from '@uischema/bridges';

// Convert UISchema event to AG-UI event
const agEvent = toAGUIEvent('onClick', event, node);

// Map all events
const agEvents = mapUISchemaEventsToAGUI(node.events, node);
```

### MCP Apps Bridge

```typescript
import {
  toMCPAppsHTML,
  toMCPAppsResource,
  createMCPAppsUpdateMessage
} from '@uischema/bridges';

// Convert to MCP Apps HTML
const html = toMCPAppsHTML(doc, 'ui://example/app');

// Create MCP Apps resource
const resource = toMCPAppsResource(doc, 'ui://example/app', 'My App');

// Create update message
const message = createMCPAppsUpdateMessage(node, 1);
```

## @uischema/compressed

### Shorthand Parsing

```typescript
import { parseShorthand, expandShorthand } from '@uischema/compressed';

// Parse shorthand
const shorthand = "c[title:Hello][children:btn[text:Click]]";
const node = expandShorthand(shorthand);

// Use in renderer
<UISchemaRenderer schema={{ root: node }} />
```

### Coarse-to-Fine Pipeline

```typescript
import { generateLayoutSkeleton, applyPatches } from '@uischema/compressed';

// Stage 1: Generate layout skeleton
const skeleton = generateLayoutSkeleton('Create dashboard');

// Stage 2: Apply refinement patches
const refined = applyPatches(skeleton, [
  { op: 'set', path: '/children/0/props/text', value: 'Revenue' }
]);
```

## @uischema/cli

### Commands

```bash
# Validate schema
uischema validate uischema.json

# Start preview server
uischema preview [port]

# Generate TypeScript types
uischema generate-types [output-file]
```
