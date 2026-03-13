import { createContext, useContext } from "react";
import type { UIPlugin, UIPluginComponents } from "./types.js";
import { headlessDefaults } from "./headless-defaults.js";

const UIPluginContext = createContext<UIPlugin | null>(null);

/**
 * Creates a {@link UIPlugin} that maps component slots to styled implementations.
 *
 * Slots not provided in the `components` map fall back to the unstyled HTML
 * defaults from the headless layer. This allows incremental adoption -- implement
 * only the slots your design system covers.
 *
 * @param config - Plugin configuration object.
 * @param config.components - Partial map of slot names to styled component implementations.
 *   See {@link UIPluginComponents} for available slots.
 * @returns A {@link UIPlugin} instance to pass to {@link UIPluginProvider}.
 *
 * @example
 * ```ts
 * import { createUIPlugin } from "@cfast/ui";
 *
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
 * React context provider that makes a {@link UIPlugin} available to all `@cfast/ui` components.
 *
 * Place this near the root of your component tree (typically in the root layout).
 * All headless components use {@link useComponent} internally to resolve their
 * styled implementations from this context.
 *
 * @param props - Component props.
 * @param props.plugin - The UI plugin created by {@link createUIPlugin}.
 * @param props.children - Child elements that can access the plugin via
 *   {@link useUIPlugin} or {@link useComponent}.
 * @returns A React element wrapping children with the UI plugin context.
 *
 * @example
 * ```tsx
 * import { UIPluginProvider, createUIPlugin } from "@cfast/ui";
 *
 * const plugin = createUIPlugin({ components: { button: MyButton } });
 *
 * function Root() {
 *   return (
 *     <UIPluginProvider plugin={plugin}>
 *       <App />
 *     </UIPluginProvider>
 *   );
 * }
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
 * Returns the current {@link UIPlugin} from React context.
 *
 * Returns `null` if no {@link UIPluginProvider} is present in the component tree.
 * Most consumers should use {@link useComponent} instead, which handles the
 * fallback to headless defaults automatically.
 *
 * @returns The active {@link UIPlugin}, or `null` if no provider is mounted.
 *
 * @example
 * ```ts
 * const plugin = useUIPlugin();
 * if (plugin?.components.button) {
 *   // A custom button implementation is available
 * }
 * ```
 */
export function useUIPlugin(): UIPlugin | null {
  return useContext(UIPluginContext);
}

/**
 * Resolves a component for a given {@link UIPluginComponents} slot.
 *
 * Looks up the slot in the current {@link UIPlugin} (via {@link useUIPlugin}).
 * If the plugin provides an implementation for the slot, that component is returned.
 * Otherwise, the headless HTML default is returned. This ensures every component
 * renders correctly even without a UI plugin installed.
 *
 * @typeParam K - The slot key from {@link UIPluginComponents}.
 * @param slot - The component slot name to resolve (e.g., `"button"`, `"table"`, `"chip"`).
 * @returns The component implementation for the given slot.
 *
 * @example
 * ```ts
 * function MyComponent() {
 *   const Button = useComponent("button");
 *   const Chip = useComponent("chip");
 *
 *   return <Button onClick={handleClick}>Click me</Button>;
 * }
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
