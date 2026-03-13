import type { ComponentType, ReactNode } from "react";
import type { ClientDescriptor, ActionHookResult } from "@cfast/actions/client";

// --- Plugin System ---

/**
 * Map of component slot names to their styled implementations.
 * A UI plugin provides these components to replace the headless defaults.
 */
export type UIPluginComponents = {
  // Actions
  /** Button component used by ActionButton and other interactive elements. */
  button: ComponentType<ButtonSlotProps>;
  /** Tooltip wrapper for hover hints. */
  tooltip: ComponentType<TooltipSlotProps>;
  /** Confirmation dialog shown before destructive actions. */
  confirmDialog: ComponentType<ConfirmDialogSlotProps>;
  // Data display
  /** Root table element. */
  table: ComponentType<TableSlotProps>;
  /** Table head section. */
  tableHead: ComponentType<TableSectionSlotProps>;
  /** Table body section. */
  tableBody: ComponentType<TableSectionSlotProps>;
  /** Table row element. */
  tableRow: ComponentType<TableRowSlotProps>;
  /** Table cell element (th or td). */
  tableCell: ComponentType<TableCellSlotProps>;
  /** Chip/badge component for status indicators. */
  chip: ComponentType<ChipSlotProps>;
  // Layout
  /** Application shell with sidebar and header layout. */
  appShell: ComponentType<AppShellSlotProps>;
  /** Sidebar navigation panel. */
  sidebar: ComponentType<SidebarSlotProps>;
  /** Page wrapper with title, breadcrumb, and actions. */
  pageContainer: ComponentType<PageContainerSlotProps>;
  /** Breadcrumb navigation trail. */
  breadcrumb: ComponentType<BreadcrumbSlotProps>;
  // Feedback
  /** Toast notification container. */
  toast: ComponentType<ToastSlotProps>;
  /** Alert message component for success/error/warning feedback. */
  alert: ComponentType<AlertSlotProps>;
  // File
  /** Drag-and-drop file upload area. */
  dropZone: ComponentType<DropZoneSlotProps>;
};

/**
 * A UI plugin providing styled component implementations for plugin slots.
 * Slots not provided fall back to the headless defaults.
 */
export type UIPlugin = {
  /** Partial map of slot names to component implementations. */
  components: Partial<UIPluginComponents>;
};

// --- Slot Props ---

/** Props for the button plugin slot. */
export type ButtonSlotProps = {
  /** Button content. */
  children: ReactNode;
  /** Click handler. */
  onClick?: () => void;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Whether the button is in a loading state. */
  loading?: boolean;
  /** Visual style variant. */
  variant?: "solid" | "soft" | "outlined" | "plain";
  /** Color theme. */
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  /** Size of the button. */
  size?: "sm" | "md" | "lg";
  /** HTML button type attribute. */
  type?: "button" | "submit";
  /** Element rendered before the button label. */
  startDecorator?: ReactNode;
};

/** Props for the tooltip plugin slot. */
export type TooltipSlotProps = {
  /** Tooltip text displayed on hover. */
  title: string;
  /** Element that triggers the tooltip. */
  children: ReactNode;
};

/** Props for the confirm dialog plugin slot. */
export type ConfirmDialogSlotProps = {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Called when the user cancels or closes the dialog. */
  onClose: () => void;
  /** Called when the user confirms the action. */
  onConfirm: () => void;
  /** Dialog title text. */
  title: string;
  /** Optional description body. */
  description?: string;
  /** Label for the confirm button. */
  confirmLabel?: string;
  /** Label for the cancel button. */
  cancelLabel?: string;
  /** Visual variant; "danger" uses warning colors. */
  variant?: "default" | "danger";
};

/** Props for the table plugin slot. */
export type TableSlotProps = {
  /** Table rows and sections. */
  children: ReactNode;
  /** Whether to highlight rows on hover. */
  hoverRow?: boolean;
};

/** Props for the table head and table body plugin slots. */
export type TableSectionSlotProps = {
  /** Table rows within this section. */
  children: ReactNode;
};

/** Props for the table row plugin slot. */
export type TableRowSlotProps = {
  /** Table cells within this row. */
  children: ReactNode;
  /** Whether this row is currently selected. */
  selected?: boolean;
  /** Click handler for the row. */
  onClick?: () => void;
};

