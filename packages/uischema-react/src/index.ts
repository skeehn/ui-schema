export { UISchemaRenderer, renderUISchema } from "./renderer/react";

export {
  registerComponent,
  getComponent,
  getRegistrySnapshot
} from "./registry/components";

export type {
  UISchemaComponent,
  UISchemaComponentProps
} from "./registry/components";

// DX-First API
export {
  UISchemaRenderer as UISchemaRendererDX,
  generateUISchema,
  StreamingUISchemaRenderer
} from "./api/dx-first";

export type { StreamingUISchemaRendererProps } from "./api/dx-first";

// Streaming hook
export { useUIStream } from "./hooks/useUIStream";
export type { UIStreamOptions, UIStreamState } from "./hooks/useUIStream";
