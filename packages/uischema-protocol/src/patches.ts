import type { UISchemaNode } from "@uischema/core";

/**
 * Patch operation types for JSONL streaming
 * Aligns with json-render, AG-UI, Open-JSON-UI patterns
 */
export type PatchOperation = {
  op: "set" | "add" | "replace" | "remove";
  path: string;
  value?: unknown;
};

/**
 * Parse JSON Pointer path to array of segments
 */
const parsePath = (path: string): string[] => {
  if (path === "" || path === "/") {
    return [];
  }
  if (!path.startsWith("/")) {
    throw new Error(`Path must start with "/": ${path}`);
  }
  return path
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
};

const parseArrayIndex = (segment: string): number | "append" | null => {
  if (segment === "-") {
    return "append";
  }
  if (!/^(0|[1-9]\d*)$/.test(segment)) {
    return null;
  }
  return Number(segment);
};

/**
 * Apply a single patch operation to a node tree using structural sharing.
 */
const applyPatch = (target: UISchemaNode, patch: PatchOperation): UISchemaNode => {
  const segments = parsePath(patch.path);

  if (segments.length === 0) {
    switch (patch.op) {
      case "set":
      case "replace":
        if (patch.value === undefined) {
          throw new Error("Root patch requires a value.");
        }
        return patch.value as UISchemaNode;
      case "add":
        throw new Error("Cannot add at the document root.");
      case "remove":
        throw new Error("Cannot remove the document root.");
    }
  }

  const update = (obj: any, pathSegments: string[]): any => {
    const [head, ...tail] = pathSegments;
    const isLast = tail.length === 0;

    if (isLast) {
      if (Array.isArray(obj)) {
        const index = parseArrayIndex(head);
        if (index === null) {
          throw new Error(`Invalid array index at path: ${patch.path}`);
        }
        const next = [...obj];
        if (patch.op === "set" || patch.op === "replace") {
          if (index === "append") {
            throw new Error(`Cannot ${patch.op} at append position: ${patch.path}`);
          }
          next[index] = patch.value;
        } else if (patch.op === "add") {
          if (index === "append") {
            next.push(patch.value);
          } else {
            next.splice(index as number, 0, patch.value);
          }
        } else if (patch.op === "remove") {
          if (index === "append") {
            throw new Error(`Cannot remove at append position: ${patch.path}`);
          }
          next.splice(index as number, 1);
        }
        return next;
      } else {
        if (patch.op === "set" || patch.op === "replace") {
          return { ...obj, [head]: patch.value };
        } else if (patch.op === "add") {
          const val = obj[head];
          if (Array.isArray(val)) {
            return { ...obj, [head]: [...val, patch.value] };
          } else if (val === undefined) {
            return { ...obj, [head]: [patch.value] };
          } else {
            throw new Error(`Cannot add to non-array at path: ${patch.path}`);
          }
        } else if (patch.op === "remove") {
          const next = { ...obj };
          delete next[head];
          return next;
        }
      }
    }

    // Recursive case
    const currentVal = obj[head];
    let nextVal;
    if (currentVal === undefined) {
      if (patch.op === "remove") {
        return obj; // Path doesn't exist, nothing to remove
      }
      const nextIsArray = parseArrayIndex(tail[0]) !== null;
      nextVal = update(nextIsArray ? [] : {}, tail);
    } else {
      nextVal = update(currentVal, tail);
    }

    if (nextVal === currentVal) {
      return obj;
    }

    if (Array.isArray(obj)) {
      const next = [...obj];
      next[head as any] = nextVal;
      return next;
    } else {
      return { ...obj, [head]: nextVal };
    }
  };

  return update(target, segments);
};

/**
 * Apply multiple patch operations to a node tree
 */
export const applyPatches = (root: UISchemaNode, patches: PatchOperation[]): UISchemaNode => {
  let result = root;
  for (const patch of patches) {
    result = applyPatch(result, patch);
  }
  return result;
};

/**
 * Parse JSONL patch stream (one operation per line)
 */
export const parseJSONLPatches = (jsonl: string): PatchOperation[] => {
  const lines = jsonl.trim().split("\n").filter(Boolean);
  return lines.map((line) => {
    try {
      return JSON.parse(line) as PatchOperation;
    } catch (error) {
      throw new Error(`Invalid JSON in patch line: ${line}. Error: ${error}`);
    }
  });
};

/**
 * Serialize patch operations to JSONL format
 */
export const serializePatchesToJSONL = (patches: PatchOperation[]): string => {
  return patches.map((patch) => JSON.stringify(patch)).join("\n");
};

/**
 * Create patch operations for common updates
 */
export const createSetPatch = (path: string, value: unknown): PatchOperation => ({
  op: "set",
  path,
  value
});

export const createAddPatch = (path: string, value: unknown): PatchOperation => ({
  op: "add",
  path,
  value
});

export const createReplacePatch = (path: string, value: unknown): PatchOperation => ({
  op: "replace",
  path,
  value
});

export const createRemovePatch = (path: string): PatchOperation => ({
  op: "remove",
  path
});
