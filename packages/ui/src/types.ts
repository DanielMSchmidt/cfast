import type { ComponentType, ReactNode } from "react";
import type { ClientDescriptor, ActionHookResult } from "@cfast/actions/client";

// --- Plugin System ---

/**
 * Map of component slot names to their styled implementations.
 *
 * A UI plugin provides these components to replace the headless defaults.
 * Each slot corresponds to a visual primitive used internally by the higher-level
 * components ({@link DataTableProps}, {@link ListViewProps}, {@link AppShellProps}, etc.).
 * Plugins only need to implement the slots they care about; missing slots fall back
 * to unstyled HTML elements.
 *
 * @see {@link UIPlugin} for the plugin wrapper that holds a partial map of these slots.
 * @see {@link createUIPlugin} for the factory function that creates a plugin.
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
 *
 * Created via `createUIPlugin()`. Slots not provided fall back to the headless
 * defaults (unstyled HTML elements). The Joy UI plugin (`@cfast/ui/joy`) is the
 * built-in implementation; third-party plugins can target shadcn, Mantine, or
 * any other component library.
 *
 * @see {@link UIPluginComponents} for the full list of available slots.
 */
export type UIPlugin = {
  /** Partial map of slot names to component implementations. */
  components: Partial<UIPluginComponents>;
};

// --- Slot Props ---

/**
 * Props for the button plugin slot.
 *
 * Implemented by the UI plugin to render interactive buttons throughout the framework.
 * Used internally by {@link ActionButtonProps} and other interactive components.
 *
 * @see {@link UIPluginComponents} for the slot registration point.
 */
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

/**
 * Props for the tooltip plugin slot.
 *
 * Renders hover hints on interactive elements such as disabled action buttons
 * and truncated text fields.
 *
 * @see {@link UIPluginComponents} for the slot registration point.
 */
export type TooltipSlotProps = {
  /** Tooltip text displayed on hover. */
  title: string;
  /** Element that triggers the tooltip. */
  children: ReactNode;
};

/**
 * Props for the confirm dialog plugin slot.
 *
 * Rendered by {@link ActionButtonProps} when `confirmation` is set, and
 * available directly via the `useConfirm()` hook. Supports a "danger"
 * variant for destructive actions.
 *
 * @see {@link ConfirmOptions} for the imperative API options.
 * @see {@link UIPluginComponents} for the slot registration point.
 */
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

/**
 * Props for the table plugin slot.
 *
 * The root table element rendered by {@link DataTableProps}. Wraps
 * {@link TableSectionSlotProps} (head/body) and {@link TableRowSlotProps} children.
 *
 * @see {@link UIPluginComponents} for the slot registration point.
 */
export type TableSlotProps = {
  /** Table rows and sections. */
  children: ReactNode;
  /** Whether to highlight rows on hover. */
  hoverRow?: boolean;
};

/**
 * Props for the table head and table body plugin slots.
 *
 * Used by both the `tableHead` and `tableBody` slots in {@link UIPluginComponents}.
 * Contains {@link TableRowSlotProps} children.
 */
export type TableSectionSlotProps = {
  /** Table rows within this section. */
  children: ReactNode;
};

/**
 * Props for the table row plugin slot.
 *
 * Renders a single row inside a {@link TableSectionSlotProps}. Supports
 * selection highlighting and click handling for row navigation.
 *
 * @see {@link TableCellSlotProps} for the cell-level props within each row.
 */
export type TableRowSlotProps = {
  /** Table cells within this row. */
  children: ReactNode;
  /** Whether this row is currently selected. */
  selected?: boolean;
  /** Click handler for the row. */
  onClick?: () => void;
};

/**
 * Props for the table cell plugin slot.
 *
 * Renders a single cell (`th` or `td`) inside a {@link TableRowSlotProps}.
 * Supports sortable column headers with directional indicators.
 */
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

/**
 * Props for the chip/badge plugin slot.
 *
 * Used for status indicators, role badges ({@link RoleBadgeProps}), and
 * boolean field display ({@link BooleanFieldProps}).
 *
 * @see {@link UIPluginComponents} for the slot registration point.
 */
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

