import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "@cfast/db";
import type { FieldConfig } from "@cfast/forms";
import type { Grant } from "@cfast/permissions";

/**
 * A user representation for the admin panel, decoupled from `@cfast/auth`.
 *
 * This is the shape the admin expects from your auth adapter. It includes
 * impersonation state so the admin UI can display banners and restore the
 * real admin session.
 *
 * @example
 * ```typescript
 * const adminUser: AdminUser = {
 *   id: "usr_123",
 *   email: "admin@example.com",
 *   name: "Jane Admin",
 *   avatarUrl: null,
 *   roles: ["admin"],
 * };
 * ```
 */
export type AdminUser = {
  /** Unique user identifier (typically from the `user` table primary key). */
  id: string;
  /** The user's email address, displayed in the admin sidebar and user views. */
  email: string;
  /** Display name shown in the admin header and user management views. */
  name: string;
  /** URL to the user's avatar image, or `null` if none is set. */
  avatarUrl: string | null;
  /** List of role names assigned to this user (e.g., `["admin", "editor"]`). */
  roles: string[];
  /** Whether this session is an impersonation session started by another admin. */
  isImpersonating?: boolean;
  /** The real admin user behind an impersonation session. Present only when {@link isImpersonating} is `true`. */
  realUser?: { id: string; name: string };
};

/**
 * Auth adapter interface that bridges your app's authentication to the admin panel.
 *
 * The admin panel does not depend on `@cfast/auth` directly. Instead, you provide
 * callback functions that the admin calls for authentication, role management,
 * and impersonation. This keeps the admin decoupled from any specific auth library.
 *
 * @example
 * ```typescript
 * const auth: AdminAuthConfig = {
 *   requireUser: async (request) => {
 *     const session = await getSession(request);
 *     return { user: session.user, grants: session.grants };
 *   },
 *   hasRole: (user, role) => user.roles.includes(role),
 *   getRoles: (userId) => authInstance.getRoles(userId),
 *   setRole: (userId, role) => authInstance.setRole(userId, role),
 *   removeRole: (userId, role) => authInstance.removeRole(userId, role),
 *   setRoles: (userId, roles) => authInstance.setRoles(userId, roles),
 *   impersonate: (adminId, targetId, request) =>
 *     authInstance.impersonate(adminId, targetId, request),
 *   stopImpersonation: (request) =>
 *     authInstance.stopImpersonation(request),
 * };
 * ```
 */
export type AdminAuthConfig = {
  /** Extracts the authenticated user and their permission grants from the request. Throws or redirects if unauthenticated. */
  requireUser: (
    request: Request,
  ) => Promise<{ user: AdminUser; grants: Grant[] }>;
  /** Checks whether the given user has a specific role. Used for the admin access guard. */
  hasRole: (user: AdminUser, role: string) => boolean;
  /** Fetches all roles assigned to a user by ID. Used in user management views. */
  getRoles: (userId: string) => Promise<string[]>;
  /** Assigns a single role to a user. Called from the user detail role management UI. */
  setRole: (userId: string, role: string) => Promise<void>;
  /** Removes a single role from a user. Called from the user detail role management UI. */
  removeRole: (userId: string, role: string) => Promise<void>;
  /** Replaces all roles for a user with the given set. Used for bulk role assignment. */
  setRoles: (userId: string, roles: string[]) => Promise<void>;
  /** Starts an impersonation session. Should return a redirect `Response` that sets the impersonation cookie/session. */
  impersonate?: (
    adminId: string,
    targetId: string,
    request: Request,
  ) => Promise<Response>;
  /** Ends the current impersonation session. Should return a redirect `Response` that restores the admin session. */
  stopImpersonation?: (request: Request) => Promise<Response>;
};

/**
 * Factory function that creates a permission-scoped {@link Db} instance per request.
 *
 * The admin calls this on every request with the authenticated user's grants
 * and identity so that all CRUD operations respect your permission system.
 *
 * @param grants - The permission grants resolved for the current user.
 * @param user - The authenticated user, or `null` for unauthenticated access.
 * @returns A {@link Db} instance scoped to the user's permissions.
 *
 * @example
 * ```typescript
 * const db: CreateDbFn = (grants, user) =>
 *   createDb({ d1: env.DB, schema, grants, user });
 * ```
 */
