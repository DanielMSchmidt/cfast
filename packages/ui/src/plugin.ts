import { createContext, useContext, createElement } from "react";
import type { UIPlugin, UIPluginComponents } from "./types.js";
import { headlessDefaults } from "./headless-defaults.js";

const UIPluginContext = createContext<UIPlugin | null>(null);

export function createUIPlugin(
  config: { components: Partial<UIPluginComponents> },
): UIPlugin {
  return { components: config.components };
}

export function UIPluginProvider({
  plugin,
  children,
}: {
  plugin: UIPlugin;
  children: React.ReactNode;
}) {
  return createElement(UIPluginContext.Provider, { value: plugin }, children);
}

export function useUIPlugin(): UIPlugin | null {
  return useContext(UIPluginContext);
}

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