/**
 * Props for the application shell plugin slot.
 *
 * The low-level slot rendered by {@link AppShellProps}. Provides the sidebar +
 * header + content layout structure. Use {@link AppShellProps} in application code;
 * this type is for plugin implementors.
 *
 * @see {@link SidebarSlotProps} for the sidebar slot within the shell.
 */
export type AppShellSlotProps = {
  /** Main content area. */
  children: ReactNode;
  /** Sidebar navigation element. */
  sidebar?: ReactNode;
  /** Header element. */
  header?: ReactNode;
};

/**
 * Props for the sidebar plugin slot.
 *
 * Renders navigation items inside the application shell. Items can be
 * permission-filtered via the {@link NavigationItem.action} property.
 *
 * @see {@link NavigationItem} for the shape of each navigation entry.
 * @see {@link AppShellSlotProps} for the parent layout slot.
 */
export type SidebarSlotProps = {
  /** Sidebar content. */
  children: ReactNode;
  /** Navigation items to render in the sidebar. */
  items: NavigationItem[];
};

/**
 * Props for the page container plugin slot.
 *
 * Provides the page wrapper with title, breadcrumb trail, action buttons, and
 * optional tab navigation. Used internally by {@link ListViewProps} and
 * {@link DetailViewProps}.
 *
 * @see {@link BreadcrumbItem} for breadcrumb trail entries.
 * @see {@link TabItem} for sub-navigation tabs.
 */
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

/**
 * Props for the breadcrumb plugin slot.
 *
 * Renders a breadcrumb navigation trail from an array of {@link BreadcrumbItem} entries.
 *
 * @see {@link PageContainerSlotProps} where breadcrumbs are typically displayed.
 */
export type BreadcrumbSlotProps = {
  /** Breadcrumb trail items. */
  items: BreadcrumbItem[];
};

/**
 * Props for the toast provider plugin slot.
 *
 * Wraps the application to provide toast notification support. Individual
 * toasts are managed internally via the {@link ToastApi} returned by `useToast()`.
 *
 * @see {@link ToastApi} for the imperative notification API.
 * @see {@link ToastOptions} for individual toast configuration.
 */
export type ToastSlotProps = {
  /** Provider-level children; individual toasts are managed internally. */
  children?: ReactNode;
};

/**
 * Props for the alert plugin slot.
 *
 * Renders inline feedback messages for success, error, and warning states.
 * Used by {@link FormStatusProps} to display action result feedback.
 *
 * @see {@link UIPluginComponents} for the slot registration point.
 */
export type AlertSlotProps = {
  /** Alert message content. */
  children: ReactNode;
  /** Semantic color indicating the alert type. */
  color?: "success" | "danger" | "warning" | "neutral";
  /** Visual style variant. */
  variant?: "soft" | "solid" | "outlined";
};

/**
 * Props for the drop zone plugin slot.
 *
 * The low-level slot for drag-and-drop file upload areas. Handles drag state
 * feedback, file validation, and click-to-browse. Use {@link DropZoneProps} in
 * application code; this type is for plugin implementors.
 *
 * @see {@link DropZoneProps} for the high-level component props.
 * @see {@link UIPluginComponents} for the slot registration point.
 */
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
 * Behavior when a `@cfast/actions` action is not permitted for the current user.
 *
 * Controls how permission-aware components like {@link ActionButtonProps} and
 * sidebar {@link NavigationItem} entries respond to forbidden actions:
 *
 * - `"hide"` -- the component is not rendered at all.
 * - `"disable"` -- the component is rendered but non-interactive (grayed out).
 * - `"show"` -- the component is rendered and interactive regardless of permissions.
 */
export type WhenForbidden = "hide" | "disable" | "show";

// --- ColumnDef ---

