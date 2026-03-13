import type { ComponentType, ReactNode } from "react";

import type { CfastPlugin, PluginSetupContext } from "./types";

/**
 * Defines a cfast plugin for use with `createApp().use()`.
 *
 * Has two call signatures:
 * - **Direct form** (no dependencies): `definePlugin({ name, setup, ... })` -- types are fully inferred.
 * - **Curried form** (with dependencies): `definePlugin<TRequires>()({ name, setup, ... })` --
 *   specify `TRequires` explicitly so `setup(ctx)` receives typed prior-plugin context.
 *
 * @param config - Plugin configuration with `name`, `setup`, and optional `Provider`/`client`.
 * @returns A `CfastPlugin` instance ready to pass to `app.use()`.
 *
 * @example
 * ```ts
 * // Leaf plugin (no dependencies)
 * const analyticsPlugin = definePlugin({
 *   name: 'analytics',
 *   setup(ctx) {
 *     return { track: (event: string) => {} };
 *   },
 * });
 *
 * // Plugin with dependencies (curried)
 * import type { AuthPluginProvides } from '@cfast/auth';
 * const dbPlugin = definePlugin<AuthPluginProvides>()({
 *   name: 'db',
 *   setup(ctx) {
 *     ctx.auth.user; // typed from AuthPluginProvides
 *     return { client: createDb({}) };
 *   },
 * });
 * ```
 */

// Direct form: no dependencies, full inference
export function definePlugin<
  TName extends string,
  TProvides,
  TClient = unknown,
>(config: {
  name: TName;
  setup: (ctx: PluginSetupContext<unknown>) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
}): CfastPlugin<TName, Awaited<TProvides>, unknown, TClient>;

// Curried form: specify TRequires, infer the rest
export function definePlugin<TRequires>(): <
  TName extends string,
  TProvides,
  TClient = unknown,
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
