/**
 * UISchema design token system.
 * All default component styles derive from these tokens.
 * Override by passing custom tokens to UISchemaThemeProvider.
 */

export type UISchemaTokens = {
  colors: {
    primary: string;
    primaryFg: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderFocus: string;
    text: string;
    textMuted: string;
    textPlaceholder: string;
    danger: string;
    success: string;
    warning: string;
    badge: string;
    badgeFg: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  space: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  font: {
    sans: string;
    mono: string;
    sizeBase: string;
    sizeSm: string;
    sizeLg: string;
    sizeXl: string;
    size2xl: string;
    size3xl: string;
    weightNormal: number;
    weightMedium: number;
    weightSemibold: number;
    weightBold: number;
    lineHeight: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
  transition: string;
};

export const defaultTokens: UISchemaTokens = {
  colors: {
    primary: "#6366f1",
    primaryFg: "#ffffff",
    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    border: "#e2e8f0",
    borderFocus: "#6366f1",
    text: "#0f172a",
    textMuted: "#64748b",
    textPlaceholder: "#94a3b8",
    danger: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",
    badge: "#f1f5f9",
    badgeFg: "#475569",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    full: "9999px",
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  font: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
    sizeBase: "14px",
    sizeSm: "12px",
    sizeLg: "16px",
    sizeXl: "20px",
    size2xl: "24px",
    size3xl: "30px",
    weightNormal: 400,
    weightMedium: 500,
    weightSemibold: 600,
    weightBold: 700,
    lineHeight: "1.6",
  },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
    md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
    lg: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06)",
  },
  transition: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
};

/** Singleton style injection tracker — inject once per app lifetime */
let stylesInjected = false;

export const injectGlobalStyles = (tokens: UISchemaTokens = defaultTokens) => {
  if (typeof document === "undefined" || stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement("style");
  style.setAttribute("data-uischema", "");
  style.textContent = `
    [data-uischema-root] {
      font-family: ${tokens.font.sans};
      font-size: ${tokens.font.sizeBase};
      line-height: ${tokens.font.lineHeight};
      color: ${tokens.colors.text};
      box-sizing: border-box;
    }
    [data-uischema-root] *, [data-uischema-root] *::before, [data-uischema-root] *::after {
      box-sizing: inherit;
    }
    @media (prefers-color-scheme: dark) {
      [data-uischema-root][data-theme="auto"] {
        --uis-text: #f1f5f9;
        --uis-text-muted: #94a3b8;
        --uis-surface: #0f172a;
        --uis-surface-hover: #1e293b;
        --uis-border: #334155;
      }
    }
  `;
  document.head.appendChild(style);
};

/** Reset injection (for testing) */
export const resetStyleInjection = () => { stylesInjected = false; };
