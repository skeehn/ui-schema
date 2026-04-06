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
  generateUISchema as generateUISchemaLegacy,
  StreamingUISchemaRenderer
} from "./api/dx-first";

export type { StreamingUISchemaRendererProps } from "./api/dx-first";

// Streaming hook
export { useUIStream } from "./hooks/useUIStream";
export type { UIStreamOptions, UIStreamState } from "./hooks/useUIStream";

// Theme system
export { UISchemaThemeProvider, useUISchemaTokens } from "./theme/ThemeProvider";
export type { UISchemaThemeProviderProps } from "./theme/ThemeProvider";
export { defaultTokens, injectGlobalStyles } from "./styles/tokens";
export type { UISchemaTokens } from "./styles/tokens";

// AI generation helper
export { generateUISchema } from "./ai/generate";
export type { GenerateUISchemaOptions } from "./ai/generate";
