## 2025-02-07 - XSS via Prop Spreading in Renderer
**Vulnerability:** The `normalizeProps` function was spreading arbitrary user-provided props directly onto DOM elements in the React renderer.
**Learning:** This allowed dangerous properties like `dangerouslySetInnerHTML` to be injected via the UISchema JSON, leading to XSS.
**Prevention:** Implement a strict allowlist for DOM props and map specific security-sensitive or UX-related props (like ARIA) explicitly. Block known dangerous sinks.