export type CreateDbFn = (
  grants: Grant[],
  user: { id: string } | null,
) => Db;

/**
 * Context passed to every {@link RowAction} handler.
 *
 * Provides the authenticated admin, a permission-scoped {@link Db} instance,
 * the resolved permission grants, and the raw {@link Request} so handlers can
 * perform permission-aware mutations, forward cookies, or call into other
 * services on behalf of the admin user.
 *
 * The `db` on this context is scoped to `grants` — it is **not** an elevated
 * bypass database. Queries that would be rejected for the acting admin under
 * normal permission rules are still rejected here. Use {@link Db.unsafe | `ctx.db.unsafe()`}
 * as an explicit, greppable escape hatch when a row action genuinely needs to
 * perform an operation outside the admin's grants (e.g. cross-tenant bookkeeping).
 *
 * @example
 * ```typescript
 * const approveVendor: RowAction = {
 *   label: "Approve vendor",
 *   async action(id, _formData, ctx) {
 *     // ctx.db is scoped to ctx.user's grants — no manage-all bypass
 *     await ctx.db
 *       .update(vendors)
 *       .set({ status: "approved", approvedBy: ctx.user.id })
 *       .where(eq(vendors.id, id))
 *       .run({});
 *   },
 * };
 * ```
 */
export type RowActionContext = {
  /** The authenticated admin invoking the row action. */
  user: AdminUser;
  /** Permission-scoped DB instance for `user` / `grants`. Use `db.unsafe()` for explicit admin overrides. */
  db: Db;
  /** The resolved permission grants for the acting admin. */
  grants: Grant[];
  /** The raw `Request` that triggered the action. Useful for forwarding cookies or reading headers. */
  request: Request;
};

/**
 * Async handler signature for a {@link RowAction}.
 *
 * Called with the record's primary key, the submitted form data, and a
 * {@link RowActionContext} that exposes the authenticated admin, a
 * permission-scoped {@link Db}, their grants, and the raw request.
 *
 * @typeParam T - The resolved result type. Defaults to `unknown`.
 */
export type RowActionCallback<T = unknown> = (
  id: string,
  formData: FormData,
  ctx: RowActionContext,
) => Promise<T>;

/**
 * A custom action that appears on each row in a table's list view.
 *
 * Row actions are invoked with the record's primary key, the submitted form
 * data, and a {@link RowActionContext} containing the authenticated admin, a
 * permission-scoped {@link Db} instance, the admin's grants, and the raw
 * `Request`.
 *
 * @example
 * ```typescript
 * const publishAction: RowAction = {
 *   label: "Publish",
 *   async action(id, _formData, ctx) {
 *     await ctx.db
 *       .update(posts)
 *       .set({ published: true })
 *       .where(eq(posts.id, id))
 *       .run({});
 *   },
 *   confirm: "Are you sure you want to publish this post?",
 *   variant: "default",
 * };
 * ```
 */
export type RowAction = {
  /** Display label for the action button. */
  label: string;
  /** Async handler called with the record ID, submitted form data, and a {@link RowActionContext}. */
  action: RowActionCallback;
  /** Optional confirmation message. When set, the admin shows a confirm dialog before executing. */
  confirm?: string;
  /** Button styling variant. `"danger"` renders a destructive-style button. Defaults to `"default"`. */
  variant?: "danger" | "default";
};

/**
 * A bulk action that operates on multiple selected rows in a table's list view.
 *
 * Table actions appear in the bulk action bar when one or more rows are selected.
 *
 * @example
 * ```typescript
 * const exportAction: TableAction = {
 *   label: "Export CSV",
 *   handler: async (selectedIds) => {
 *     await exportToCsv(selectedIds);
 *   },
 * };
 * ```
 */
export type TableAction = {
  /** Display label for the bulk action button. */
  label: string;
  /** Async handler called with the array of selected record IDs. */
  handler: (selectedIds: string[]) => Promise<unknown>;
};

