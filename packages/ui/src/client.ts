// Client-only exports — hooks that depend on browser APIs / react-router

// Plugin API
export { createUIPlugin, UIPluginProvider, useUIPlugin, useComponent } from "./plugin.js";

// Hooks
export { useConfirm } from "./hooks/use-confirm.js";
export { useToast } from "./hooks/use-toast.js";
export { useActionToast } from "./hooks/use-action-toast.js";

// Headless components
export { PermissionGate } from "./components/permission-gate.js";
export { ActionButton } from "./components/action-button.js";
export { ConfirmProvider } from "./components/confirm-provider.js";
export { FormStatus } from "./components/form-status.js";
export { AvatarWithInitials, getInitials } from "./components/avatar-with-initials.js";
export { RoleBadge } from "./components/role-badge.js";
export { ImpersonationBanner } from "./components/impersonation-banner.js";
