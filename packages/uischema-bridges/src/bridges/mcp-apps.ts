import type { UISchemaDocument, UISchemaNode } from "@uischema/core";

/**
 * MCP Apps message format
 * Based on Model Context Protocol Apps extension (SEP-1865)
 */
export type MCPAppsMessage = {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

/**
 * MCP Apps UI resource format
 */
export type MCPAppsUIResource = {
  uri: string;
  name: string;
  description?: string;
  mimeType: "text/html;profile=mcp-app";
  _meta?: {
    ui?: {
      csp?: {
        connectDomains?: string[];
        resourceDomains?: string[];
        frameDomains?: string[];
        baseUriDomains?: string[];
      };
      permissions?: {
        camera?: boolean;
        microphone?: boolean;
        geolocation?: boolean;
        clipboardWrite?: boolean;
      };
      domain?: string;
      prefersBorder?: boolean;
    };
  };
};

/**
 * Convert UISchema document to MCP Apps HTML content
 * For now, generates a simple HTML wrapper that can render UISchema
 * Future: Direct UISchema rendering in MCP Apps
 */
export const toMCPAppsHTML = (doc: UISchemaDocument, resourceUri: string): string => {
  const schemaJson = JSON.stringify(doc, null, 2);
  const escapedSchema = schemaJson.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UISchema App</title>
  <script type="module">
    // MCP Apps initialization
    let nextId = 1;
    function sendRequest(method, params) {
      const id = nextId++;
      window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, '*');
      return new Promise((resolve, reject) => {
        const listener = (event) => {
          if (event.data?.id === id) {
            window.removeEventListener('message', listener);
            if (event.data?.result) {
              resolve(event.data.result);
            } else if (event.data?.error) {
              reject(new Error(event.data.error.message));
            }
          }
        };
        window.addEventListener('message', listener);
      });
    }

    // Initialize MCP connection
    (async () => {
      try {
        const initResult = await sendRequest("ui/initialize", {
          capabilities: {},
          clientInfo: { name: "UISchema App", version: "0.1.0" },
          protocolVersion: "2025-06-18"
        });
        console.log("MCP initialized", initResult);
      } catch (error) {
        console.error("MCP initialization failed", error);
      }
    })();

    // UISchema rendering (simplified - would use actual renderer in production)
    const schema = ${escapedSchema};
    const root = document.getElementById('root');
    if (root && schema.root) {
      root.innerHTML = '<pre>' + JSON.stringify(schema.root, null, 2) + '</pre>';
    }
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
};

/**
 * Convert UISchema document to MCP Apps UI resource
 */
export const toMCPAppsResource = (
  doc: UISchemaDocument,
  resourceUri: string,
  name: string,
  description?: string
): MCPAppsUIResource => {
  return {
    uri: resourceUri,
    name,
    description: description ?? doc.meta?.description,
    mimeType: "text/html;profile=mcp-app",
    _meta: {
      ui: {
        csp: {
          connectDomains: [],
          resourceDomains: [],
          frameDomains: [],
          baseUriDomains: []
        },
        prefersBorder: true
      }
    }
  };
};

/**
 * Create MCP Apps message for UI update
 */
export const createMCPAppsUpdateMessage = (
  node: UISchemaNode,
  messageId: number | string
): MCPAppsMessage => {
  return {
    jsonrpc: "2.0",
    id: messageId,
    method: "ui/notifications/tool-result",
    params: {
      content: [
        {
          type: "text",
          text: `UI Update: ${node.type}${node.id ? ` (${node.id})` : ""}`
        }
      ],
      structuredContent: {
        uischema: node
      }
    }
  };
};

/**
 * Create MCP Apps message for UI interaction
 */
export const createMCPAppsInteractionMessage = (
  eventName: string,
  params: Record<string, unknown>,
  messageId: number | string
): MCPAppsMessage => {
  return {
    jsonrpc: "2.0",
    id: messageId,
    method: "ui/message",
    params: {
      role: "user",
      content: {
        type: "text",
        text: `UI Interaction: ${eventName}`
      }
    }
  };
};