/**
 * Per-table customization for how a table appears and behaves in the admin panel.
 *
 * Any table not listed in the `tables` config uses sensible defaults derived
 * from schema introspection. Auth-internal tables (session, account, verification,
 * passkey) are auto-excluded unless explicitly configured.
 *
 * @example
 * ```typescript
 * const postsOverrides: TableOverrides = {
 *   label: "Blog Posts",
 *   listColumns: ["title", "author", "published", "createdAt"],
 *   searchable: ["title", "content"],
 *   defaultSort: { column: "createdAt", direction: "desc" },
 *   fields: {
 *     content: { component: RichTextEditor },
 *   },
 * };
 * ```
 */
export type TableOverrides = {
  /** Custom display label for the table in the sidebar and views. Defaults to a pluralized title-case version of the table name. */
  label?: string;
  /** Column names to show in the list view. Defaults to all non-primary-key columns. */
  listColumns?: string[];
  /** Column names that support text search in the list view. Defaults to the first text column. */
  searchable?: string[];
  /** Default sort order for the list view. Defaults to primary key descending. */
  defaultSort?: { column: string; direction: "asc" | "desc" };
  /** Custom field configurations for create/edit forms, keyed by column name. Passed to `@cfast/forms`. */
  fields?: Record<string, FieldConfig>;
  /** Custom row-level and table-level actions. See {@link RowAction} and {@link TableAction}. */
  actions?: { row?: RowAction[]; table?: TableAction[] };
  /** Set to `true` to hide this table from the admin panel entirely. */
  exclude?: boolean;
};

/**
 * Configuration for the built-in user management views.
 *
 * Controls which roles can be assigned through the admin UI. Role assignment
 * respects your auth adapter's `setRole` and `removeRole` callbacks.
 *
 * @example
 * ```typescript
 * const users: UserManagementConfig = {
 *   assignableRoles: ["user", "editor", "moderator", "admin"],
 * };
 * ```
 */
export type UserManagementConfig = {
  /** The list of role names that can be assigned/removed via the admin user management UI. Defaults to an empty array (no role management). */
  assignableRoles?: string[];
};

/**
 * A widget definition for the admin dashboard.
 *
 * Widgets are rendered on the admin index page. The `"count"` type shows a
 * stat card with the total number of records. The `"recent"` type shows a
 * list of the most recent records from a table.
 *
 * @example
 * ```typescript
 * const widgets: DashboardWidget[] = [
 *   { type: "count", table: "users", label: "Total Users" },
 *   { type: "count", table: "posts", label: "Published Posts", where: { published: true } },
 *   { type: "recent", table: "posts", label: "Recent Posts", limit: 5 },
 * ];
 * ```
 */
export type DashboardWidget =
  | {
      /** Renders a count stat card for the given table. */
      type: "count";
      /** The Drizzle table name to count records from. */
      table: string;
      /** Display label for the stat card. */
      label: string;
      /** Optional filter conditions applied before counting. */
      where?: Record<string, unknown>;
    }
  | {
      /** Renders a list of recent records from the given table. */
      type: "recent";
      /** The Drizzle table name to fetch recent records from. */
      table: string;
      /** Display label for the recent items section. */
      label: string;
      /** Maximum number of recent records to show. Defaults to `5`. */
      limit?: number;
    };

/**
 * Configuration for the admin dashboard (the admin index page).
 *
 * When no widgets are configured, the dashboard shows a count for every
 * visible table and recent items from the first table.
 *
 * @example
 * ```typescript
 * const dashboard: DashboardConfig = {
 *   widgets: [
 *     { type: "count", table: "users", label: "Total Users" },
 *     { type: "recent", table: "posts", label: "Recent Posts", limit: 10 },
 *   ],
 * };
 * ```
 */
export type DashboardConfig = {
  /** Dashboard widget definitions. When omitted, the admin auto-generates widgets from the schema. */
  widgets?: DashboardWidget[];
};

/**
 * Top-level configuration for {@link createAdmin}.
 *
 * Combines the database factory, auth adapter, Drizzle schema, and optional
 * customizations for tables, user management, and the dashboard.
 *
 * @example
 * ```typescript
 * const admin = createAdmin({
 *   db: (grants, user) => createDb({ d1: env.DB, schema, grants, user }),
 *   auth,
 *   schema,
 *   requiredRole: "admin",
 *   tables: { posts: { label: "Blog Posts" } },
 *   users: { assignableRoles: ["user", "editor", "admin"] },
 *   dashboard: {
 *     widgets: [{ type: "count", table: "users", label: "Total Users" }],
 *   },
 * });
 * ```
 */
