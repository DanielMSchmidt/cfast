/** @module core */
// @cfast/core — app composition layer with plugin system
export { createApp } from "./create-app";
export { definePlugin } from "./define-plugin";
export { CfastPluginError, CfastConfigError } from "./errors";
export type {
  CfastPlugin,
  CreateAppConfig,
  PluginSetupContext,
  AppContext,
  PluginProvides,
  App,
  RouteArgs,
} from "./types";
