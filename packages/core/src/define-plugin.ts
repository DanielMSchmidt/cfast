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
  const TRequires extends readonly CfastPlugin<string, unknown, any, unknown>[] = [],
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