/**
 * Full column definition for {@link DataTableProps} and {@link DetailViewProps}.
 *
 * Specifies the column key, display label, sorting behavior, custom cell rendering,
 * and responsive priority. When a Drizzle table is provided, column metadata
 * (label, type-appropriate renderer) is inferred automatically; use `ColumnDef`
 * to override those defaults.
 *
 * @typeParam T - The row object type for type-safe `render` callbacks.
 *
 * @see {@link ColumnShorthand} for the shorthand form (plain string key).
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
 * Column definition shorthand: either a plain column key string or a full {@link ColumnDef}.
 *
 * When a string is provided, the label is auto-derived from the key (e.g., `"createdAt"`
 * becomes "Created At") and column behavior (sorting, rendering) is inferred from the
 * Drizzle schema column type.
 *
 * @typeParam T - The row object type, forwarded to {@link ColumnDef} for type-safe rendering.
 *
 * @example
 * ```ts
 * // Mix strings and full definitions:
 * const columns: ColumnShorthand<Post>[] = [
 *   "title",
 *   { key: "author", label: "Written by" },
 *   { key: "createdAt", sortable: false },
 * ];
 * ```
 */
export type ColumnShorthand<T = unknown> = string | ColumnDef<T>;

// --- FilterDef ---

/**
 * Supported filter input types for {@link FilterBarProps}.
 *
 * Each type determines the filter UI control and how the value is serialized
 * to URL search params:
 *
 * - `"text"` -- Text input (`?column=value`).
 * - `"select"` -- Single-select dropdown (`?column=value`).
 * - `"multiSelect"` -- Multi-select dropdown (`?column=a,b,c`).
 * - `"relation"` -- Async select fetching related records (`?column=id`).
 * - `"dateRange"` -- Date range picker (`?column_from=...&column_to=...`).
 * - `"boolean"` -- Toggle/chip (`?column=true`).
 * - `"number"` -- Number range inputs (`?column_min=...&column_max=...`).
 *
 * @see {@link FilterDef} for the full filter definition.
 */
export type FilterType =
  | "text"
  | "select"
  | "multiSelect"
  | "relation"
  | "dateRange"
  | "boolean"
  | "number";

/**
 * A single option for `"select"` and `"multiSelect"` {@link FilterType} filters.
 *
 * The `value` is serialized to URL search params; the `label` is displayed in the UI.
 *
 * @see {@link FilterDef} which holds an array of these options.
 */
export type FilterOption = {
  /** Display label for the option. */
  label: string;
  /** Serialized value for URL params. */
  value: string | number | boolean;
};

/**
 * Definition of a single filter in a {@link FilterBarProps}.
 *
 * Each filter maps a Drizzle column to a UI control. The filter state is serialized
 * to URL search params so that `@cfast/pagination`'s `parseParams()` can apply them
 * as Drizzle `where` clauses in the loader.
 *
 * @see {@link FilterType} for the supported input types.
 * @see {@link FilterOption} for select/multiSelect option entries.
 * @see {@link FilterBarProps} for the parent component props.
 */
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
 *
 * Renders a sortable, selectable data table with permission-aware row actions.
 * Integrates with `@cfast/pagination` for data, `@cfast/db` for column inference,
 * `@cfast/permissions` for action visibility, and `@cfast/actions` for row-level
 * operations.
 *
 * @typeParam T - The row object type for type-safe column rendering and selection callbacks.
 *
 * @see {@link ColumnShorthand} for column configuration options.
 * @see {@link ListViewProps} which composes DataTable with filters and pagination.
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
 *
 * Renders URL-synced filter controls derived from Drizzle column types. On filter
 * change, React Router navigates with updated search params -- no client state
 * management required. Use `values`/`onChange` for controlled mode instead.
 *
 * @see {@link FilterDef} for individual filter definitions.
 * @see {@link ListViewProps} which composes FilterBar with DataTable and pagination.
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
 *
 * Composes {@link PageContainerSlotProps}, {@link FilterBarProps}, {@link DataTableProps},
 * {@link EmptyStateProps}, {@link BulkAction}, and pagination controls into a full page
 * layout. This is the primary component `@cfast/admin` uses for every table view.
 * Handles loading/empty/data state transitions automatically.
 *
 * @typeParam T - The row object type, forwarded to column rendering and selection.
 *
 * @see {@link DataTableProps} for the table configuration subset.
 * @see {@link DetailViewProps} for the single-record counterpart.
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
 *
 * Displays a single record's fields in a two-column grid with a permission-aware
 * action toolbar. Fields render using the appropriate TypedField component
 * ({@link DateFieldProps}, {@link BooleanFieldProps}, etc.) based on the Drizzle
 * column type. Override individual fields with custom `render` functions.
 *
 * @typeParam T - The record object type for type-safe field rendering.
 *
 * @see {@link ColumnShorthand} for field configuration options.
 * @see {@link ListViewProps} for the multi-record counterpart.
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

