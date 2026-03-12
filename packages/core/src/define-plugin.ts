import type { ComponentType, ReactNode } from "react";

import type { CfastPlugin, PluginSetupContext } from "./types";

/**
 * Define a cfast plugin.
 *
 * No dependencies (types fully inferred):
 *   definePlugin({ name: "db", setup: () => ({ query: ... }) })
 *
 * With dependencies (curried form for partial type inference):
 *   definePlugin<AuthPluginProvides>()({ name: "acl", setup: (ctx) => ... })
 */

// Direct form: no dependencies, full inference
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

// Curried form: specify TRequires, infer the rest
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

export function definePlugin(config?: unknown): unknown {
  if (config === undefined) {
    return (innerConfig: unknown) => innerConfig;
  }
  return config;
}