/** Props for the table cell plugin slot. */
export type TableCellSlotProps = {
  /** Cell content. */
  children: ReactNode;
  /** Whether this cell is a header cell (th vs td). */
  header?: boolean;
  /** Whether clicking this cell triggers sorting. */
  sortable?: boolean;
  /** Current sort direction for this column, or null if not sorted. */
  sortDirection?: "asc" | "desc" | null;
  /** Handler called when the user clicks to sort by this column. */
  onSort?: () => void;
};

/** Props for the chip/badge plugin slot. */
export type ChipSlotProps = {
  /** Chip label content. */
  children: ReactNode;
  /** Color theme. */
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  /** Visual style variant. */
  variant?: "solid" | "soft" | "outlined";
  /** Size of the chip. */
  size?: "sm" | "md" | "lg";
};

/** Props for the application shell plugin slot. */
export type AppShellSlotProps = {
  /** Main content area. */
  children: ReactNode;
  /** Sidebar navigation element. */
  sidebar?: ReactNode;
  /** Header element. */
  header?: ReactNode;
};

/** Props for the sidebar plugin slot. */
export type SidebarSlotProps = {
  /** Sidebar content. */
  children: ReactNode;
  /** Navigation items to render in the sidebar. */
  items: NavigationItem[];
};

/** Props for the page container plugin slot. */
export type PageContainerSlotProps = {
  /** Page body content. */
  children: ReactNode;
  /** Page title displayed in the header area. */
  title?: string;
  /** Breadcrumb trail items. */
  breadcrumb?: BreadcrumbItem[];
  /** Action buttons rendered in the page header. */
  actions?: ReactNode;
  /** Tab items for sub-navigation within the page. */
  tabs?: TabItem[];
};

/** Props for the breadcrumb plugin slot. */
export type BreadcrumbSlotProps = {
  /** Breadcrumb trail items. */
  items: BreadcrumbItem[];
};

/** Props for the toast provider plugin slot. */
export type ToastSlotProps = {
  /** Provider-level children; individual toasts are managed internally. */
  children?: ReactNode;
};

/** Props for the alert plugin slot. */
export type AlertSlotProps = {
  /** Alert message content. */
  children: ReactNode;
  /** Semantic color indicating the alert type. */
  color?: "success" | "danger" | "warning" | "neutral";
  /** Visual style variant. */
  variant?: "soft" | "solid" | "outlined";
};

/** Props for the drop zone plugin slot. */
export type DropZoneSlotProps = {
  /** Drop zone content (instructions or file preview). */
  children: ReactNode;
  /** Whether a file is currently being dragged over the zone. */
  isDragOver: boolean;
  /** Whether the dragged file is invalid (wrong type). */
  isInvalid: boolean;
  /** Handler called when files are dropped. */
  onDrop: (files: FileList) => void;
  /** Handler called during dragover for visual feedback. */
  onDragOver: (e: React.DragEvent) => void;
  /** Handler called when the drag leaves the zone. */
  onDragLeave: () => void;
  /** Handler called when the zone is clicked (opens file picker). */
  onClick: () => void;
  /** MIME type filter for accepted files. */
  accept?: string;
};

// --- WhenForbidden ---

/**
 * Behavior when an action is not permitted.
 * - `"hide"`: component is not rendered
 * - `"disable"`: component is rendered but disabled
 * - `"show"`: component is rendered and interactive regardless
 */
export type WhenForbidden = "hide" | "disable" | "show";

// --- ColumnDef ---

/**
 * Full column definition for DataTable and DetailView.
 * Specifies the column key, display label, sorting, and custom rendering.
 */
export type ColumnDef<T = unknown> = {
  /** Property key on the row object. */
  key: string;
  /** Human-readable column header label. */
  label?: string;
  /** Whether this column supports sorting. Defaults to true. */
  sortable?: boolean;
  /** Custom render function for the cell value. */
  render?: (value: unknown, row: T) => ReactNode;
  /** Fixed column width (CSS value or pixel number). */
  width?: string | number;
  /** Responsive priority; lower numbers stay visible on small screens. */
  priority?: number;
};

/**
 * Column definition shorthand: either a column key string or a full ColumnDef.
 * When a string is provided, the label is auto-derived from the key.
 */
export type ColumnShorthand<T = unknown> = string | ColumnDef<T>;

// --- FilterDef ---

/** Supported filter input types for FilterBar. */
export type FilterType =
  | "text"
  | "select"
  | "multiSelect"
  | "relation"
  | "dateRange"
  | "boolean"
  | "number";

