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
export declare const createWidgetState: (initialContent?: Record<string, unknown>) => WidgetState;
/**
 * Create initial UI widget state
 */
export declare const createUIWidgetState: (initialContent?: Record<string, unknown>) => UIWidgetState;
/**
 * Update model content (exposed to agent)
 */
export declare const updateModelContent: (state: UIWidgetState, updates: Record<string, unknown>) => UIWidgetState;
/**
 * Update private content (not exposed to agent)
 */
export declare const updatePrivateContent: (state: UIWidgetState, updates: Record<string, unknown>) => UIWidgetState;
/**
 * Update private UI state (completely hidden from agent)
 */
export declare const updatePrivateState: (state: UIWidgetState, updates: Record<string, unknown>) => UIWidgetState;
/**
 * Get model-visible content (for agent context)
 */
export declare const getModelContent: (state: UIWidgetState) => Record<string, unknown>;
/**
 * Merge state updates (for state synchronization)
 */
export declare const mergeState: (current: UIWidgetState, updates: Partial<UIWidgetState>) => UIWidgetState;
//# sourceMappingURL=state.d.ts.map