/**
 * Base props shared by all TypedField read-only display components.
 *
 * Extended by {@link DateFieldProps}, {@link BooleanFieldProps}, {@link NumberFieldProps},
 * {@link TextFieldProps}, {@link EmailFieldProps}, {@link UrlFieldProps},
 * {@link ImageFieldProps}, {@link FileFieldProps}, {@link RelationFieldProps},
 * and {@link JsonFieldProps}.
 */
export type BaseFieldProps = {
  /** Optional label displayed above the field value. */
  label?: string;
  /** CSS class name for custom styling. */
  className?: string;
};

/**
 * Props for the DateField read-only display component.
 *
 * Formats dates using `Intl.DateTimeFormat` with support for relative time display.
 * Used by {@link DataTableProps} cell renderers for date/timestamp columns.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
export type DateFieldProps = BaseFieldProps & {
  /** Date value to display. Accepts Date objects, ISO strings, or timestamps. */
  value: Date | string | number | null | undefined;
  /** Display format. Defaults to "short". */
  format?: "short" | "long" | "relative" | "datetime";
  /** Locale for date formatting. Defaults to "en". */
  locale?: string;
};

/**
 * Props for the BooleanField read-only display component.
 *
 * Renders a colored chip indicating true/false status with customizable labels
 * and colors. Used by {@link DataTableProps} cell renderers for boolean columns.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 * @see {@link ChipSlotProps} for the underlying chip slot.
 */
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

/**
 * Props for the NumberField read-only display component.
 *
 * Formats numbers using `Intl.NumberFormat` with optional currency and decimal
 * precision. Used by {@link DataTableProps} cell renderers for numeric columns.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
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

/**
 * Props for the TextField read-only display component.
 *
 * Displays plain text with optional truncation (tooltip on overflow) and
 * copy-to-clipboard functionality. Used by {@link DataTableProps} cell renderers
 * for text/varchar columns.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
export type TextFieldProps = BaseFieldProps & {
  /** Text value to display. */
  value: string | null | undefined;
  /** Maximum display length; longer values are truncated with a tooltip. */
  maxLength?: number;
  /** Whether to show a copy-to-clipboard button. */
  copyable?: boolean;
};

/**
 * Props for the EmailField read-only display component.
 *
 * Renders the email address as a clickable `mailto:` link.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
export type EmailFieldProps = BaseFieldProps & {
  /** Email address to display as a mailto link. */
  value: string | null | undefined;
};

/**
 * Props for the UrlField read-only display component.
 *
 * Renders a URL as an external link with an indicator icon. Optionally truncates
 * the display to hostname + path for readability.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
export type UrlFieldProps = BaseFieldProps & {
  /** URL to display as an external link. */
  value: string | null | undefined;
  /** Whether to truncate the URL to hostname + path. */
  truncate?: boolean;
};