/** A single option for select and multiSelect filters. */
export type FilterOption = {
  /** Display label for the option. */
  label: string;
  /** Serialized value for URL params. */
  value: string | number | boolean;
};

/** Definition of a single filter in a FilterBar. */
export type FilterDef = {
  /** Column name this filter applies to. */
  column: string;
  /** Input type determining the filter UI. */
  type: FilterType;
  /** Optional label override (defaults to column name). */
  label?: string;
  /** Options for select/multiSelect filters. */
  options?: FilterOption[];
  /** Drizzle table for relation filters (async select). */
  table?: unknown;
  /** Display field name for relation filters. */
  display?: string;
  /** Placeholder text for the filter input. */
  placeholder?: string;
};

// --- DataTableProps ---

/**
 * Props for the DataTable component.
 * Renders a sortable, selectable table with row actions.
 */
export type DataTableProps<T = unknown> = {
  /** Paginated data including items and loading state. */
  data: {
    /** Array of row objects to display. */
    items: T[];
    /** Whether data is currently being fetched. */
    isLoading?: boolean;
  };
  /** Drizzle table for column type inference. */
  table?: unknown;
  /** Column definitions or key strings. */
  columns?: ColumnShorthand<T>[];
  /** Action descriptor for row-level actions. */
  actions?: ClientDescriptor;
  /** Whether to show row selection checkboxes. */
  selectable?: boolean;
  /** Externally controlled selected rows. */
  selectedRows?: T[];
  /** Callback when row selection changes. */
  onSelectionChange?: (rows: T[]) => void;
  /** Callback when a row is clicked. */
  onRowClick?: (row: T) => void;
  /** Function to extract a unique ID from a row. Defaults to `row.id`. */
  getRowId?: (row: T) => string | number;
  /** Message shown when there are no items. */
  emptyMessage?: string;
};

// --- FilterBarProps ---

/**
 * Props for the FilterBar component.
 * Renders URL-synced filter controls derived from column types.
 */
export type FilterBarProps = {
  /** Drizzle table for filter type inference. */
  table?: unknown;
  /** Filter definitions specifying which columns to filter and how. */
  filters: FilterDef[];
  /** Column names that support full-text search. */
  searchable?: string[];
  /** Current filter values (controlled mode). */
  values?: Record<string, unknown>;
  /** Callback when filter values change (controlled mode). */
  onChange?: (values: Record<string, unknown>) => void;
};

// --- ListViewProps ---

/**
 * Props for the ListView composite component.
 * Composes PageContainer, FilterBar, DataTable, EmptyState, BulkActionBar, and pagination.
 */
export type ListViewProps<T = unknown> = {
  /** Page title displayed in the header. */
  title: string;
  /** Paginated data with optional pagination controls. */
  data: {
    /** Array of row objects to display. */
    items: T[];
    /** Whether data is currently being fetched. */
    isLoading?: boolean;
    /** Total number of matching records. */
    total?: number;
    /** Total number of pages (offset pagination). */
    totalPages?: number;
    /** Current page number (offset pagination). */
    currentPage?: number;
    /** Navigate to a specific page (offset pagination). */
    goToPage?: (page: number) => void;
    /** Whether more items are available (cursor pagination). */
    hasMore?: boolean;
    /** Load the next page of items (cursor pagination). */
    loadMore?: () => void;
  };
  /** Drizzle table for column and filter type inference. */
  table?: unknown;
  /** Column definitions or key strings for the data table. */
  columns?: ColumnShorthand<T>[];
  /** Action descriptor for row-level actions. */
  actions?: ClientDescriptor;
  /** Filter definitions for the FilterBar. */
  filters?: FilterDef[];
  /** Column names that support full-text search. */
  searchable?: string[];
  /** Action descriptor for the create button. */
  createAction?: ClientDescriptor;
  /** Label for the create button. Defaults to "Create". */
  createLabel?: string;
  /** Whether to enable row selection. */
  selectable?: boolean;
  /** Bulk actions shown when rows are selected. */
  bulkActions?: BulkAction[];
  /** Breadcrumb trail items. */
  breadcrumb?: BreadcrumbItem[];
};

// --- DetailViewProps ---

/**
 * Props for the DetailView composite component.
 * Displays a single record's fields in a two-column grid with an action toolbar.
 */
