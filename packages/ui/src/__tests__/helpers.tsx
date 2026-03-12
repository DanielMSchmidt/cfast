import { createElement } from "react";
import type { ReactNode } from "react";
import { UIPluginProvider, createUIPlugin } from "../plugin.js";
import type { UIPluginComponents } from "../types.js";

/**
 * Wraps children in a UIPluginProvider with the given (partial) components.
 */
export function withUIPlugin(
  components: Partial<UIPluginComponents> = {},
) {
  const plugin = createUIPlugin({ components });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(UIPluginProvider, { plugin, children });
  };
}

/**
 * Combines multiple wrappers into a single wrapper.
 */
export function withAll(...wrappers: Array<(props: { children: ReactNode }) => ReactNode>) {
  return function CombinedWrapper({ children }: { children: ReactNode }) {
    return wrappers.reduceRight(
      (acc, Wrapper) => createElement(Wrapper as React.ComponentType<{ children: ReactNode }>, { children: acc }),
      children as ReactNode,
    );
  };
}
