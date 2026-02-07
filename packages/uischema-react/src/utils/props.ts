import type { UISchemaProps } from "@uischema/core";

const ALLOWED_PROPS = new Set([
  "id",
  "className",
  "style",
  "role",
  "tabIndex",
  "src",
  "href",
  "alt",
  "title",
  "placeholder",
  "value",
  "type",
  "disabled",
  "required",
  "readOnly",
  "name",
  "label",
]);

const DANGEROUS_PROPS = new Set([
  "dangerouslySetInnerHTML",
  "innerHTML",
  "outerHTML",
]);

/**
 * Normalizes UISchema props to standard DOM attributes.
 * Implements security allowlist and ARIA camelCase mapping.
 */
export const normalizeProps = (props?: UISchemaProps) => {
  if (!props) {
    return {};
  }

  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    // Security: Block dangerous sinks
    if (DANGEROUS_PROPS.has(key)) {
      console.warn(`Blocked dangerous prop: ${key}`);
      continue;
    }

    // UX: Map camelCase ARIA props to kebab-case (e.g., ariaLabel -> aria-label)
    if (key.startsWith("aria") && key.length > 4 && /[A-Z]/.test(key[4])) {
      const ariaKey = `aria-${key.slice(4).toLowerCase()}`;
      normalized[ariaKey] = value;
      continue;
    }

    // Pass through existing aria-* and data-* props
    if (key.startsWith("aria-") || key.startsWith("data-")) {
      normalized[key] = value;
      continue;
    }

    // Security: Only allow explicit allowlist
    if (ALLOWED_PROPS.has(key)) {
      normalized[key] = value;
    }
  }

  return normalized;
};