export type DetailViewProps<T = unknown> = {
  /** Page title, typically the record's display name. */
  title: string;
  /** Drizzle table for field type inference. */
  table?: unknown;
  /** The record object to display. */
  record: T;
  /** Field definitions or key strings. If omitted, fields are inferred from the record. */
  fields?: ColumnShorthand<T>[];
  /** Field keys to exclude from display. */
  exclude?: string[];
  /** Action descriptor for the action toolbar. */
  actions?: ClientDescriptor;
  /** Breadcrumb trail items. */
  breadcrumb?: BreadcrumbItem[];
};

// --- Field Props ---

/** Base props shared by all TypedField components. */
export type BaseFieldProps = {
  /** Optional label displayed above the field value. */
  label?: string;
  /** CSS class name for custom styling. */
  className?: string;
};

/** Props for the DateField read-only display component. */
export type DateFieldProps = BaseFieldProps & {
  /** Date value to display. Accepts Date objects, ISO strings, or timestamps. */
  value: Date | string | number | null | undefined;
  /** Display format. Defaults to "short". */
  format?: "short" | "long" | "relative" | "datetime";
  /** Locale for date formatting. Defaults to "en". */
  locale?: string;
};

/** Props for the BooleanField read-only display component. */
export type BooleanFieldProps = BaseFieldProps & {
  /** Boolean value to display. */
  value: boolean | null | undefined;
  /** Label shown when value is true. Defaults to "Yes". */
  trueLabel?: string;
  /** Label shown when value is false. Defaults to "No". */
  falseLabel?: string;
  /** Chip color when value is true. Defaults to "success". */
  trueColor?: string;
  /** Chip color when value is false. Defaults to "neutral". */
  falseColor?: string;
};

/** Props for the NumberField read-only display component. */
export type NumberFieldProps = BaseFieldProps & {
  /** Numeric value to display. */
  value: number | null | undefined;
  /** Locale for number formatting. Defaults to "en". */
  locale?: string;
  /** ISO 4217 currency code for monetary formatting (e.g. "USD"). */
  currency?: string;
  /** Number of decimal places to display. */
  decimals?: number;
};

/** Props for the TextField read-only display component. */
export type TextFieldProps = BaseFieldProps & {
  /** Text value to display. */
  value: string | null | undefined;
  /** Maximum display length; longer values are truncated with a tooltip. */
  maxLength?: number;
  /** Whether to show a copy-to-clipboard button. */
  copyable?: boolean;
};

/** Props for the EmailField read-only display component. */
export type EmailFieldProps = BaseFieldProps & {
  /** Email address to display as a mailto link. */
  value: string | null | undefined;
};

/** Props for the UrlField read-only display component. */
export type UrlFieldProps = BaseFieldProps & {
  /** URL to display as an external link. */
  value: string | null | undefined;
  /** Whether to truncate the URL to hostname + path. */
  truncate?: boolean;
};

/** Props for the ImageField read-only display component. */
export type ImageFieldProps = BaseFieldProps & {
  /** Image URL or storage key. */
  value: string | null | undefined;
  /** Storage configuration for signed URL resolution. */
  storage?: unknown;
  /** Display width in pixels. Defaults to 80. */
  width?: number;
  /** Display height in pixels. Defaults to 60. */
  height?: number;
  /** Alt text for the image element. */
  alt?: string;
};

/** Props for the FileField read-only display component. */
export type FileFieldProps = BaseFieldProps & {
  /** File key or path. */
  value: string | null | undefined;
  /** Storage configuration for download URL resolution. */
  storage?: unknown;
  /** Display name for the file. Defaults to the value. */
  fileName?: string;
  /** File size in bytes for formatted display. */
  fileSize?: number;
};

/** Props for the RelationField read-only display component. */
export type RelationFieldProps = BaseFieldProps & {
  /** Related record object or primitive value. */
  value: unknown;
  /** Property name to display from the related record. Defaults to "name". */
  display?: string;
  /** URL pattern for linking to the related record. Use `:id` as placeholder. */
  linkTo?: string;
};

/** Props for the JsonField read-only display component. */
export type JsonFieldProps = BaseFieldProps & {
  /** JSON value to display as formatted code. */
  value: unknown;
  /** Whether to initially show a collapsed preview. */
  collapsed?: boolean;
};

// --- Toast ---

/** Toast notification severity levels. */
export type ToastType = "success" | "error" | "info" | "warning";

