import { defineEnv } from "@cfast/env";
import type { Schema, ParsedEnv } from "@cfast/env";
import type { Permissions } from "@cfast/permissions";
import type {
  CfastPlugin,
  RuntimePlugin,
  CreateAppConfig,
  AppContext,
  RouteArgs,
  App,
  PluginSetupContext,
} from "./types";
import { CfastPluginError, CfastConfigError } from "./errors";
import { createCoreProvider } from "./client/provider";

/**
 * Creates a cfast application instance that wires env, permissions, and plugins into a typed per-request context.
 *
 * Call `.use(plugin)` to register plugins, then use `app.context(request, context)` in route
 * loaders/actions to build the per-request context with all plugin values.
 *
 * @param config - Application configuration containing the env schema and permissions definition.
 * @returns An `App` instance with methods for context creation, route helpers, and plugin registration.
 *
 * @example
 * ```ts
 * import { createApp } from '@cfast/core';
 * import { authPlugin } from '@cfast/auth';
 * import { envSchema } from './env';
 * import { permissions } from './permissions';
 *
 * export const app = createApp({ env: envSchema, permissions })
 *   .use(authPlugin({ magicLink: { sendMagicLink: async ({ email, url }) => {} } }));
 * ```
 */
export function createApp<
  TSchema extends Schema,
  TPermissions extends Permissions,
>(config: CreateAppConfig<TSchema, TPermissions>): App<TSchema, TPermissions, unknown, unknown> {
  const envInstance = defineEnv(config.env);

  return buildApp<TSchema, TPermissions, unknown, unknown>(
    envInstance,
    config.permissions,
    [],
  );
}

function buildApp<
  TSchema extends Schema,
  TPermissions extends Permissions,
  TPluginContext,
  TClientContext,
>(
  envInstance: { init(raw: Record<string, unknown>): void; get(): ParsedEnv<TSchema> },
  permissions: TPermissions,
  plugins: RuntimePlugin[],
): App<TSchema, TPermissions, TPluginContext, TClientContext> {
  const pluginNames = new Set(plugins.map((p) => p.name));

  const app: App<TSchema, TPermissions, TPluginContext, TClientContext> = {
    permissions,

    init(rawEnv: Record<string, unknown>): void {
      envInstance.init(rawEnv);
    },

    env(): ParsedEnv<TSchema> {
      return envInstance.get();
    },

    async context(
      request: Request,
      _context?: unknown,
    ): Promise<AppContext<TSchema, TPluginContext>> {
      const env = envInstance.get();
      const accumulated: Record<string, unknown> = {};

      for (const plugin of plugins) {
        const setupCtx = {
          request,
          env,
          ...accumulated,
        };
        try {
          // Type boundary: RuntimePlugin.setup is typed as (ctx: never) => unknown
          // so that all CfastPlugin subtypes can be stored without casting. At
          // runtime, setupCtx contains { request, env, ...priorPluginResults },
          // which satisfies each plugin's TRequires. The type system cannot verify
          // this statically because the accumulated shape depends on registration
          // order, so we cast the context to the setup parameter type here.
          const result = await plugin.setup(
            setupCtx as PluginSetupContext<never>,
          );
          accumulated[plugin.name] = result;
        } catch (e) {
          if (e instanceof CfastPluginError) throw e;
          throw new CfastPluginError(plugin.name, e);
        }
      }

      // Type boundary: we dynamically build the context by accumulating each
      // plugin's setup result keyed by plugin name. The resulting object matches
      // AppContext<TSchema, TPluginContext> at runtime, but TypeScript cannot
      // track the incremental type growth through the for-loop, so we assert
      // the final shape here.
      return { env, ...accumulated } as AppContext<TSchema, TPluginContext>;
    },

    loader<T>(
      fn: (
        ctx: AppContext<TSchema, TPluginContext>,
        args: RouteArgs,
      ) => T | Promise<T>,
    ): (args: RouteArgs) => Promise<T> {
      return async (args: RouteArgs): Promise<T> => {
        const ctx = await app.context(args.request, args.context);
        return fn(ctx, args);
      };
    },

    action<T>(
      fn: (
        ctx: AppContext<TSchema, TPluginContext>,
        args: RouteArgs,
      ) => T | Promise<T>,
    ): (args: RouteArgs) => Promise<T> {
      return async (args: RouteArgs): Promise<T> => {
        const ctx = await app.context(args.request, args.context);
        return fn(ctx, args);
      };
    },

    use<TName extends string, TProvides, TClient>(
      plugin: CfastPlugin<TName, TProvides, TPluginContext, TClient>,
    ): App<
      TSchema,
      TPermissions,
      TPluginContext & { [K in TName]: TProvides },
      TClientContext & (TClient extends object ? { [K in TName]: TClient } : unknown)
    > {
      if (pluginNames.has(plugin.name)) {
        throw new CfastConfigError(
          `Duplicate plugin name "${plugin.name}". Each plugin must have a unique name.`,
        );
      }

      // Validate declared dependencies are registered. If a plugin lists
      // `requires: [authPlugin]` but `authPlugin` has not been `.use()`d
      // before this plugin, throw immediately with a clear, actionable error
      // instead of letting the misordering surface as an undefined access in
      // setup() at request time.
      if (plugin.requires) {
        for (const dep of plugin.requires) {
          if (!pluginNames.has(dep.name)) {
            throw new CfastConfigError(
              `Plugin "${plugin.name}" requires "${dep.name}" but it has not been registered. ` +
                `Did you call .use(${dep.name}Plugin) before .use(${plugin.name}Plugin)?`,
            );
          }
        }
      }

      // No cast needed: CfastPlugin<TName, TProvides, TPluginContext, TClient>
      // is structurally assignable to RuntimePlugin because RuntimePlugin.setup
      // uses PluginSetupContext<never> in the contravariant parameter position,
      // and never extends any TRequires.
      return buildApp<
        TSchema,
        TPermissions,
        TPluginContext & { [K in TName]: TProvides },
        TClientContext & (TClient extends object ? { [K in TName]: TClient } : unknown)
      >(envInstance, permissions, [...plugins, plugin]);
    },

    Provider: createCoreProvider(plugins),
  };

  return app;
}
