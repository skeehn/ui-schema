// Patch Operations
export {
  applyPatches,
  parseJSONLPatches,
  serializePatchesToJSONL,
  createSetPatch,
  createAddPatch,
  createReplacePatch,
  createRemovePatch,
  type PatchOperation
} from "./patches";

// Events
export {
  createUIUpdate,
  createUIInteraction,
  isUIUpdate,
  isUIInteraction,
  serializeEvent,
  deserializeEvent,
  type UIUpdateEvent,
  type UIInteractionEvent,
  type UIEvent
} from "./events";

// State
export {
  createWidgetState,
  createUIWidgetState,
  updateModelContent,
  updatePrivateContent,
  updatePrivateState,
  getModelContent,
  mergeState,
  type WidgetState,
  type PrivateUIState,
  type UIWidgetState
} from "./state";
