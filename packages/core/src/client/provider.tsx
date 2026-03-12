import React, { createContext, type ReactNode, type ComponentType } from "react";
import type { CfastPlugin } from "../types";

export const CoreContext = createContext<Record<string, unknown> | null>(null);

export function createCoreProvider(
  plugins: Pick<CfastPlugin, "name" | "Provider" | "client">[],
): ComponentType<{ children: ReactNode }> {
  // Build client context value from plugins that have client exports
  const clientValue: Record<string, unknown> = {};
  for (const plugin of plugins) {
    if (plugin.client) {
      clientValue[plugin.name] = plugin.client;
    }
  }

  // Collect providers in registration order
  const providers = plugins
    .filter(
      (p): p is typeof p & { Provider: ComponentType<{ children: ReactNode }> } =>
        p.Provider != null,
    )
    .map((p) => p.Provider);

  return function CfastProvider({ children }: { children: ReactNode }) {
    // Nest providers: first registered = outermost
    let tree = children;
    for (let i = providers.length - 1; i >= 0; i--) {
      const P = providers[i];
      if (P) {
        tree = <P>{tree}</P>;
      }
    }

    return (
      <CoreContext.Provider value={clientValue}>
        {tree}
      </CoreContext.Provider>
    );
  };
}
