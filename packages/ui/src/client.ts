// Client-only exports — hooks that depend on browser APIs / react-router

// Plugin API
export { createUIPlugin, UIPluginProvider, useUIPlugin, useComponent } from "./plugin.js";

// Headless components
export { PermissionGate } from "./components/permission-gate.js";
export { ActionButton } from "./components/action-button.js";
