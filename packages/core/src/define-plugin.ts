import type { ComponentType, ReactNode } from "react";

import type { CfastPlugin, PluginSetupContext } from "./types";

/**
 * Define a cfast plugin.
 *
 * Basic usage (no dependencies):
 *   definePlugin({ name: "db", setup: () => ({ query: ... }) })
 *
 * With dependencies on prior plugins:
 *   definePlugin<{ auth: AuthProvides }>()({ name: "acl", setup: (ctx) => ... })
 *
 * The curried form is needed when specifying TRequires so that TProvides
 * can still be inferred from the setup return type.
 */
export function definePlugin<TRequires>(): <
  TName extends string,
  TProvides,
  TClient = {},
>(config: {
  name: TName;
  setup: (ctx: PluginSetupContext<TRequires>) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
}) => CfastPlugin<TName, Awaited<TProvides>, TRequires, TClient>;

export function definePlugin<
  TName extends string,
  TProvides,
  TClient = {},
>(config: {
  name: TName;
  setup: (ctx: PluginSetupContext<{}>) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
}): CfastPlugin<TName, Awaited<TProvides>, {}, TClient>;

export function definePlugin(
  config?: Record<string, unknown>,
): unknown {
  if (config === undefined) {
    // Curried form: definePlugin<Requires>()(config)
    return (innerConfig: Record<string, unknown>) => innerConfig;
  }
  // Direct form: definePlugin(config)
  return config;
}