/**
 * Props for the ImageField read-only display component.
 *
 * Renders an image thumbnail, resolving signed URLs from `@cfast/storage` when
 * a storage configuration is provided. Used by {@link DataTableProps} cell
 * renderers for image columns.
 *
 * @see {@link ImagePreviewProps} for the standalone image preview component.
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
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

/**
 * Props for the FileField read-only display component.
 *
 * Displays a file icon, name, and formatted size. Resolves download URLs from
 * `@cfast/storage` when a storage configuration is provided.
 *
 * @see {@link FileListProps} for displaying multiple files with actions.
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
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

/**
 * Props for the RelationField read-only display component.
 *
 * Displays a related record's display field (e.g., author name) with an optional
 * link to the related record's detail page. The `linkTo` pattern supports `:id`
 * as a placeholder for the record's ID.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
export type RelationFieldProps = BaseFieldProps & {
  /** Related record object or primitive value. */
  value: unknown;
  /** Property name to display from the related record. Defaults to "name". */
  display?: string;
  /** URL pattern for linking to the related record. Use `:id` as placeholder. */
  linkTo?: string;
};

/**
 * Props for the JsonField read-only display component.
 *
 * Renders a JSON value as syntax-highlighted, formatted code with optional
 * collapse/expand functionality for large payloads.
 *
 * @see {@link BaseFieldProps} for inherited label and className props.
 */
export type JsonFieldProps = BaseFieldProps & {
  /** JSON value to display as formatted code. */
  value: unknown;
  /** Whether to initially show a collapsed preview. */
  collapsed?: boolean;
};

// --- Toast ---

/**
 * Toast notification severity levels.
 *
 * Determines the visual style (color, icon) of a toast notification.
 *
 * @see {@link ToastOptions} which uses this as the `type` field.
 * @see {@link ToastApi} for the imperative methods that accept a type implicitly.
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Options for displaying a toast notification.
 *
 * Passed to {@link ToastApi.show} for full control over the notification. The
 * convenience methods (`success`, `error`, `info`, `warning`) set the `type`
 * automatically.
 *
 * @see {@link ToastApi} for the imperative notification API.
 * @see {@link ToastType} for the available severity levels.
 */
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

/**
 * Imperative API returned by `useToast()` for showing notifications.
 *
 * Provides a `show()` method for full control and convenience methods for each
 * {@link ToastType}. Also used internally by `useActionToast()` to auto-display
 * notifications when `@cfast/actions` operations complete.
 *
 * @see {@link ToastOptions} for the full options object.
 * @see {@link ToastSlotProps} for the provider slot that enables toast rendering.
 */
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

/**
 * Options for the imperative confirmation dialog.
 *
 * Passed to the function returned by `useConfirm()`, which resolves to `true`
 * (confirmed) or `false` (cancelled). Also accepted by {@link ActionButtonProps}
 * via the `confirmation` prop.
 *
 * @see {@link ConfirmDialogSlotProps} for the underlying dialog slot.
 */
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

/**
 * A navigation item for sidebar or menu rendering.
 *
 * Items can be permission-filtered: when `action` is provided, the item is
 * automatically hidden if the current user lacks permission for that action.
 * Supports nested children for sub-menu hierarchies.
 *
 * @see {@link SidebarSlotProps} which renders an array of these items.
 * @see {@link BreadcrumbItem} for the breadcrumb-specific navigation type.
 */
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

/**
 * A single item in a breadcrumb trail.
 *
 * The last item in the array typically omits `to` to represent the current page.
 * Used by {@link PageContainerSlotProps}, {@link ListViewProps}, and
 * {@link DetailViewProps}.
 *
 * @see {@link BreadcrumbSlotProps} for the breadcrumb rendering slot.
 */
export type BreadcrumbItem = {
  /** Display label for the breadcrumb segment. */
  label: string;
  /** Route path; omit for the current (last) segment. */
  to?: string;
};

/**
 * A tab item for sub-navigation within a page.
 *
 * Used by {@link PageContainerSlotProps} to render tab navigation below the
 * page title. Either `to` (route-based) or `value` (programmatic) should be
 * provided.
 */
export type TabItem = {
  /** Display label for the tab. */
  label: string;
  /** Route path for the tab. */
  to?: string;
  /** Programmatic value identifier for the tab. */
  value?: string;
};

// --- BulkAction ---

