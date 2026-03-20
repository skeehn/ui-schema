import type { UISchemaNode } from "@uischema/core";
import type { DOMAdapter } from "@uischema/dom";

export type EvaluationLevel = "A" | "AA" | "AAA";
export type EvaluationResult = "PASS" | "FAIL" | "WARNING" | "MANUAL_REQUIRED";

export interface EvaluationIssue {
  criterion: string;
  level: EvaluationLevel;
  status: EvaluationResult;
  message: string;
  element?: HTMLElement;
  path?: string;
}

export interface EvaluationReport {
  timestamp: string;
  score: number;
  issues: EvaluationIssue[];
}

/**
 * WCAGEngine performs accessibility audits against UISchema nodes or rendered DOM.
 */
export class WCAGEngine {
  constructor(private adapter?: DOMAdapter) {}

  /**
   * Run a schema-level preflight check (fast, no DOM required).
   * Catches obvious issues before rendering.
   */
  async preflight(node: UISchemaNode): Promise<EvaluationIssue[]> {
    const issues: EvaluationIssue[] = [];

    const walk = (n: UISchemaNode, path: string) => {
      // 1.1.1 Non-text Content (simplified)
      if (n.type === "Image" && !n.props?.alt && !n.props?.ariaLabel && !n.props?.src) {
        issues.push({
          criterion: "1.1.1",
          level: "A",
          status: "FAIL",
          message: "Images must have an alt text or aria-label.",
          path
        });
      }

      // 4.1.2 Name, Role, Value (simplified)
      const interactive = ["Button", "Link", "Input", "Select", "Textarea"];
      if (interactive.includes(n.type as string) && !n.props?.ariaLabel && !n.props?.text && !n.props?.placeholder) {
        issues.push({
          criterion: "4.1.2",
          level: "A",
          status: "FAIL",
          message: `${n.type} must have an accessible name (ariaLabel, text, or placeholder).`,
          path
        });
      }

      // Check for positive tabIndex
      if (typeof n.props?.tabIndex === "number" && n.props.tabIndex > 0) {
        issues.push({
          criterion: "2.1.1",
          level: "A",
          status: "WARNING",
          message: "Avoid positive tabIndex to maintain natural focus order.",
          path
        });
      }

      n.children?.forEach((child, i) => walk(child, `${path}.children[${i}]`));

      if (n.slots) {
        Object.entries(n.slots).forEach(([slotName, slotValue]) => {
          const slotNodes = Array.isArray(slotValue) ? slotValue : [slotValue];
          slotNodes.forEach((slotNode, i) => {
            if (slotNode) {
              walk(slotNode, `${path}.slots.${slotName}[${i}]`);
            }
          });
        });
      }
    };

    walk(node, "root");
    return issues;
  }

  /**
   * Run a DOM-based audit (requires DOMAdapter).
   * Analyzes the actual rendered experience.
   */
  async audit(): Promise<EvaluationReport> {
    if (!this.adapter) {
      throw new Error("DOMAdapter is required for audit.");
    }

    const issues: EvaluationIssue[] = [];
    const elements = this.adapter.queryAll("*");

    for (const el of elements) {
      // 4.1.2 Name, Role, Value
      const name = this.adapter.getComputedName(el);

      if (this.adapter.isFocusable(el) && !name.trim()) {
        issues.push({
          criterion: "4.1.2",
          level: "A",
          status: "FAIL",
          message: "Focusable element has no accessible name.",
          element: el
        });
      }

      // 2.4.7 Focus Visible (Manual check required for automated tools usually)
      if (this.adapter.isFocusable(el)) {
        issues.push({
          criterion: "2.4.7",
          level: "AA",
          status: "MANUAL_REQUIRED",
          message: "Verify that focus indicator is visible.",
          element: el
        });
      }

      // 1.4.3 Contrast (Minimum)
      if (el.innerText && el.innerText.trim().length > 0) {
        // In a full engine, we'd check computed colors here.
        // For the MVP, we flag for manual review.
        issues.push({
          criterion: "1.4.3",
          level: "AA",
          status: "MANUAL_REQUIRED",
          message: `Verify text contrast for: "${el.innerText.substring(0, 20)}..."`,
          element: el
        });
      }
    }

    const failed = issues.filter((i) => i.status === "FAIL").length;
    const score = elements.length > 0 ? Math.max(0, 100 - failed * 10) : 100;

    return {
      timestamp: new Date().toISOString(),
      score,
      issues
    };
  }
}