export type AdminConfig = {
  /** Factory function that creates a permission-scoped DB instance per request. See {@link CreateDbFn}. */
  db: CreateDbFn;
  /** Auth adapter that provides user authentication, role management, and impersonation. See {@link AdminAuthConfig}. */
  auth: AdminAuthConfig;
  /** Your Drizzle schema object (e.g., `import * as schema from "~/schema"`). Non-table exports (Relations, helpers) are silently skipped. */
  schema: Record<string, unknown>;
  /** Per-table display and behavior overrides, keyed by table name. See {@link TableOverrides}. */
  tables?: Record<string, TableOverrides>;
  /** Configuration for the built-in user management views. See {@link UserManagementConfig}. */
  users?: UserManagementConfig;
  /** Configuration for the admin dashboard index page. See {@link DashboardConfig}. */
  dashboard?: DashboardConfig;
  /** Role required to access the admin panel. Defaults to `"admin"`. */
  requiredRole?: string;
};

/**
 * Metadata for a single column, produced by {@link introspectSchema}.
 *
 * Contains the information needed to render list columns, form fields,
 * and detail views for a database column.
 */
export type AdminColumnConfig = {
  /** The column name as defined in the Drizzle schema (e.g., `"created_at"`). */
  name: string;
  /** Human-readable label auto-generated from the column name (e.g., `"Created At"`). */
  label: string;
  /** The Drizzle data type (e.g., `"string"`, `"number"`, `"boolean"`). */
  dataType: string;
  /** The Drizzle column type (e.g., `"SQLiteText"`, `"SQLiteInteger"`, `"SQLiteBoolean"`). */
  columnType: string;
  /** Whether this column is required in create/edit forms (non-null and no default). */
  required: boolean;
  /** Whether this column has a default value defined in the schema. */
  hasDefault: boolean;
  /** Whether this column is the table's primary key. */
  isPrimaryKey: boolean;
  /** Allowed enum values, if the column is an enum/text with constrained values. */
  enumValues?: string[];
  /** The name of the foreign table this column references, if it's a foreign key. */
  referencesTable?: string;
  /** The name of the foreign column this column references, if it's a foreign key. */
  referencesColumn?: string;
};

/**
 * Complete metadata for a database table, produced by {@link introspectSchema}.
 *
 * Combines introspected column information with user-provided overrides.
 * Used by the admin loader, action, and component to render views.
 */
export type AdminTableMeta = {
  /** The Drizzle table name (e.g., `"posts"`). */
  name: string;
  /** Human-readable label for display in the sidebar and views (e.g., `"Blog Posts"`). */
  label: string;
  /** The original Drizzle table object, used for queries and form generation. */
  drizzleTable: SQLiteTable;
  /** Introspected column metadata for every column in this table. */
  columns: AdminColumnConfig[];
  /** The name of the primary key column (e.g., `"id"`). */
  primaryKey: string;
  /** Column names that support text search in the list view. */
  searchableColumns: string[];
  /** Column names shown in the list view. */
  listColumns: string[];
  /** Default sort order for the list view. */
  defaultSort: { column: string; direction: "asc" | "desc" };
  /** User-provided overrides applied to this table. See {@link TableOverrides}. */
  overrides: TableOverrides;
};

/**
 * A single stat card displayed on the admin dashboard.
 *
 * Produced by the admin loader when processing `"count"` type {@link DashboardWidget | dashboard widgets}.
 */
export type DashboardStat = {
  /** Display label for the stat card (e.g., `"Total Users"`). */
  label: string;
  /** The numeric count value. */
  value: number;
};

/**
 * A recent-items section displayed on the admin dashboard.
 *
 * Produced by the admin loader when processing `"recent"` type {@link DashboardWidget | dashboard widgets}.
 */
export type RecentItem = {
  /** The table name these items belong to. Used for linking to detail views. */
  table: string;
  /** Display label for the section heading (e.g., `"Recent Posts"`). */
  label: string;
  /** The fetched records, as plain key-value objects. */
  items: Record<string, unknown>[];
  /** Column names to display for each item in the list. */
  columns: string[];
};

