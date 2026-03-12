// Client-only exports — hooks that depend on browser APIs / react-router

// Plugin API
export { createUIPlugin, UIPluginProvider, useUIPlugin, useComponent } from "./plugin.js";

// Hooks
export { useActionStatus } from "./hooks/use-action-status.js";
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
export { DataTable } from "./components/data-table.js";
export { FilterBar } from "./components/filter-bar.js";
export { BulkActionBar } from "./components/bulk-action-bar.js";
export { useColumnInference } from "./hooks/use-column-inference.js";
export { DropZone } from "./components/drop-zone.js";
export { ImagePreview } from "./components/image-preview.js";
export { FileList } from "./components/file-list.js";
