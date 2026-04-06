import React, { createContext, useContext, useMemo } from "react";
import { defaultTokens, injectGlobalStyles } from "../styles/tokens";
import type { UISchemaTokens } from "../styles/tokens";

const ThemeContext = createContext<UISchemaTokens>(defaultTokens);

export const useUISchemaTokens = () => useContext(ThemeContext);

export type UISchemaThemeProviderProps = {
  tokens?: Partial<UISchemaTokens>;
  children: React.ReactNode;
};

/**
 * Optional theme provider for customising UISchema design tokens.
 * Wrap your app (or just the UISchemaRenderer) with this to override defaults.
 *
 * @example
 * <UISchemaThemeProvider tokens={{ colors: { primary: '#7c3aed' } }}>
 *   <UISchemaRenderer schema={schema} />
 * </UISchemaThemeProvider>
 */
export const UISchemaThemeProvider = ({ tokens, children }: UISchemaThemeProviderProps) => {
  const merged = useMemo<UISchemaTokens>(
    () => ({
      ...defaultTokens,
      ...tokens,
      colors: { ...defaultTokens.colors, ...(tokens?.colors ?? {}) },
      radius: { ...defaultTokens.radius, ...(tokens?.radius ?? {}) },
      space: { ...defaultTokens.space, ...(tokens?.space ?? {}) },
      font: { ...defaultTokens.font, ...(tokens?.font ?? {}) },
      shadow: { ...defaultTokens.shadow, ...(tokens?.shadow ?? {}) },
    }),
    [tokens]
  );

  injectGlobalStyles(merged);

  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>;
};