/**
 * Configuration for a bulk action available when rows are selected in a {@link DataTableProps}.
 *
 * Each action can be backed by a `@cfast/actions` descriptor (permission-aware) or
 * a plain `handler` callback. The `confirmation` message supports a `{count}`
 * placeholder for the number of selected rows.
 *
 * @see {@link ListViewProps} which accepts an array of bulk actions.
 */
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

/**
 * Props that ActionButton controls internally and are not forwarded from the caller.
 * @internal
 */
type ActionButtonControlledProps = "children" | "onClick" | "disabled" | "loading";

/**
 * Props for the ActionButton component.
 *
 * Wraps a `@cfast/actions` action with permission-aware behavior and optional
 * confirmation dialog. Extends {@link ButtonSlotProps} (excluding internally
 * controlled props) so all button styling options are available.
 *
 * @see {@link WhenForbidden} for the permission behavior modes.
 * @see {@link ConfirmOptions} for confirmation dialog configuration.
 * @see {@link ButtonSlotProps} for the inherited button styling props.
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
 *
 * Conditionally renders children based on action permission status from
 * `@cfast/actions`. When the action is permitted, `children` is rendered.
 * When forbidden but not invisible, `fallback` is rendered. When the action
 * is invisible (no relation at all), nothing is rendered.
 *
 * @see {@link WhenForbidden} for the related behavior modes used by ActionButton.
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

/**
 * Data structure for action result feedback (success, error, field errors).
 *
 * Typically returned from React Router actions and passed to {@link FormStatusProps}.
 * Supports both top-level messages and per-field validation errors from `@cfast/forms`.
 *
 * @see {@link FormStatusProps} for the component that renders this data.
 */
export type FormStatusData = {
  /** Success message to display. */
  success?: string;
  /** Error message to display. */
  error?: string;
  /** Per-field validation error messages. */
  fieldErrors?: Record<string, string[]>;
};

/**
 * Props for the FormStatus component.
 *
 * Displays action result feedback in a consistent format: success messages as
 * green alerts, error messages as red alerts, and field validation errors as a
 * keyed list. Uses the {@link AlertSlotProps} slot internally.
 *
 * @see {@link FormStatusData} for the expected data structure.
 */
export type FormStatusProps = {
  /** Action result data, or null/undefined when no result is available. */
  data: FormStatusData | null | undefined;
};

// --- EmptyState ---

/**
 * Props for the EmptyState component.
 *
 * Displays a permission-aware empty state with optional create CTA. Behavior adapts
 * based on `createAction` permission status:
 *
 * - If permitted, the create button is shown.
 * - If forbidden, only the title and description are shown.
 * - If invisible (no relation), a generic "Nothing here" message is shown.
 *
 * @see {@link ListViewProps} which uses EmptyState automatically when data is empty.
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

/**
 * Props for the AppShell layout component.
 *
 * Base layout with sidebar navigation, header, and content area. Typically
 * used in the root layout route to wrap all pages. Delegates to the
 * {@link AppShellSlotProps} plugin slot for rendering.
 *
 * @see {@link SidebarSlotProps} for sidebar rendering.
 * @see {@link NavigationItem} for sidebar navigation entries.
 */
export type AppShellProps = {
  /** Main content area. */
  children: ReactNode;
  /** Sidebar navigation element. */
  sidebar?: ReactNode;
  /** Header element. */
  header?: ReactNode;
};

// --- UserMenu ---

/**
 * A navigation link in the user menu dropdown.
 *
 * When `action` is provided, the link is automatically hidden if the current
 * user lacks permission for that action (e.g., an "Admin" link gated on admin access).
 *
 * @see {@link UserMenuProps} which accepts an array of these links.
 */
export type UserMenuLink = {
  /** Display label. */
  label: string;
  /** Route path. */
  to: string;
  /** If provided, the link is hidden when the user lacks permission. */
  action?: ClientDescriptor;
};

/**
 * Props for the UserMenu component.
 *
 * Header dropdown showing the current user's avatar, name, email, role badge,
 * impersonation indicator, configurable navigation links, and sign-out action.
 * Reads user data from `@cfast/auth`'s `useCurrentUser()`.
 *
 * @see {@link UserMenuLink} for the link configuration.
 * @see {@link AvatarWithInitialsProps} for the avatar display.
 * @see {@link RoleBadgeProps} for the role badge display.
 */