/** Options for displaying a toast notification. */
export type ToastOptions = {
  /** Primary message text. */
  message: string;
  /** Notification type determining the visual style. */
  type?: ToastType;
  /** Auto-dismiss duration in milliseconds. */
  duration?: number;
  /** Optional secondary description text. */
  description?: string;
};

/** Imperative API returned by `useToast()` for showing notifications. */
export type ToastApi = {
  /** Show a toast with full options control. */
  show: (options: ToastOptions) => void;
  /** Show a success toast. */
  success: (message: string, description?: string) => void;
  /** Show an error toast. */
  error: (message: string, description?: string) => void;
  /** Show an informational toast. */
  info: (message: string, description?: string) => void;
  /** Show a warning toast. */
  warning: (message: string, description?: string) => void;
};

// --- Confirm ---

/** Options for the imperative confirmation dialog. */
export type ConfirmOptions = {
  /** Dialog title text. */
  title: string;
  /** Optional description body. */
  description?: string;
  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Visual variant; "danger" uses warning colors for destructive actions. */
  variant?: "default" | "danger";
};

// --- Navigation ---

/** A navigation item for sidebar or menu rendering. */
export type NavigationItem = {
  /** Display label for the navigation link. */
  label: string;
  /** Route path to navigate to. */
  to: string;
  /** Optional icon component rendered before the label. */
  icon?: ComponentType<{ className?: string }>;
  /** If provided, the item is hidden when the user lacks permission for this action. */
  action?: ClientDescriptor;
  /** Nested navigation items for sub-menus. */
  children?: NavigationItem[];
};

/** A single item in a breadcrumb trail. */
export type BreadcrumbItem = {
  /** Display label for the breadcrumb segment. */
  label: string;
  /** Route path; omit for the current (last) segment. */
  to?: string;
};

/** A tab item for sub-navigation within a page. */
export type TabItem = {
  /** Display label for the tab. */
  label: string;
  /** Route path for the tab. */
  to?: string;
  /** Programmatic value identifier for the tab. */
  value?: string;
};

// --- BulkAction ---

/** Configuration for a bulk action available when rows are selected. */
export type BulkAction = {
  /** Display label for the action button. */
  label: string;
  /** Action descriptor for permission checking. */
  action?: ClientDescriptor;
  /** Custom handler called with the selected rows. */
  handler?: (rows: unknown[]) => void;
  /** Confirmation message; supports `{count}` placeholder. */
  confirmation?: string;
  /** Optional icon component for the action button. */
  icon?: ComponentType<{ className?: string }>;
};

// --- ActionButton ---

/** Props that ActionButton controls internally -- not forwarded from the caller. */
type ActionButtonControlledProps = "children" | "onClick" | "disabled" | "loading";

/**
 * Props for the ActionButton component.
 * Wraps a `@cfast/actions` action with permission-aware behavior and optional confirmation.
 */
export type ActionButtonProps = {
  /** Action hook result from `useActions()`, providing permission status and submit function. */
  action: ActionHookResult;
  /** Button label content. */
  children: ReactNode;
  /** Behavior when the action is not permitted. Defaults to "disable". */
  whenForbidden?: WhenForbidden;
  /** Confirmation message or options shown before executing the action. */
  confirmation?: string | ConfirmOptions;
} & Omit<ButtonSlotProps, ActionButtonControlledProps>;

// --- PermissionGate ---

/**
 * Props for the PermissionGate component.
 * Conditionally renders children based on action permission status.
 */
export type PermissionGateProps = {
  /** Action hook result providing permission status. */
  action: ActionHookResult;
  /** Content rendered when the action is permitted. */
  children: ReactNode;
  /** Content rendered when the action is forbidden but not invisible. */
  fallback?: ReactNode;
};


// --- FormStatus ---

/** Data structure for action result feedback (success, error, field errors). */
export type FormStatusData = {
  /** Success message to display. */
  success?: string;
  /** Error message to display. */
  error?: string;
  /** Per-field validation error messages. */
  fieldErrors?: Record<string, string[]>;
};

/** Props for the FormStatus component. */
export type FormStatusProps = {
  /** Action result data, or null/undefined when no result is available. */
  data: FormStatusData | null | undefined;
};

// --- EmptyState ---

/**
 * Props for the EmptyState component.
 * Displays a permission-aware empty state with optional create CTA.
 */
