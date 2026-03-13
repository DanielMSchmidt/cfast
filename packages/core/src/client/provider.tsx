import { createContext, type ReactNode, type ComponentType } from "react";
import type { RuntimePlugin } from "../types";

/** React context holding client-side plugin values for `useApp()`. */
export const CoreContext = createContext<Record<string, unknown> | null>(null);

type ProviderComponent = ComponentType<{ children: ReactNode }>;

/**
 * Creates a composed React provider that nests all plugin providers and exposes
 * client-side plugin values via {@link CoreContext}.
 *
 * Plugins are nested in registration order (first registered = outermost).
 *
 * @param plugins - The registered plugins, each with optional `Provider` and `client`.
 * @returns A React component that wraps children with all plugin providers and the core context.
 */
export function createCoreProvider(
  plugins: Pick<RuntimePlugin, "name" | "Provider" | "client">[],
): ProviderComponent {
  // Build client context value from plugins that have client exports
  const clientValue: Record<string, unknown> = {};
  for (const plugin of plugins) {
    if (plugin.client) {
      clientValue[plugin.name] = plugin.client;
    }
  }

  // Collect providers in registration order
  const providers: ProviderComponent[] = [];
  for (const p of plugins) {
    if (p.Provider) {
      providers.push(p.Provider);
    }
  }

  return function CfastProvider({ children }: { children: ReactNode }) {
    // Nest providers: first registered = outermost
    let tree = children;
    for (let i = providers.length - 1; i >= 0; i--) {
      // providers[i] is guaranteed defined because we iterate within bounds.
      // The non-null assertion avoids an unnecessary cast; the array element
      // type is already ProviderComponent.
      const P = providers[i]!;
      tree = <P>{tree}</P>;
    }

    return (
      <CoreContext.Provider value={clientValue}>
        {tree}
      </CoreContext.Provider>
    );
  };
}
