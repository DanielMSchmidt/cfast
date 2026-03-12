// Client-only exports — hooks that depend on browser APIs / react-router
// Components will be added in subsequent PRs

// Re-export plugin API for client usage
export { createUIPlugin, UIPluginProvider, useUIPlugin, useComponent } from "./plugin.js";
