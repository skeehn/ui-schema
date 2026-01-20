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
  if (!path.startsWith("/")) {
    throw new Error(`Path must start with "/": ${path}`);
  }
  return path
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
};

/**
 * Apply a single patch operation to a node tree
 */
const applyPatch = (target: UISchemaNode, patch: PatchOperation): UISchemaNode => {
  const clone: UISchemaNode = JSON.parse(JSON.stringify(target));
  const segments = parsePath(patch.path);

  if (segments.length === 0) {
    throw new Error("Path cannot be empty");
  }

  let current: any = clone;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i];
    if (current[key] === undefined) {
      if (patch.op === "remove") {
        return clone; // Path doesn't exist, nothing to remove
      }
      current[key] = {};
    }
    current = current[key];
  }

  const finalKey = segments[segments.length - 1];

  switch (patch.op) {
    case "set":
    case "replace":
      current[finalKey] = patch.value;
      break;
    case "add":
      if (Array.isArray(current[finalKey])) {
        current[finalKey].push(patch.value);
      } else if (current[finalKey] === undefined) {
        current[finalKey] = [patch.value];
      } else {
        throw new Error(`Cannot add to non-array at path: ${patch.path}`);
      }
      break;
    case "remove":
      delete current[finalKey];
      break;
  }

  return clone;
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
