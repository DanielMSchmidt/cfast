/** @module core */
// @cfast/core — app composition layer with plugin system
export { createApp } from "./create-app";
export { definePlugin, definePluginFor } from "./define-plugin";
export { createDefaultPlugins } from "./presets";
export { CfastPluginError, CfastConfigError } from "./errors";
export type {
  CfastPlugin,
  CreateAppConfig,
  PluginSetupContext,
  PluginContext,
  AppContext,
  PluginProvides,
  App,
  RouteArgs,
} from "./types";
export type {
  DefaultPluginsConfig,
  DefaultAuthProvides,
  DefaultDbProvides,
} from "./presets";