/**
 * Discriminated union of all data shapes returned by the admin loader.
 *
 * The `view` field determines which admin view to render:
 * - `"dashboard"` -- the admin index page with stats and recent items
 * - `"list"` -- paginated table list with search and sorting
 * - `"detail"` -- single record detail view
 * - `"create"` -- new record form
 * - `"edit"` -- edit existing record form
 * - `"users"` -- user management list
 * - `"user-detail"` -- single user detail with role management
 * - `"error"` -- error message display
 *
 * Every variant includes the current {@link AdminUser} and the sidebar table list.
 */
export type AdminLoaderData =
  | {
      /** Dashboard view identifier. */
      view: "dashboard";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** Stat cards to display on the dashboard. */
      stats: DashboardStat[];
      /** Recent item sections to display on the dashboard. */
      recentItems: RecentItem[];
    }
  | {
      /** Table list view identifier. */
      view: "list";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The Drizzle table name being listed. */
      tableName: string;
      /** Human-readable table label. */
      tableLabel: string;
      /** The page of records to display. */
      items: Record<string, unknown>[];
      /** Total number of records matching the current search/filter. */
      total: number;
      /** Current page number (1-based). */
      page: number;
      /** Total number of pages. */
      totalPages: number;
      /** Column metadata for rendering the list. */
      columns: AdminColumnConfig[];
      /** Column names that support search. */
      searchable: string[];
      /** Current sort column and direction. */
      sort: { column: string; direction: "asc" | "desc" };
      /** Current search query string. */
      search: string;
    }
  | {
      /** Record detail view identifier. */
      view: "detail";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The Drizzle table name of the record. */
      tableName: string;
      /** Human-readable table label. */
      tableLabel: string;
      /** The record data as a key-value object. */
      item: Record<string, unknown>;
      /** Column metadata for rendering the detail fields. */
      columns: AdminColumnConfig[];
    }
  | {
      /** Create form view identifier. */
      view: "create";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The Drizzle table name for the new record. */
      tableName: string;
      /** Human-readable table label. */
      tableLabel: string;
      /** Column metadata for rendering form fields. */
      columns: AdminColumnConfig[];
    }
  | {
      /** Edit form view identifier. */
      view: "edit";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The Drizzle table name of the record being edited. */
      tableName: string;
      /** Human-readable table label. */
      tableLabel: string;
      /** The existing record data to pre-fill the form. */
      item: Record<string, unknown>;
      /** Column metadata for rendering form fields. */
      columns: AdminColumnConfig[];
    }
  | {
      /** User list view identifier. */
      view: "users";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The page of user records enriched with role data. */
      items: Array<AdminUser & { createdAt?: string }>;
      /** Total number of users matching the search. */
      total: number;
      /** Current page number (1-based). */
      page: number;
      /** Total number of pages. */
      totalPages: number;
      /** Current search query string. */
      search: string;
      /** Roles that can be assigned via the admin UI. */
      assignableRoles: string[];
    }
  | {
      /** User detail view identifier. */
      view: "user-detail";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The user being viewed, enriched with role and creation date data. */
      targetUser: AdminUser & { createdAt?: string };
      /** Roles that can be assigned via the admin UI. */
      assignableRoles: string[];
    }
  | {
      /** Error view identifier. */
      view: "error";
      /** The authenticated admin user. */
      user: AdminUser;
      /** Table list for the sidebar navigation. */
      tables: Array<{ name: string; label: string }>;
      /** The error message to display. */
      message: string;
    };

/**
 * Discriminated union returned by the admin action handler.
 *
 * The admin component uses this to display success messages, error banners,
 * or per-field validation errors on forms.
 *
 * - `{ success: string }` -- operation completed; display a success toast
 * - `{ error: string }` -- operation failed; display an error message
 * - `{ fieldErrors: Record<string, string> }` -- validation failed; highlight individual fields
 */
export type AdminActionResult =
  | { /** Success message to display (e.g., `"Created new Blog Posts record."`). */ success: string }
  | { /** Error message to display (e.g., `"Table \"posts\" not found."`). */ error: string }
  | { /** Per-field validation errors, keyed by column name. */ fieldErrors: Record<string, string> };
