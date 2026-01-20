---
title: Field-Level Mappings
description: Extracted fields from Open-JSON-UI, AG-UI, MCP Apps, and AI SDK streamUI
---

# Field-Level Mappings

This document captures the field-level structures from the referenced specs and
how they map onto UISchema concepts.

## Open-JSON-UI (CopilotKit docs)

**Top-level schema**
```json
{
  "version": "1.0",
  "components": [
    {
      "id": "main-container",
      "type": "container",
      "children": [
        {
          "type": "text",
          "content": "Hello World",
          "properties": {
            "variant": "primary"
          }
        }
      ]
    }
  ]
}
```

**Component shape**
```ts
interface OpenJsonUIComponent {
  id?: string;
  type: ComponentType;
  properties?: Record<string, any>;
  children?: OpenJsonUIComponent[];
  content?: string;
}
```

**UISchema mapping**
- `components[]` -> `root.children[]` (wrap in a `Container` root)
- `id` -> `id`
- `type` -> `type` (type map needed, e.g. `text` -> `Text`)
- `properties` -> `props`
- `content` -> `props.text`
- `children` -> `children`

## AG-UI (draft Generative UI + Tools)

**Generative UI tool**
```json
{
  "tool": "generateUserInterface",
  "arguments": {
    "description": "A form that collects a user's shipping address.",
    "data": { "firstName": "Ada", "lastName": "Lovelace", "city": "London" },
    "output": {
      "type": "object",
      "required": ["firstName", "lastName", "street", "city", "postalCode", "country"],
      "properties": {
        "firstName": { "type": "string", "title": "First Name" }
      }
    }
  }
}
```

**Tool definition**
```ts
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}
```

**Tool call lifecycle (events)**
- `ToolCallStart` `{ toolCallId, toolCallName, parentMessageId? }`
- `ToolCallArgs` `{ toolCallId, delta }`
- `ToolCallEnd` `{ toolCallId }`
- `ToolCallResult` `{ messageId, toolCallId, content, role? }`

**UISchema mapping**
- `generateUserInterface.arguments.description` -> prompt for UISchema generator
- `generateUserInterface.arguments.data` -> `initialData` / bindings defaults
- `generateUserInterface.arguments.output` -> constraints for `bindings` and
  validation (JSON Schema <-> UISchema bindings/props rules)
- Tool call events map cleanly to UISchema protocol streaming hooks
  (e.g., `ui.update` carries UISchema patches, `ui.interaction` carries user input).

## MCP Apps (SEP-1865 draft)

**UI resource**
```ts
interface UIResource {
  uri: string; // MUST be ui://
  name: string;
  description?: string;
  mimeType: string; // SHOULD be "text/html;profile=mcp-app"
  _meta?: { ui?: UIResourceMeta };
}
```

**UI metadata**
```ts
interface UIResourceMeta {
  csp?: {
    connectDomains?: string[];
    resourceDomains?: string[];
    frameDomains?: string[];
    baseUriDomains?: string[];
  };
  permissions?: {
    camera?: {};
    microphone?: {};
    geolocation?: {};
    clipboardWrite?: {};
  };
  domain?: string;
  prefersBorder?: boolean;
}
```

**Tool <-> UI linkage**
```ts
interface McpUiToolMeta {
  resourceUri?: string;
  visibility?: Array<"model" | "app">;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  _meta?: {
    ui?: McpUiToolMeta;
    "ui/resourceUri"?: string; // deprecated
  };
}
```

**Transport + lifecycle**
- JSON-RPC 2.0 over `postMessage`
- `ui/initialize` -> `ui/notifications/initialized`
- `ui/notifications/tool-input`, `ui/notifications/tool-input-partial`,
  `ui/notifications/tool-result`, `ui/notifications/tool-cancelled`
- `ui/resource-teardown`
- MIME type: `text/html;profile=mcp-app`

**UISchema mapping**
- UISchema -> HTML via React adapter -> MCP Apps `resources/read` payload
- `resourceUri` -> UISchema-rendered HTML resource
- Tool results (`structuredContent`) -> UISchema data bindings

## AI SDK streamUI (RSC)

**Import**
```ts
import { streamUI } from "@ai-sdk/rsc";
```

**Tool fields**
```ts
tools: {
  myTool: {
    description: string;
    parameters: zodSchema;
    generate?: (params) => ReactNode | AsyncGenerator<ReactNode, ReactNode, void>;
  }
}
```

**Tool selection**
```ts
toolChoice?: "auto" | "none" | "required" | { type: "tool"; toolName: string };
```

**Return shape**
```ts
{
  value: ReactNode;
  stream: AsyncIterable<StreamPart> & ReadableStream<StreamPart>;
  response?: Response;
  warnings?: Warning[];
}
```

**UISchema mapping**
- Define `renderUISchema` tool with Zod schema matching UISchema
- `generate` returns `<UISchemaRenderer schema={schema} />`
- Stream patches via `ui.update` (JSONL patches) and map to RSC stream parts
