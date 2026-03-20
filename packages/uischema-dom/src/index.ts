export interface DOMAdapter {
  root: HTMLElement;
  query(selector: string): HTMLElement | null;
  queryAll(selector: string): HTMLElement[];
  getAttribute(element: HTMLElement, name: string): string | null;
  getRole(element: HTMLElement): string | null;
  getComputedName(element: HTMLElement): string;
  isFocusable(element: HTMLElement): boolean;
  getComputedStyle(element: HTMLElement): CSSStyleDeclaration;
}

/**
 * WebDOMAdapter provides a framework-agnostic abstraction over the DOM.
 * It can be used in browsers or with jsdom.
 */
export class WebDOMAdapter implements DOMAdapter {
  constructor(public root: HTMLElement) {}

  query(selector: string): HTMLElement | null {
    return this.root.querySelector(selector);
  }

  queryAll(selector: string): HTMLElement[] {
    return Array.from(this.root.querySelectorAll(selector));
  }

  getAttribute(element: HTMLElement, name: string): string | null {
    return element.getAttribute(name);
  }

  /**
   * Returns the WAI-ARIA role of the element, including implicit roles.
   */
  getRole(element: HTMLElement): string | null {
    const role = element.getAttribute("role");
    if (role) {
      return role;
    }

    // Basic implicit roles mapping
    const tag = element.tagName.toLowerCase();
    switch (tag) {
      case "button":
        return "button";
      case "a":
        return element.hasAttribute("href") ? "link" : null;
      case "input": {
        const type = element.getAttribute("type");
        if (type === "checkbox") return "checkbox";
        if (type === "radio") return "radio";
        return "textbox";
      }
      case "textarea":
        return "textbox";
      case "select":
        return "combobox";
      case "nav":
        return "navigation";
      case "header":
        return "banner";
      case "footer":
        return "contentinfo";
      case "main":
        return "main";
      case "section":
        return "region";
      case "article":
        return "article";
    }
    return null;
  }

  /**
   * Simplified accessible name computation.
   */
  getComputedName(element: HTMLElement): string {
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute("aria-labelledby");
    if (ariaLabelledBy) {
      const doc = element.ownerDocument;
      const labelElement = doc.getElementById(ariaLabelledBy);
      if (labelElement) return (labelElement as HTMLElement).innerText;
    }

    const tag = element.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      const placeholder = element.getAttribute("placeholder");
      if (placeholder) return placeholder;
    }

    return (element as HTMLElement).innerText || element.getAttribute("title") || "";
  }

  isFocusable(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute("tabindex");
    if (tabIndex !== null && parseInt(tabIndex) >= 0) {
      return true;
    }

    const tag = element.tagName.toLowerCase();
    const isInteractive = ["button", "a", "input", "select", "textarea"].includes(tag);
    const isNotDisabled = !element.hasAttribute("disabled");

    return isInteractive && isNotDisabled;
  }

  getComputedStyle(element: HTMLElement): CSSStyleDeclaration {
    const view = element.ownerDocument.defaultView || window;
    return view.getComputedStyle(element);
  }
}
