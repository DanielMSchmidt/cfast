import { createContext, useContext } from "react";
import type { UIPlugin, UIPluginComponents } from "./types.js";
import { headlessDefaults } from "./headless-defaults.js";

const UIPluginContext = createContext<UIPlugin | null>(null);

/**
 * Creates a UI plugin that maps component slots to styled implementations.
 * Slots not provided fall back to unstyled HTML defaults.
 *
 * @param config - Plugin configuration with component implementations
 * @returns A UIPlugin instance to pass to `UIPluginProvider`
 *
 * @example
 * ```ts
 * const joyPlugin = createUIPlugin({
 *   components: {
 *     button: JoyButton,
 *     table: JoyTable,
 *     chip: JoyChip,
 *   },
 * });
 * ```
 */
export function createUIPlugin(
  config: { components: Partial<UIPluginComponents> },
): UIPlugin {
  return { components: config.components };
}

/**
 * React context provider that makes a UI plugin available to all `@cfast/ui` components.
 * Place this near the root of your component tree.
 *
 * @param props.plugin - The UI plugin created by `createUIPlugin()`
 * @param props.children - Child elements that can access the plugin
 *
 * @example
 * ```tsx
 * <UIPluginProvider plugin={joyPlugin}>
 *   <App />
 * </UIPluginProvider>
 * ```
 */
export function UIPluginProvider({
  plugin,
  children,
}: {
  plugin: UIPlugin;
  children: React.ReactNode;
}) {
  return <UIPluginContext.Provider value={plugin}>{children}</UIPluginContext.Provider>;
}

/**
 * Returns the current UI plugin from context, or null if no provider is present.
 *
 * @returns The active UIPlugin or null
 */
export function useUIPlugin(): UIPlugin | null {
  return useContext(UIPluginContext);
}

/**
 * Resolves a component for a given plugin slot.
 * Returns the plugin's implementation if available, otherwise the headless default.
 *
 * @param slot - The component slot name to resolve
 * @returns The component for the given slot
 *
 * @example
 * ```ts
 * const Button = useComponent("button");
 * const Table = useComponent("table");
 * ```
 */
export function useComponent<K extends keyof UIPluginComponents>(
  slot: K,
): UIPluginComponents[K] {
  const plugin = useUIPlugin();
  const component = plugin?.components[slot];
  if (component) {
    return component as UIPluginComponents[K];
  }
  return headlessDefaults[slot] as UIPluginComponents[K];
}

// Re-export for convenience
export type { UIPlugin, UIPluginComponents };
