import type { ComponentType, ReactNode } from "react";
import type { ClientDescriptor, ActionPermissionStatus } from "@cfast/actions";

// --- Plugin System ---

export type UIPluginComponents = {
  // Actions
  button: ComponentType<ButtonSlotProps>;
  tooltip: ComponentType<TooltipSlotProps>;
  confirmDialog: ComponentType<ConfirmDialogSlotProps>;
  // Data display
  table: ComponentType<TableSlotProps>;
  tableHead: ComponentType<TableSectionSlotProps>;
  tableBody: ComponentType<TableSectionSlotProps>;
  tableRow: ComponentType<TableRowSlotProps>;
  tableCell: ComponentType<TableCellSlotProps>;
  chip: ComponentType<ChipSlotProps>;
  // Layout
  appShell: ComponentType<AppShellSlotProps>;
  sidebar: ComponentType<SidebarSlotProps>;
  pageContainer: ComponentType<PageContainerSlotProps>;
  breadcrumb: ComponentType<BreadcrumbSlotProps>;
  // Feedback
  toast: ComponentType<ToastSlotProps>;
  alert: ComponentType<AlertSlotProps>;
  // File
  dropZone: ComponentType<DropZoneSlotProps>;
};

export type UIPlugin = {
  components: Partial<UIPluginComponents>;
};

// --- Slot Props ---

export type ButtonSlotProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "solid" | "soft" | "outlined" | "plain";
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  startDecorator?: ReactNode;
};

export type TooltipSlotProps = {
  title: string;
  children: ReactNode;
};

export type ConfirmDialogSlotProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

export type TableSlotProps = {
  children: ReactNode;
  hoverRow?: boolean;
};

export type TableSectionSlotProps = {
  children: ReactNode;
};

export type TableRowSlotProps = {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

export type TableCellSlotProps = {
  children: ReactNode;
  header?: boolean;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
};

export type ChipSlotProps = {
  children: ReactNode;
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  variant?: "solid" | "soft" | "outlined";
  size?: "sm" | "md" | "lg";
};

export type AppShellSlotProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
};

export type SidebarSlotProps = {
  children: ReactNode;
  items: NavigationItem[];
};

export type PageContainerSlotProps = {
  children: ReactNode;
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
  tabs?: TabItem[];
};

export type BreadcrumbSlotProps = {
  items: BreadcrumbItem[];
};

export type ToastSlotProps = {
  // Provider-level; individual toasts managed internally
  children?: ReactNode;
};

export type AlertSlotProps = {
  children: ReactNode;
  color?: "success" | "danger" | "warning" | "neutral";
  variant?: "soft" | "solid" | "outlined";
};

export type DropZoneSlotProps = {
  children: ReactNode;
  isDragOver: boolean;
  isInvalid: boolean;
  onDrop: (files: FileList) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onClick: () => void;
  accept?: string;
};

// --- WhenForbidden ---

export type WhenForbidden = "hide" | "disable" | "show";

// --- ColumnDef ---

export type ColumnDef<T = unknown> = {
  key: string;
  label?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string | number;
  priority?: number;
};

export type ColumnShorthand<T = unknown> = string | ColumnDef<T>;

// --- FilterDef ---

export type FilterType =
  | "text"
  | "select"
  | "multiSelect"
  | "relation"
  | "dateRange"
  | "boolean"
  | "number";

export type FilterOption = {
  label: string;
  value: string | number | boolean;
};

export type FilterDef = {
  column: string;
  type: FilterType;
  label?: string;
  options?: FilterOption[];
  table?: unknown; // DrizzleTable for relation filters
  display?: string;
  placeholder?: string;
};

// --- DataTableProps ---

export type DataTableProps<T = unknown> = {
  data: {
    items: T[];
    isLoading?: boolean;
  };
  table?: unknown; // DrizzleTable
  columns?: ColumnShorthand<T>[];
  actions?: ClientDescriptor;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string | number;
  emptyMessage?: string;
};

// --- FilterBarProps ---

export type FilterBarProps = {
  table?: unknown; // DrizzleTable
  filters: FilterDef[];
  searchable?: string[];
  values?: Record<string, unknown>;
  onChange?: (values: Record<string, unknown>) => void;
};

// --- ListViewProps ---

export type ListViewProps<T = unknown> = {
  title: string;
  data: {
    items: T[];
    isLoading?: boolean;
    total?: number;
    totalPages?: number;
    currentPage?: number;
    goToPage?: (page: number) => void;
    hasMore?: boolean;
    loadMore?: () => void;
  };
  table?: unknown; // DrizzleTable
  columns?: ColumnShorthand<T>[];
  actions?: ClientDescriptor;
  filters?: FilterDef[];
  searchable?: string[];
  createAction?: ClientDescriptor;
  createLabel?: string;
  selectable?: boolean;
  bulkActions?: BulkAction[];
  breadcrumb?: BreadcrumbItem[];
};

// --- DetailViewProps ---