export type EmptyStateProps = {
  /** Title text (e.g. "No posts yet"). */
  title: string;
  /** Description text with guidance. */
  description?: string;
  /** Action descriptor for the create button; controls CTA visibility. */
  createAction?: ClientDescriptor;
  /** Label for the create button. Defaults to "Create". */
  createLabel?: string;
  /** Optional icon component displayed above the title. */
  icon?: ComponentType<{ className?: string }>;
};

// --- AppShell ---

/** Props for the AppShell layout component. */
export type AppShellProps = {
  /** Main content area. */
  children: ReactNode;
  /** Sidebar navigation element. */
  sidebar?: ReactNode;
  /** Header element. */
  header?: ReactNode;
};

// --- UserMenu ---

/** A navigation link in the user menu dropdown. */
export type UserMenuLink = {
  /** Display label. */
  label: string;
  /** Route path. */
  to: string;
  /** If provided, the link is hidden when the user lacks permission. */
  action?: ClientDescriptor;
};

/** Props for the UserMenu component. */
export type UserMenuProps = {
  /** Additional navigation links in the dropdown. */
  links?: UserMenuLink[];
  /** Callback for the sign-out action. */
  onSignOut?: () => void;
};

// --- File Components ---

/**
 * Props for the DropZone component.
 * Integrates with `useUpload()` from `@cfast/storage/client`.
 */
export type DropZoneProps = {
  /** Upload hook result from `@cfast/storage/client`. */
  upload: {
    /** MIME type filter for accepted files. */
    accept: string;
    /** Start uploading a file. */
    start: (file: File) => void;
    /** Current upload progress (0-100). */
    progress: number;
    /** Whether an upload is in progress. */
    isUploading: boolean;
    /** Upload result when complete. */
    result: unknown | null;
    /** Upload error message, if any. */
    error: string | null;
    /** Client-side validation error, if any. */
    validationError: string | null;
    /** Reset the upload state. */
    reset: () => void;
  };
  /** Whether to allow multiple file uploads. */
  multiple?: boolean;
  /** Custom content to display inside the drop zone. */
  children?: ReactNode;
};

/** Props for the ImagePreview component. */
export type ImagePreviewProps = {
  /** Storage file key for signed URL resolution. */
  fileKey?: string | null;
  /** Direct image source URL. */
  src?: string | null;
  /** Storage configuration for URL resolution. */
  storage?: unknown;
  /** Function to resolve a file key to a URL. */
  getUrl?: (key: string) => string;
  /** Display width in pixels. Defaults to 200. */
  width?: number;
  /** Display height in pixels. Defaults to 200. */
  height?: number;
  /** Fallback element when no image is available. */
  fallback?: ReactNode;
  /** Alt text for the image. */
  alt?: string;
};

/** Metadata for a single file in a FileList. */
export type FileListFile = {
  /** Unique file identifier. */
  key: string;
  /** Display name of the file. */
  name: string;
  /** File size in bytes. */
  size?: number;
  /** MIME type of the file. */
  type?: string;
  /** Direct download URL. */
  url?: string;
};

/** Props for the FileList component. */
export type FileListProps = {
  /** Array of file metadata to display. */
  files: FileListFile[];
  /** Storage configuration for download URL resolution. */
  storage?: unknown;
  /** Action descriptor for the delete button on each file. */
  deleteAction?: ClientDescriptor;
  /** Custom download handler. */
  onDownload?: (file: FileListFile) => void;
};

// --- AvatarWithInitials ---

/** Props for the AvatarWithInitials component. */
export type AvatarWithInitialsProps = {
  /** Avatar image URL. Falls back to initials when null. */
  src?: string | null;
  /** Full name used to derive initials. */
  name: string;
  /** Avatar size. Defaults to "md". */
  size?: "sm" | "md" | "lg";
};

// --- RoleBadge ---

/** Props for the RoleBadge component. */
export type RoleBadgeProps = {
  /** Role name to display. */
  role: string;
  /** Custom color map from role name to chip color. */
  colors?: Record<string, string>;
};

// --- ImpersonationBanner ---

/** Props for the ImpersonationBanner component. */
export type ImpersonationBannerProps = {
  /** Form action URL for stopping impersonation. Defaults to "/admin/stop-impersonation". */
  stopAction?: string;
};

// --- NavigationProgress ---

/** Props for the NavigationProgress component. */
export type NavigationProgressProps = {
  /** Progress bar color. Defaults to "#1976d2". */
  color?: string;
};
