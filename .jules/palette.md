## 2025-02-07 - Inconsistent ARIA Prop Naming
**Learning:** The schema used camelCase (ariaLabel) but DOM expects kebab-case (aria-label). Relying on manual mapping in each component leads to missing attributes and poor accessibility.
**Action:** Centralized prop normalization to ensure consistent mapping of all `aria*` camelCase props to their kebab-case equivalents, improving the accessibility surface area.
