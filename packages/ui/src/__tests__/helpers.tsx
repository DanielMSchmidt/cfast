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
 * Creates a mock for the react-router useLoaderData hook.
 * To use: vi.mock("react-router", () => ({ ...actual, useLoaderData: () => mockData }))
 */
export function createMockLoaderData(permissions: Record<string, { permitted: boolean; invisible: boolean; reason: string | null }> = {}) {
  return {
    _actionPermissions: permissions,
  };
}

/**
 * Creates a mock ClientDescriptor for testing.
 */
export function createMockDescriptor(actionNames: string[]): {
  _brand: "ActionClientDescriptor";
  actionNames: readonly string[];
  permissionsKey: string;
} {
  return {
    _brand: "ActionClientDescriptor",
    actionNames,
    permissionsKey: `test_${actionNames.join("_")}`,
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
