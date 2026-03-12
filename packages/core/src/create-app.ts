import { defineEnv } from "@cfast/env";
import type { Schema, ParsedEnv } from "@cfast/env";
import type { Permissions } from "@cfast/permissions";
import type {
  CfastPlugin,
  CreateAppConfig,
  AppContext,
  RouteArgs,
  App,
} from "./types";
import { CfastPluginError, CfastConfigError } from "./errors";
import { createCoreProvider } from "./client/provider";

export function createApp<
  TSchema extends Schema,
  TPermissions extends Permissions,
>(config: CreateAppConfig<TSchema, TPermissions>): App<TSchema, TPermissions, {}, {}> {
  const envInstance = defineEnv(config.env);

  return buildApp<TSchema, TPermissions, {}, {}>(
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
  plugins: CfastPlugin[],
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
          const result = await plugin.setup(setupCtx);
          accumulated[plugin.name] = result;
        } catch (e) {
          if (e instanceof CfastPluginError) throw e;
          throw new CfastPluginError(plugin.name, e);
        }
      }

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
      TClientContext & (TClient extends {} ? { [K in TName]: TClient } : {})
    > {
      if (pluginNames.has(plugin.name)) {
        throw new CfastConfigError(
          `Duplicate plugin name "${plugin.name}". Each plugin must have a unique name.`,
        );
      }

      return buildApp<
        TSchema,
        TPermissions,
        TPluginContext & { [K in TName]: TProvides },
        TClientContext & (TClient extends {} ? { [K in TName]: TClient } : {})
      >(envInstance, permissions, [...plugins, plugin as unknown as CfastPlugin]);
    },

    Provider: createCoreProvider(plugins),
  };

  return app;
}
