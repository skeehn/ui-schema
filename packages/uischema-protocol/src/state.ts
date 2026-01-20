import type { UISchemaNode } from "@uischema/core";

/**
 * Basic state synchronization for widget-scoped and private UI state
 * Minimal implementation (full sync deferred to v1.1+)
 */

/**
 * Widget-scoped state (persisted per message)
 * Exposed to the agent via modelContent
 */
export type WidgetState = {
  modelContent: Record<string, unknown>;
  privateContent?: Record<string, unknown>;
  imageIds?: string[];
};

/**
 * Private UI-only state (not exposed to agent)
 */
export type PrivateUIState = Record<string, unknown>;

/**
 * Combined state for a UI widget
 */
export type UIWidgetState = {
  widgetState: WidgetState;
  privateState: PrivateUIState;
};

/**
 * Create initial widget state
 */
export const createWidgetState = (initialContent?: Record<string, unknown>): WidgetState => {
  return {
    modelContent: initialContent ?? {},
    privateContent: {},
    imageIds: []
  };
};

/**
 * Create initial UI widget state
 */
export const createUIWidgetState = (initialContent?: Record<string, unknown>): UIWidgetState => {
  return {
    widgetState: createWidgetState(initialContent),
    privateState: {}
  };
};

/**
 * Update model content (exposed to agent)
 */
export const updateModelContent = (
  state: UIWidgetState,
  updates: Record<string, unknown>
): UIWidgetState => {
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

/**
 * Update private content (not exposed to agent)
 */
export const updatePrivateContent = (
  state: UIWidgetState,
  updates: Record<string, unknown>
): UIWidgetState => {
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

/**
 * Update private UI state (completely hidden from agent)
 */
export const updatePrivateState = (
  state: UIWidgetState,
  updates: Record<string, unknown>
): UIWidgetState => {
  return {
    ...state,
    privateState: {
      ...state.privateState,
      ...updates
    }
  };
};

/**
 * Get model-visible content (for agent context)
 */
export const getModelContent = (state: UIWidgetState): Record<string, unknown> => {
  return state.widgetState.modelContent;
};

/**
 * Merge state updates (for state synchronization)
 */
export const mergeState = (
  current: UIWidgetState,
  updates: Partial<UIWidgetState>
): UIWidgetState => {
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