export type DetailViewProps<T = unknown> = {
  title: string;
  table?: unknown; // DrizzleTable
  record: T;
  fields?: ColumnShorthand<T>[];
  exclude?: string[];
  actions?: ClientDescriptor;
  breadcrumb?: BreadcrumbItem[];
};

// --- Field Props ---

export type BaseFieldProps = {
  label?: string;
  className?: string;
};

export type DateFieldProps = BaseFieldProps & {
  value: Date | string | number | null | undefined;
  format?: "short" | "long" | "relative" | "datetime";
  locale?: string;
};

export type BooleanFieldProps = BaseFieldProps & {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
  trueColor?: string;
  falseColor?: string;
};

export type NumberFieldProps = BaseFieldProps & {
  value: number | null | undefined;
  locale?: string;
  currency?: string;
  decimals?: number;
};

export type TextFieldProps = BaseFieldProps & {
  value: string | null | undefined;
  maxLength?: number;
  copyable?: boolean;
};

export type EmailFieldProps = BaseFieldProps & {
  value: string | null | undefined;
};

export type UrlFieldProps = BaseFieldProps & {
  value: string | null | undefined;
  truncate?: boolean;
};

export type ImageFieldProps = BaseFieldProps & {
  value: string | null | undefined;
  storage?: unknown;
  width?: number;
  height?: number;
  alt?: string;
};

export type FileFieldProps = BaseFieldProps & {
  value: string | null | undefined;
  storage?: unknown;
  fileName?: string;
  fileSize?: number;
};

export type RelationFieldProps = BaseFieldProps & {
  value: unknown;
  display?: string;
  linkTo?: string;
};

export type JsonFieldProps = BaseFieldProps & {
  value: unknown;
  collapsed?: boolean;
};

// --- Toast ---

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  message: string;
  type?: ToastType;
  duration?: number;
  description?: string;
};

export type ToastApi = {
  show: (options: ToastOptions) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
};

// --- Confirm ---

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

// --- Navigation ---

export type NavigationItem = {
  label: string;
  to: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ClientDescriptor;
  children?: NavigationItem[];
};

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export type TabItem = {
  label: string;
  to?: string;
  value?: string;
};

// --- BulkAction ---

export type BulkAction = {
  label: string;
  action?: ClientDescriptor;
  handler?: (rows: unknown[]) => void;
  confirmation?: string;
  icon?: ComponentType<{ className?: string }>;
};

// --- ActionButton ---

export type ActionButtonProps = {
  action: ClientDescriptor;
  actionName?: string;
  input?: Record<string, unknown>;
  children: ReactNode;
  whenForbidden?: WhenForbidden;
  confirmation?: string | ConfirmOptions;
  variant?: "solid" | "soft" | "outlined" | "plain";
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  startDecorator?: ReactNode;
};

// --- PermissionGate ---

export type PermissionGateProps = {
  action: ClientDescriptor;
  actionName?: string;
  input?: Record<string, unknown>;
  children: ReactNode;
  fallback?: ReactNode;
};

// --- useActionStatus ---

export type ActionStatusResult = ActionPermissionStatus & {
  submit: () => void;
  pending: boolean;
  data: unknown;
  error: unknown;
};

// --- FormStatus ---

export type FormStatusData = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type FormStatusProps = {
  data: FormStatusData | null | undefined;
};

// --- EmptyState ---

export type EmptyStateProps = {
  title: string;
  description?: string;
  createAction?: ClientDescriptor;
  createLabel?: string;
  icon?: ComponentType<{ className?: string }>;
};

// --- AppShell ---

export type AppShellProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
};

// --- UserMenu ---

export type UserMenuLink = {
  label: string;
  to: string;
  action?: ClientDescriptor;
};

export type UserMenuProps = {
  links?: UserMenuLink[];
  onSignOut?: () => void;
};

// --- File Components ---

export type DropZoneProps = {
  upload: {
    accept: string;
    start: (file: File) => void;
    progress: number;
    isUploading: boolean;
    result: unknown | null;
    error: string | null;
    validationError: string | null;
    reset: () => void;
  };
  multiple?: boolean;
  children?: ReactNode;
};

export type ImagePreviewProps = {
  fileKey?: string | null;
  src?: string | null;
  storage?: unknown;
  getUrl?: (key: string) => string;
  width?: number;
  height?: number;
  fallback?: ReactNode;
  alt?: string;
};

export type FileListFile = {
  key: string;
  name: string;
  size?: number;
  type?: string;
  url?: string;
};

export type FileListProps = {
  files: FileListFile[];
  storage?: unknown;
  deleteAction?: ClientDescriptor;
  onDownload?: (file: FileListFile) => void;
};

// --- AvatarWithInitials ---

export type AvatarWithInitialsProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

// --- RoleBadge ---

export type RoleBadgeProps = {
  role: string;
  colors?: Record<string, string>;
};

// --- ImpersonationBanner ---

export type ImpersonationBannerProps = {
  stopAction?: string;
};

// --- NavigationProgress ---

export type NavigationProgressProps = {
  color?: string;
};
