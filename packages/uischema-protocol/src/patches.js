"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRemovePatch = exports.createReplacePatch = exports.createAddPatch = exports.createSetPatch = exports.serializePatchesToJSONL = exports.parseJSONLPatches = exports.applyPatches = void 0;
/**
 * Parse JSON Pointer path to array of segments
 */
const parsePath = (path) => {
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
const applyPatch = (target, patch) => {
    const clone = JSON.parse(JSON.stringify(target));
    const segments = parsePath(patch.path);
    if (segments.length === 0) {
        throw new Error("Path cannot be empty");
    }
    let current = clone;
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
            }
            else if (current[finalKey] === undefined) {
                current[finalKey] = [patch.value];
            }
            else {
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
const applyPatches = (root, patches) => {
    let result = root;
    for (const patch of patches) {
        result = applyPatch(result, patch);
    }
    return result;
};
exports.applyPatches = applyPatches;
/**
 * Parse JSONL patch stream (one operation per line)
 */
const parseJSONLPatches = (jsonl) => {
    const lines = jsonl.trim().split("\n").filter(Boolean);
    return lines.map((line) => {
        try {
            return JSON.parse(line);
        }
        catch (error) {
            throw new Error(`Invalid JSON in patch line: ${line}. Error: ${error}`);
        }
    });
};
exports.parseJSONLPatches = parseJSONLPatches;
/**
 * Serialize patch operations to JSONL format
 */
const serializePatchesToJSONL = (patches) => {
    return patches.map((patch) => JSON.stringify(patch)).join("\n");
};
exports.serializePatchesToJSONL = serializePatchesToJSONL;
/**
 * Create patch operations for common updates
 */
const createSetPatch = (path, value) => ({
    op: "set",
    path,
    value
});
exports.createSetPatch = createSetPatch;
const createAddPatch = (path, value) => ({
    op: "add",
    path,
    value
});
exports.createAddPatch = createAddPatch;
const createReplacePatch = (path, value) => ({
    op: "replace",
    path,
    value
});
exports.createReplacePatch = createReplacePatch;
const createRemovePatch = (path) => ({
    op: "remove",
    path
});
exports.createRemovePatch = createRemovePatch;
//# sourceMappingURL=patches.js.map