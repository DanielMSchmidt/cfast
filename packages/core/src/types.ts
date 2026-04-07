import type { Schema, ParsedEnv } from "@cfast/env";
import type { Permissions } from "@cfast/permissions";
import type { ReactNode, ComponentType } from "react";

/**
 * Configuration object for {@link createApp}.
 *
 * @typeParam TSchema - The env schema type from `@cfast/env`.
 * @typeParam TPermissions - The permissions definition from `@cfast/permissions`.
 */
export type CreateAppConfig<
  TSchema extends Schema,
  TPermissions extends Permissions,
> = {
  /** The environment variable schema. Validated at `app.init()` time via `@cfast/env`. */
  env: TSchema;
  /** The permissions config from `definePermissions()`. Made available to all plugins. */
  permissions: TPermissions;
};

/**
 * The context object passed to a plugin's `setup()` function.
 *
 * Contains the current request, validated env, and all values provided by prior plugins
 * (typed via `TRequires`).
 *
 * @typeParam TRequires - Intersection of prior plugin provides (e.g., `AuthPluginProvides`).
 */
export type PluginSetupContext<TRequires> = {
  /** The incoming HTTP request for the current invocation. */
  request: Request;
  /** The validated environment bindings. */
  env: Record<string, unknown>;
} & TRequires;

/**
 * A cfast plugin definition created by {@link definePlugin}.
 *
 * Plugins provide server-side context values via `setup()`, optional client-side React providers,
 * and optional client-side values accessible via `useApp()`.
 *
 * @typeParam TName - The unique plugin name, used as the namespace key in `AppContext`.
 * @typeParam TProvides - The type returned by `setup()`, accessible as `ctx[name]`.
 * @typeParam TRequires - The context shape this plugin depends on from prior plugins.
 * @typeParam TClient - Client-side values exposed via `useApp()`.
 */
export type CfastPlugin<
  TName extends string = string,
  TProvides = unknown,
  TRequires = unknown,
  TClient = unknown,
> = {
  /** Unique identifier used as the namespace key in the app context. */
  name: TName;
  /**
   * Optional list of plugin references this plugin depends on.
   *
   * When supplied, `setup(ctx)` is automatically typed with the union of each
   * required plugin's provides, and `app.use(this)` will throw at registration
   * time if any of these plugins have not yet been registered.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requires?: readonly CfastPlugin<string, unknown, any, unknown>[];
  /** Called per-request to produce the values this plugin provides. */
  setup: (
    ctx: PluginSetupContext<TRequires>,
  ) => TProvides | Promise<TProvides>;
  /** Optional client-side React provider, composed into `app.Provider`. */
  Provider?: ComponentType<{ children: ReactNode }>;
  /** Optional client-side values exposed via `useApp()`. */
  client?: TClient;
};

/**
 * Converts a union type to an intersection type.
 *
 * Used by {@link RequiresFromPlugins} to merge each required plugin's provides
 * into a single intersection that becomes the `setup(ctx)` parameter shape.
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Derives the `TRequires` shape for a `setup(ctx)` parameter from an array of
 * plugin references passed via `definePlugin({ requires: [...] })`.
 *
 * Each plugin in the tuple contributes `{ [name]: provides }` and the results
 * are intersected so `ctx` exposes every required plugin's namespace at the
 * right key. An empty `requires` tuple resolves to `unknown` (no extra fields).
 *
 * Implementation note: we walk the tuple positionally with a mapped type
 * (`{ [K in keyof R]: ... }[number]`) instead of using `R[number]` directly.
 * The mapped form preserves per-element inference of `N` and `P`, so multiple
 * required plugins each contribute their own `{ name: provides }` shape rather
 * than collapsing into a union of widened `provides` values.
 */
export type RequiresFromPlugins<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  R extends readonly CfastPlugin<string, unknown, any, unknown>[],
> = R extends readonly []
  ? unknown
  : UnionToIntersection<
      {
        [K in keyof R]: R[K] extends CfastPlugin<
          infer N,
          infer P,
          unknown,
          unknown
        >
          ? { [Key in N]: P }
          : never;
      }[number]
    >;

/**
 * Minimal plugin shape used internally for runtime iteration in `buildApp`.
 *
 * The `setup` parameter uses `PluginSetupContext<never>` so that every concrete
 * `CfastPlugin<TName, TProvides, TRequires, TClient>` is structurally assignable
 * to this type without casting — `never` extends any `TRequires`, satisfying
 * function parameter contravariance.
 *
 * At the call site in `context()`, we use a single documented cast to invoke
 * `setup` with the actual runtime context, since TypeScript cannot prove that
 * accumulated plugin results satisfy each plugin's `TRequires`.
 *
 * This type is internal and not part of the public API.
 */