export type UserMenuProps = {
  /** Additional navigation links in the dropdown. */
  links?: UserMenuLink[];
  /** Callback for the sign-out action. */
  onSignOut?: () => void;
};

// --- File Components ---

/**
 * Props for the DropZone component.
 *
 * Integrates with `useUpload()` from `@cfast/storage/client` for drag-and-drop
 * file uploads. Inherits `accept` and `maxSize` constraints from the storage schema.
 * Manages drag state, file preview, validation errors, and upload progress internally.
 *
 * @see {@link DropZoneSlotProps} for the underlying plugin slot.
 * @see {@link ImagePreviewProps} for displaying uploaded images.
 * @see {@link FileListProps} for displaying uploaded file lists.
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

/**
 * Props for the ImagePreview component.
 *
 * Displays an image from `@cfast/storage` with signed URL handling. Supports
 * both direct `src` URLs and storage `fileKey` resolution. Shows a fallback
 * element when no image is available.
 *
 * @see {@link ImageFieldProps} for the inline field variant used in tables.
 * @see {@link DropZoneProps} for uploading new images.
 */
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

/**
 * Metadata for a single file in a {@link FileListProps}.
 *
 * Contains the file identifier, display name, optional size/type metadata,
 * and an optional direct download URL.
 *
 * @see {@link FileListProps} which renders an array of these entries.
 */
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

/**
 * Props for the FileList component.
 *
 * Displays a list of uploaded files with metadata, download links, and
 * permission-aware delete actions. Resolves download URLs from `@cfast/storage`
 * when a storage configuration is provided.
 *
 * @see {@link FileListFile} for the shape of each file entry.
 * @see {@link FileFieldProps} for the inline field variant used in tables.
 */
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

/**
 * Props for the AvatarWithInitials component.
 *
 * Avatar component with automatic initials fallback when no image is available.
 * Extracts initials from the `name` prop (e.g., "Daniel Schmidt" becomes "DS").
 * Used by {@link UserMenuProps} for the user avatar display.
 */
export type AvatarWithInitialsProps = {
  /** Avatar image URL. Falls back to initials when null. */
  src?: string | null;
  /** Full name used to derive initials. */
  name: string;
  /** Avatar size. Defaults to "md". */
  size?: "sm" | "md" | "lg";
};

// --- RoleBadge ---

/**
 * Props for the RoleBadge component.
 *
 * Displays a colored chip badge for a user's role from `@cfast/permissions`.
 * Colors are configurable per role name; defaults provide sensible mappings
 * (e.g., "admin" -> danger, "editor" -> primary, "reader" -> neutral).
 *
 * @see {@link ChipSlotProps} for the underlying chip slot.
 * @see {@link UserMenuProps} where role badges are displayed.
 */
export type RoleBadgeProps = {
  /** Role name to display. */
  role: string;
  /** Custom color map from role name to chip color. */
  colors?: Record<string, string>;
};

// --- ImpersonationBanner ---

/**
 * Props for the ImpersonationBanner component.
 *
 * Persistent banner shown when an admin is impersonating another user. Reads
 * impersonation state from `@cfast/auth`. Hidden automatically when not
 * impersonating. Displays the impersonated user's email and a "Stop Impersonating"
 * button that submits to the configured `stopAction` URL.
 */
export type ImpersonationBannerProps = {
  /** Form action URL for stopping impersonation. Defaults to "/admin/stop-impersonation". */
  stopAction?: string;
};

// --- NavigationProgress ---

/**
 * Props for the NavigationProgress component.
 *
 * Thin progress bar rendered at the top of the page during React Router navigation
 * transitions. Uses `useNavigation().state` to show on `"loading"` and hide on `"idle"`.
 * Typically placed in the root layout; no configuration is required beyond optional color.
 */
export type NavigationProgressProps = {
  /** Progress bar color. Defaults to "#1976d2". */
  color?: string;
};
