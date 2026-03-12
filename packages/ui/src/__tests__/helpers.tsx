import type { ReactNode } from "react";
import type { ClientDescriptor } from "@cfast/actions";
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
    return <UIPluginProvider plugin={plugin}>{children}</UIPluginProvider>;
  };
}

/**
 * Creates a mock ClientDescriptor for testing.
 */
export function createMockDescriptor(actionNames: string[]): ClientDescriptor {
  return {
    _brand: "ActionClientDescriptor" as const,
    actionNames,
    permissionsKey: "_actionPermissions",
  };
}

/**
 * Combines multiple wrappers into a single wrapper.
 */
export function withAll(...wrappers: Array<(props: { children: ReactNode }) => ReactNode>) {
  return function CombinedWrapper({ children }: { children: ReactNode }) {
    return wrappers.reduceRight(
      (acc, Wrapper) => <Wrapper>{acc}</Wrapper>,
      children as ReactNode,
    );
  };
}