export type RuntimePlugin = {
  /** Plugin name used as the namespace key. */
  name: string;
  /**
   * Optional dependencies declared via `definePlugin({ requires: [...] })`.
   *
   * `app.use(plugin)` walks this list and verifies each entry is already
   * registered, throwing `CfastConfigError` immediately if not.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requires?: readonly CfastPlugin<string, unknown, any, unknown>[];
  /**
   * Setup function called per-request.
   *
   * Typed with `never` parameter to make all `CfastPlugin` subtypes assignable.
   * Called at runtime via a documented cast in `context()`.
   */
  setup: (ctx: PluginSetupContext<never>) => unknown | Promise<unknown>;
  /** Optional client-side React provider. */
  Provider?: ComponentType<{ children: ReactNode }>;
  /** Optional client-side values. */
  client?: unknown;
};

/**
 * Utility type that extracts `{ [name]: ReturnType<setup> }` from a plugin definition.
 *
 * Use this to create a type token that dependent plugins can reference via `definePlugin<TRequires>()`.
 *
 * @typeParam T - A `CfastPlugin` type to extract provides from.
 */
export type PluginProvides<T> = T extends CfastPlugin<
  infer N,
  infer P,
  unknown,
  unknown
>
  ? { [K in N]: P }
  : never;

/**
 * The accumulated per-request context after all plugins have run.
 *
 * Contains the validated env plus each plugin's namespaced values.
 *
 * @typeParam TSchema - The env schema type.
 * @typeParam TPluginContext - The intersection of all registered plugins' provides.
 */
export type AppContext<
  TSchema extends Schema,
  TPluginContext,
> = {
  /** The validated environment bindings. */
  env: ParsedEnv<TSchema>;
} & TPluginContext;

/**
 * Route handler arguments passed through from React Router loaders and actions.
 */
export type RouteArgs = {
  /** The incoming HTTP request. */
  request: Request;
  /** URL route parameters (e.g., `{ postId: "abc" }`). */
  params: Record<string, string | undefined>;
  /** The React Router context object (contains `cloudflare.env`, etc.). */
  context: unknown;
};

/**
 * The app object returned by `createApp()` and extended by `.use()` calls.
 *
 * Provides methods for environment initialization, per-request context creation,
 * route handler wrappers, plugin registration, and a composed React provider.
 *
 * @typeParam TSchema - The env schema type.
 * @typeParam TPermissions - The permissions definition type.
 * @typeParam TPluginContext - The accumulated plugin context type.
 * @typeParam TClientContext - The accumulated client-side context type.
 */
export type App<
  TSchema extends Schema,
  TPermissions extends Permissions,
  TPluginContext,
  TClientContext,
> = {
  /** Validates and initializes environment bindings. Call once in the Workers entry point. */
  init(rawEnv: Record<string, unknown>): void;
  /** Returns the typed, validated environment. */
  env(): ParsedEnv<TSchema>;
  /** Builds the per-request context by running each plugin's `setup()` in order. */
  context(
    request: Request,
    context?: unknown,
  ): Promise<AppContext<TSchema, TPluginContext>>;
  /** Convenience wrapper for React Router loaders that auto-creates the app context. */
  loader<T>(
    fn: (
      ctx: AppContext<TSchema, TPluginContext>,
      args: RouteArgs,
    ) => T | Promise<T>,
  ): (args: RouteArgs) => Promise<T>;
  /** Convenience wrapper for React Router actions that auto-creates the app context. */
  action<T>(
    fn: (
      ctx: AppContext<TSchema, TPluginContext>,
      args: RouteArgs,
    ) => T | Promise<T>,
  ): (args: RouteArgs) => Promise<T>;
  /** Registers a plugin, extending the app's context type. Throws on duplicate names. */
  use<
    TName extends string,
    TProvides,
    TClient,
  >(
    plugin: CfastPlugin<TName, TProvides, TPluginContext, TClient>,
  ): App<
    TSchema,
    TPermissions,
    TPluginContext & { [K in TName]: TProvides },
    TClientContext & (TClient extends object ? { [K in TName]: TClient } : unknown)
  >;
  /** Composed React provider tree from all registered plugins. */
  Provider: ComponentType<{ children: ReactNode }>;
  /** The permissions config passed to `createApp()`. */
  permissions: TPermissions;
};
