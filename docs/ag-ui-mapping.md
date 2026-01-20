# AG-UI Protocol Compatibility

This document describes how to plug AG-UI's protocol into UISchema's event layer.

## Overview

AG-UI is a User Interaction protocol (not a spec) that provides bidirectional runtime connection between agents and applications. UISchema's protocol layer is compatible with AG-UI's event model.

## Event Mapping

### UISchema Events → AG-UI Events

| UISchema Event Type | AG-UI Event Type |
|---------------------|------------------|
| `action` | `ui.interaction` |
| `submit` | `ui.interaction` |
| `navigate` | `ui.state-change` |
| `custom` | `ui.interaction` |

### AG-UI Events → UISchema Events

AG-UI `ui.interaction` events are converted to UISchema events with:
- `type`: Extracted from payload or defaults to `action`
- `name`: Event name from payload
- `params`: Parameters from payload

## Usage

### Converting UISchema Events to AG-UI

```typescript
import { toAGUIEvent, mapUISchemaEventsToAGUI } from '@uischema/bridges';

// Convert single event
const agEvent = toAGUIEvent('onClick', node.events.onClick, node);

// Convert all events
const agEvents = mapUISchemaEventsToAGUI(node.events, node);
```

### Converting AG-UI Events to UISchema

```typescript
import { fromAGUIEvent } from '@uischema/bridges';

const agEvent = {
  type: 'ui.interaction',
  payload: {
    componentId: 'btn1',
    componentType: 'Button',
    eventName: 'onClick',
    eventType: 'action',
    params: { id: 'btn1' }
  }
};

const uischemaEvent = fromAGUIEvent(agEvent);
```

### Creating AG-UI Update Events

```typescript
import { createAGUIUpdate } from '@uischema/bridges';

// Create update event for node changes
const updateEvent = createAGUIUpdate(node);
```

## Integration with AG-UI Runtime

UISchema's protocol layer can be used alongside AG-UI's bidirectional runtime connection:

```typescript
import { createUIUpdate, createUIInteraction } from '@uischema/protocol';
import { toAGUIEvent } from '@uischema/bridges';

// Agent sends UI update
const updateEvent = createUIUpdate(node);
const agEvent = toAGUIEvent('update', { type: 'action', name: 'update' }, node);

// UI sends interaction
const interactionEvent = createUIInteraction('Button', 'onClick', { id: 'btn1' });
const agInteraction = toAGUIEvent('onClick', {
  type: 'action',
  name: 'onClick',
  params: { id: 'btn1' }
}, node);
```

## Supported AG-UI Features

- ✅ Bidirectional event communication
- ✅ UI update notifications
- ✅ User interaction events
- ✅ State change events
- ✅ Compatible with A2UI, Open-JSON-UI, MCP-UI via AG-UI

## Limitations

- AG-UI-specific features beyond basic events may require custom handling
- Full AG-UI protocol support is planned for v1.1+
