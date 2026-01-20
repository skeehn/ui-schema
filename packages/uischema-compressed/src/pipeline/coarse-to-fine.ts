import type { UISchemaNode } from "@uischema/core";

export type PatchOperation = {
  op: "set" | "add" | "replace" | "remove";
  path: string;
  value?: unknown;
};

const parsePath = (path: string) =>
  path
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

const setAtPath = (target: unknown, path: string[], value: unknown) => {
  let current: any = target;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
};

const removeAtPath = (target: unknown, path: string[]) => {
  let current: any = target;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (current[key] === undefined) {
      return;
    }
    current = current[key];
  }
  delete current[path[path.length - 1]];
};

export const applyPatches = (root: UISchemaNode, patches: PatchOperation[]): UISchemaNode => {
  const clone: UISchemaNode = JSON.parse(JSON.stringify(root));
  patches.forEach((patch) => {
    const segments = parsePath(patch.path);
    if (segments.length === 0) {
      return;
    }
    if (patch.op === "remove") {
      removeAtPath(clone, segments);
      return;
    }
    setAtPath(clone, segments, patch.value);
  });
  return clone;
};

export const generateLayoutSkeleton = (description: string): UISchemaNode => ({
  type: "Container",
  props: { ariaLabel: "Generated layout container", description },
  children: [
    {
      type: "Row",
      props: { ariaLabel: "Header row" },
      children: [
        { type: "Text", props: { text: "Title", ariaLabel: "Title text" } },
        { type: "Spacer", props: {} }
      ]
    },
    {
      type: "Grid",
      props: { ariaLabel: "Content grid" },
      children: [
        { type: "Card", props: { ariaLabel: "Card" } },
        { type: "Card", props: { ariaLabel: "Card" } }
      ]
    }
  ]
});
