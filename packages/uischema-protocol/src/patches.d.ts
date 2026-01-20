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
 * Apply multiple patch operations to a node tree
 */
export declare const applyPatches: (root: UISchemaNode, patches: PatchOperation[]) => UISchemaNode;
/**
 * Parse JSONL patch stream (one operation per line)
 */
export declare const parseJSONLPatches: (jsonl: string) => PatchOperation[];
/**
 * Serialize patch operations to JSONL format
 */
export declare const serializePatchesToJSONL: (patches: PatchOperation[]) => string;
/**
 * Create patch operations for common updates
 */
export declare const createSetPatch: (path: string, value: unknown) => PatchOperation;
export declare const createAddPatch: (path: string, value: unknown) => PatchOperation;
export declare const createReplacePatch: (path: string, value: unknown) => PatchOperation;
export declare const createRemovePatch: (path: string) => PatchOperation;
//# sourceMappingURL=patches.d.ts.map