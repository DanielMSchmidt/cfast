import type { Schema, ParsedEnv } from "@cfast/env";
import type { Permissions } from "@cfast/permissions";
import type { ReactNode, ComponentType } from "react";

export type CreateAppConfig<
  TSchema extends Schema,
  TPermissions extends Permissions,
> = {
  env: TSchema;
  permissions: TPermissions;
};

export type PluginSetupContext<TRequires> = {
  request: Request;
  env: Record<string, unknown>;
} & TRequires;

export type CfastPlugin<
  TName extends string = string,
  TProvides = unknown,
  TRequires = unknown,
  TClient = unknown,
> = {
  name: TName;
  setup: (
    ctx: PluginSetupContext<TRequires>,
  ) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
};

// Utility type: extract { [name]: ReturnType<setup> } from a plugin
export type PluginProvides<T> = T extends CfastPlugin<
  infer N,
  infer P,
  unknown,
  unknown
>
  ? { [K in N]: P }
  : never;

// The accumulated context type after all plugins have run
export type AppContext<
  TSchema extends Schema,
  TPluginContext,
> = {
  env: ParsedEnv<TSchema>;
} & TPluginContext;

// Route handler args passed through from React Router
export type RouteArgs = {
  request: Request;
  params: Record<string, string | undefined>;
  context: unknown;
};

// The app object returned by createApp().use()...
export type App<
  TSchema extends Schema,
  TPermissions extends Permissions,
  TPluginContext,
  TClientContext,
> = {
  init(rawEnv: Record<string, unknown>): void;
  env(): ParsedEnv<TSchema>;
  context(
    request: Request,
    context?: unknown,
  ): Promise<AppContext<TSchema, TPluginContext>>;
  loader<T>(
    fn: (
      ctx: AppContext<TSchema, TPluginContext>,
      args: RouteArgs,
    ) => T | Promise<T>,
  ): (args: RouteArgs) => Promise<T>;
  action<T>(
    fn: (
      ctx: AppContext<TSchema, TPluginContext>,
      args: RouteArgs,
    ) => T | Promise<T>,
  ): (args: RouteArgs) => Promise<T>;
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
  Provider: ComponentType<{ children: ReactNode }>;
  permissions: TPermissions;
};
