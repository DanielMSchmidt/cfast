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

// Typed fields
export {
  DateField, BooleanField, NumberField, TextField,
  EmailField, UrlField, ImageField, FileField,
  RelationField, JsonField, fieldForColumn, fieldsForTable,
} from "./fields/index.js";
export { RoleBadge } from "./components/role-badge.js";
export { ImpersonationBanner } from "./components/impersonation-banner.js";
export { EmptyState } from "./components/empty-state.js";
export { NavigationProgress } from "./components/navigation-progress.js";
export { PageContainer } from "./components/page-container.js";
export { AppShell, AppShellSidebar, AppShellHeader } from "./components/app-shell.js";
export { UserMenu } from "./components/user-menu.js";
export { DataTable } from "./components/data-table.js";
export { FilterBar } from "./components/filter-bar.js";
export { BulkActionBar } from "./components/bulk-action-bar.js";

// File components
export { DropZone } from "./components/drop-zone.js";
export { ImagePreview } from "./components/image-preview.js";
export { FileList } from "./components/file-list.js";

// Hooks — data
export { useColumnInference } from "./hooks/use-column-inference.js";

// Types
export type {
  UIPlugin,
  UIPluginComponents,
  ButtonSlotProps,
  TooltipSlotProps,
  ConfirmDialogSlotProps,
  TableSlotProps,
  TableSectionSlotProps,
  TableRowSlotProps,
  TableCellSlotProps,
  ChipSlotProps,
  AppShellSlotProps,
  SidebarSlotProps,
  PageContainerSlotProps,
  BreadcrumbSlotProps,
  ToastSlotProps,
  AlertSlotProps,
  DropZoneSlotProps,
  WhenForbidden,
  ColumnDef,
  ColumnShorthand,
  FilterType,
  FilterOption,
  FilterDef,
  DataTableProps,
  FilterBarProps,
  ListViewProps,
  DetailViewProps,
  BaseFieldProps,
  DateFieldProps,
  BooleanFieldProps,
  NumberFieldProps,
  TextFieldProps,
  EmailFieldProps,
  UrlFieldProps,
  ImageFieldProps,
  FileFieldProps,
  RelationFieldProps,
  JsonFieldProps,
  ToastType,
  ToastOptions,
  ToastApi,
  ConfirmOptions,
  NavigationItem,
  BreadcrumbItem,
  TabItem,
  BulkAction,
  ActionButtonProps,
  PermissionGateProps,
  FormStatusData,
  FormStatusProps,
  EmptyStateProps,
  AppShellProps,
  UserMenuLink,
  UserMenuProps,
  DropZoneProps,
  ImagePreviewProps,
  FileListFile,
  FileListProps,
  AvatarWithInitialsProps,
  RoleBadgeProps,
  ImpersonationBannerProps,
  NavigationProgressProps,
} from "./types.js";
