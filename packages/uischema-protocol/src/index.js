"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeState = exports.getModelContent = exports.updatePrivateState = exports.updatePrivateContent = exports.updateModelContent = exports.createUIWidgetState = exports.createWidgetState = exports.deserializeEvent = exports.serializeEvent = exports.isUIInteraction = exports.isUIUpdate = exports.createUIInteraction = exports.createUIUpdate = exports.createRemovePatch = exports.createReplacePatch = exports.createAddPatch = exports.createSetPatch = exports.serializePatchesToJSONL = exports.parseJSONLPatches = exports.applyPatches = void 0;
// Patch Operations
var patches_1 = require("./patches");
Object.defineProperty(exports, "applyPatches", { enumerable: true, get: function () { return patches_1.applyPatches; } });
Object.defineProperty(exports, "parseJSONLPatches", { enumerable: true, get: function () { return patches_1.parseJSONLPatches; } });
Object.defineProperty(exports, "serializePatchesToJSONL", { enumerable: true, get: function () { return patches_1.serializePatchesToJSONL; } });
Object.defineProperty(exports, "createSetPatch", { enumerable: true, get: function () { return patches_1.createSetPatch; } });
Object.defineProperty(exports, "createAddPatch", { enumerable: true, get: function () { return patches_1.createAddPatch; } });
Object.defineProperty(exports, "createReplacePatch", { enumerable: true, get: function () { return patches_1.createReplacePatch; } });
Object.defineProperty(exports, "createRemovePatch", { enumerable: true, get: function () { return patches_1.createRemovePatch; } });
// Events
var events_1 = require("./events");
Object.defineProperty(exports, "createUIUpdate", { enumerable: true, get: function () { return events_1.createUIUpdate; } });
Object.defineProperty(exports, "createUIInteraction", { enumerable: true, get: function () { return events_1.createUIInteraction; } });
Object.defineProperty(exports, "isUIUpdate", { enumerable: true, get: function () { return events_1.isUIUpdate; } });
Object.defineProperty(exports, "isUIInteraction", { enumerable: true, get: function () { return events_1.isUIInteraction; } });
Object.defineProperty(exports, "serializeEvent", { enumerable: true, get: function () { return events_1.serializeEvent; } });
Object.defineProperty(exports, "deserializeEvent", { enumerable: true, get: function () { return events_1.deserializeEvent; } });
// State
var state_1 = require("./state");
Object.defineProperty(exports, "createWidgetState", { enumerable: true, get: function () { return state_1.createWidgetState; } });
Object.defineProperty(exports, "createUIWidgetState", { enumerable: true, get: function () { return state_1.createUIWidgetState; } });
Object.defineProperty(exports, "updateModelContent", { enumerable: true, get: function () { return state_1.updateModelContent; } });
Object.defineProperty(exports, "updatePrivateContent", { enumerable: true, get: function () { return state_1.updatePrivateContent; } });
Object.defineProperty(exports, "updatePrivateState", { enumerable: true, get: function () { return state_1.updatePrivateState; } });
Object.defineProperty(exports, "getModelContent", { enumerable: true, get: function () { return state_1.getModelContent; } });
Object.defineProperty(exports, "mergeState", { enumerable: true, get: function () { return state_1.mergeState; } });
//# sourceMappingURL=index.js.map