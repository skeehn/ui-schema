# MCP Apps Integration Guide

This document describes how to integrate UISchema with Model Context Protocol (MCP) Apps.

## Overview

MCP Apps extends MCP for interactive UIs using JSON-RPC over postMessage. UISchema can be converted to MCP Apps format for use in MCP-enabled applications.

## MCP Apps Message Format

UISchema events and updates can be converted to MCP Apps JSON-RPC messages:

```typescript
import {
  createMCPAppsUpdateMessage,
  createMCPAppsInteractionMessage
} from '@uischema/bridges';

// Create UI update message
const updateMessage = createMCPAppsUpdateMessage(node, messageId);

// Create interaction message
const interactionMessage = createMCPAppsInteractionMessage(
  'onClick',
  { id: 'btn1' },
  messageId
);
```

## Converting UISchema to MCP Apps HTML

UISchema documents can be converted to MCP Apps HTML resources:

```typescript
import { toMCPAppsHTML, toMCPAppsResource } from '@uischema/bridges';

// Convert to HTML
const html = toMCPAppsHTML(doc, 'ui://example/app');

// Create MCP Apps resource
const resource = toMCPAppsResource(
  doc,
  'ui://example/app',
  'My App',
  'Description of my app'
);
```

## MCP Apps Resource Structure

```typescript
{
  uri: "ui://example/app",
  name: "My App",
  description: "Description",
  mimeType: "text/html;profile=mcp-app",
  _meta: {
    ui: {
      csp: {
        connectDomains: [],
        resourceDomains: [],
        frameDomains: [],
        baseUriDomains: []
      },
      permissions: {
        camera: false,
        microphone: false,
        geolocation: false,
        clipboardWrite: false
      },
      prefersBorder: true
    }
  }
}
```

## MCP Apps Lifecycle

1. **Discovery**: MCP server declares UI resources via `resources/list`
2. **Initialization**: Host renders UI resource in iframe
3. **Communication**: UI and host communicate via JSON-RPC over postMessage
4. **Updates**: UI updates sent via `ui/notifications/tool-result`
5. **Interactions**: UI interactions sent via `ui/message`

## Example: MCP Server with UISchema

```typescript
import { toMCPAppsResource, toMCPAppsHTML } from '@uischema/bridges';

// In MCP server
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const uischema = generateUISchema('Create dashboard');
  const resource = toMCPAppsResource(
    uischema,
    'ui://my-server/dashboard',
    'Dashboard',
    'Interactive dashboard'
  );
  return { resources: [resource] };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'ui://my-server/dashboard') {
    const uischema = generateUISchema('Create dashboard');
    const html = toMCPAppsHTML(uischema, request.params.uri);
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/html;profile=mcp-app',
          text: html
        }
      ]
    };
  }
});
```

## MCP Apps Message Types

### UI → Host

- `ui/initialize` - Initialize MCP connection
- `ui/message` - Send message to host
- `ui/update-model-context` - Update model context
- `tools/call` - Call tool on MCP server
- `resources/read` - Read resource

### Host → UI

- `ui/notifications/tool-input` - Tool input data
- `ui/notifications/tool-result` - Tool execution result
- `ui/notifications/host-context-changed` - Host context updates

## Security Considerations

- MCP Apps uses iframe sandboxing for security
- CSP (Content Security Policy) is enforced based on resource metadata
- All communication is auditable via JSON-RPC messages

## Limitations

- Current implementation generates HTML wrapper (future: direct UISchema rendering)
- Some MCP Apps features may require custom handling
- Full MCP Apps protocol support is planned for v1.1+
