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

// Typed fields
export {
  DateField, BooleanField, NumberField, TextField,
  EmailField, UrlField, ImageField, FileField,
  RelationField, JsonField, fieldForColumn, fieldsForTable,
} from "./fields/index.js";
export { RoleBadge } from "./components/role-badge.js";
export { ImpersonationBanner } from "./components/impersonation-banner.js";

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
  ActionStatusResult,
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
