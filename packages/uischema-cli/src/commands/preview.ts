var http = require("http");
import type { IncomingMessage, ServerResponse } from "http";

async function previewCommand(args: string[]): Promise<void> {
  const port = args[0] ? parseInt(args[0], 10) : 3000;

  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/" || req.url === "/index.html") {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UISchema Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .editor {
      width: 100%;
      min-height: 400px;
      font-family: monospace;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 20px;
    }
    .preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      min-height: 200px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>UISchema Preview</h1>
    <p>Edit the JSON schema below and see it render in real-time.</p>
    <textarea id="editor" class="editor">{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": {
      "ariaLabel": "Example container"
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
}</textarea>
    <div id="preview" class="preview"></div>
  </div>
  <script>
    // Simple preview - in production would use actual UISchema renderer
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    
    function updatePreview() {
      try {
        const schema = JSON.parse(editor.value);
        preview.innerHTML = '<pre>' + JSON.stringify(schema.root, null, 2) + '</pre>';
      } catch (e) {
        preview.innerHTML = '<p style="color: red;">Invalid JSON: ' + e.message + '</p>';
      }
    }
    
    editor.addEventListener('input', updatePreview);
    updatePreview();
  </script>
</body>
</html>`;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.listen(port, () => {
    console.log(`🚀 UISchema preview server running at http://localhost:${port}`);
    console.log(`   Open http://localhost:${port} in your browser`);
  });
}

module.exports = { previewCommand };
