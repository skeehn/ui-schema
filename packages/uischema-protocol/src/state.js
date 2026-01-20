"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeState = exports.getModelContent = exports.updatePrivateState = exports.updatePrivateContent = exports.updateModelContent = exports.createUIWidgetState = exports.createWidgetState = void 0;
/**
 * Create initial widget state
 */
const createWidgetState = (initialContent) => {
    return {
        modelContent: initialContent ?? {},
        privateContent: {},
        imageIds: []
    };
};
exports.createWidgetState = createWidgetState;
/**
 * Create initial UI widget state
 */
const createUIWidgetState = (initialContent) => {
    return {
        widgetState: (0, exports.createWidgetState)(initialContent),
        privateState: {}
    };
};
exports.createUIWidgetState = createUIWidgetState;
/**
 * Update model content (exposed to agent)
 */
const updateModelContent = (state, updates) => {
    return {
        ...state,
        widgetState: {
            ...state.widgetState,
            modelContent: {
                ...state.widgetState.modelContent,
                ...updates
            }
        }
    };
};
exports.updateModelContent = updateModelContent;
/**
 * Update private content (not exposed to agent)
 */
const updatePrivateContent = (state, updates) => {
    return {
        ...state,
        widgetState: {
            ...state.widgetState,
            privateContent: {
                ...state.widgetState.privateContent,
                ...updates
            }
        }
    };
};
exports.updatePrivateContent = updatePrivateContent;
/**
 * Update private UI state (completely hidden from agent)
 */
const updatePrivateState = (state, updates) => {
    return {
        ...state,
        privateState: {
            ...state.privateState,
            ...updates
        }
    };
};
exports.updatePrivateState = updatePrivateState;
/**
 * Get model-visible content (for agent context)
 */
const getModelContent = (state) => {
    return state.widgetState.modelContent;
};
exports.getModelContent = getModelContent;
/**
 * Merge state updates (for state synchronization)
 */
const mergeState = (current, updates) => {
    return {
        widgetState: {
            ...current.widgetState,
            ...updates.widgetState,
            modelContent: {
                ...current.widgetState.modelContent,
                ...updates.widgetState?.modelContent
            },
            privateContent: {
                ...current.widgetState.privateContent,
                ...updates.widgetState?.privateContent
            },
            imageIds: updates.widgetState?.imageIds ?? current.widgetState.imageIds
        },
        privateState: {
            ...current.privateState,
            ...updates.privateState
        }
    };
};
exports.mergeState = mergeState;
//# sourceMappingURL=state.js.map