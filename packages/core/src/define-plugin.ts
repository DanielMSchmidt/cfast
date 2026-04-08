import type { ComponentType, ReactNode } from "react";

import type {
  CfastPlugin,
  PluginSetupContext,
  RequiresFromPlugins,
} from "./types";

/**
 * Defines a cfast plugin for use with `createApp().use()`.
 *
 * Two equivalent forms are supported:
 *
 * 1. **Inferred form (preferred)** — pass plugin references in `requires` and the
 *    `setup(ctx)` parameter is automatically typed with their provides:
 *
 *    ```ts
 *    const dbPlugin = definePlugin({
 *      name: "db",
 *      requires: [authPlugin],
 *      setup(ctx) {
 *        ctx.auth.user; // typed from authPlugin
 *        return { client: createDb({}) };
 *      },
 *    });
 *    ```
 *
 *    No need to import or declare a `TRequires` type token — the dependency type
 *    flows directly from the registered plugin objects. Leaf plugins simply omit
 *    `requires` and get `ctx: { request, env }`.
 *
 * 2. **Curried form (legacy)** — kept for backward compatibility with code that
 *    only has access to a `PluginProvides<typeof authPlugin>` *type* (e.g. when
 *    you cannot import the actual plugin value):
 *
 *    ```ts
 *    definePlugin<AuthPluginProvides>()({
 *      name: "db",
 *      setup(ctx) { ctx.auth.user; return { ... }; },
 *    });
 *    ```
 *
 * Plugins declared via the inferred form also benefit from runtime validation:
 * `app.use(plugin)` throws a `CfastConfigError` if any plugin listed in
 * `requires` has not yet been registered, with a message that names the missing
 * dependency.
 *
 * @param config - Plugin configuration with `name`, `setup`, and optional
 *                 `requires`, `Provider`, `client`.
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
 * // Dependent plugin — requires inferred from plugin references
 * const dbPlugin = definePlugin({
 *   name: 'db',
 *   requires: [authPlugin],
 *   setup(ctx) {
 *     ctx.auth.user; // typed from authPlugin
 *     return { client: createDb({}) };
 *   },
 * });
 * ```
 */

// Inferred form: optional `requires` array of plugin references; setup ctx is
// derived from their provides. Works for leaf plugins too (omit `requires`).
export function definePlugin<
  TName extends string,
  TProvides,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TRequires extends readonly CfastPlugin<string, unknown, any, unknown, any>[] = [],
  TClient = unknown,
>(config: {
  name: TName;
  requires?: TRequires;
  setup: (
    ctx: PluginSetupContext<RequiresFromPlugins<TRequires>>,
  ) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
}): CfastPlugin<
  TName,
  Awaited<TProvides>,
  RequiresFromPlugins<TRequires>,
  TClient
>;

// Curried form (legacy): specify TRequires explicitly via a type token.
export function definePlugin<TRequires>(): <
  TName extends string,
  TProvides,
  TClient = unknown,
>(config: {
  name: TName;
  setup: (
    ctx: PluginSetupContext<TRequires>,
  ) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
}) => CfastPlugin<TName, Awaited<TProvides>, TRequires, TClient>;

export function definePlugin(config?: unknown): unknown {
  if (config === undefined) {
    // Curried legacy form: definePlugin<T>()(config)
    return (innerConfig: unknown) => innerConfig;
  }
  // Inferred form: return the config as the plugin object. The `requires`
  // field, if present, is preserved and consumed by `app.use()` to validate
  // that all dependencies have been registered.
  return config;
}

/**
 * Returns an env-typed `definePlugin` factory.
 *
 * The scaffolded `Cloudflare.Env` type from `worker-configuration.d.ts` is
 * not known to `@cfast/core` at build time, so the generic `definePlugin`
 * exposes `ctx.env` as the loose `Record<string, unknown>` shape and
 * consumers have to cast bindings (e.g. `ctx.env.DB as D1Database`). Apps
 * that want precise bindings call this factory once with their env type
 * and re-export the typed `definePlugin` from a local module:
 *
 * ```ts
 * // app/plugins/define-plugin.ts
 * import { definePluginFor } from "@cfast/core";
 *
 * export const definePlugin = definePluginFor<Cloudflare.Env>();
 * ```
 *
 * Plugin authors then import from their local module and get `ctx.env.DB`
 * typed as `D1Database` without any casting:
 *
 * ```ts
 * import { definePlugin } from "~/plugins/define-plugin";
 *
 * export const dbPlugin = definePlugin({
 *   name: "db",
 *   setup(ctx) {
 *     const db = ctx.env.DB; // D1Database, no cast
 *     return { client: createDb({ d1: db }) };
 *   },
 * });
 * ```
 *
 * The returned factory has the same shape as {@link definePlugin} (with the
 * curried legacy overload preserved) so existing code that switches from the
 * generic form to the env-typed form only needs an import swap.
 */
export function definePluginFor<TEnv>(): {
  <
    TName extends string,
    TProvides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TRequires extends readonly CfastPlugin<string, unknown, any, unknown, any>[] = [],
    TClient = unknown,
  >(config: {
    name: TName;
    requires?: TRequires;
    setup: (
      ctx: PluginSetupContext<RequiresFromPlugins<TRequires>, TEnv>,
    ) => TProvides | Promise<TProvides>;
    Provider?: ComponentType<{ children: ReactNode }>;
    client?: TClient;
  }): CfastPlugin<
    TName,
    Awaited<TProvides>,
    RequiresFromPlugins<TRequires>,
    TClient,
    TEnv
  >;
} {
  return (config) => config as never;
}
