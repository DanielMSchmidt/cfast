import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "@cfast/db";
import type { FieldConfig } from "@cfast/forms";

// --- AdminUser — decoupled from @cfast/auth ---

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  isImpersonating?: boolean;
  realUser?: { id: string; name: string };
};

// --- Auth config — function interface for admin auth operations ---

export type AdminAuthConfig = {
  requireUser: (
    request: Request,
  ) => Promise<{ user: AdminUser; grants: unknown[] }>;
  hasRole: (user: AdminUser, role: string) => boolean;
  getRoles: (userId: string) => Promise<string[]>;
  setRole: (userId: string, role: string) => Promise<void>;
  removeRole: (userId: string, role: string) => Promise<void>;
  setRoles: (userId: string, roles: string[]) => Promise<void>;
  impersonate: (
    adminId: string,
    targetId: string,
    request: Request,
  ) => Promise<Response>;
  stopImpersonation: (request: Request) => Promise<Response>;
};

// --- DB factory ---

export type CreateDbFn = (
  grants: unknown[],
  user: { id: string } | null,
) => Db;

// --- Table overrides ---

export type RowAction = {
  label: string;
  action: (id: string, formData: FormData) => Promise<unknown>;
  confirm?: string;
  variant?: "danger" | "default";
};

export type TableAction = {
  label: string;
  handler: (selectedIds: string[]) => Promise<unknown>;
};

export type TableOverrides = {
  label?: string;
  listColumns?: string[];
  searchable?: string[];
  defaultSort?: { column: string; direction: "asc" | "desc" };
  fields?: Record<string, FieldConfig>;
  actions?: { row?: RowAction[]; table?: TableAction[] };
  exclude?: boolean;
};

// --- User management ---

export type UserManagementConfig = {
  displayFields?: string[];
  assignableRoles?: string[];
};

// --- Dashboard ---

export type DashboardWidget =
  | {
      type: "count";
      table: string;
      label: string;
      where?: Record<string, unknown>;
    }
  | { type: "recent"; table: string; label: string; limit?: number };

export type DashboardConfig = {
  widgets?: DashboardWidget[];
};

// --- Top-level admin config ---

export type AdminConfig = {
  db: CreateDbFn;
  auth: AdminAuthConfig;
  schema: Record<string, SQLiteTable>;
  tables?: Record<string, TableOverrides>;
  users?: UserManagementConfig;
  dashboard?: DashboardConfig;
  basePath?: string;
  requiredRole?: string;
};

// --- Column and table metadata ---

export type AdminColumnConfig = {
  name: string;
  label: string;
  dataType: string;
  columnType: string;
  required: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  enumValues?: string[];
  referencesTable?: string;
  referencesColumn?: string;
};

export type AdminTableMeta = {
  name: string;
  label: string;
  drizzleTable: SQLiteTable;
  columns: AdminColumnConfig[];
  primaryKey: string;
  searchableColumns: string[];
  listColumns: string[];
  defaultSort: { column: string; direction: "asc" | "desc" };
  overrides: TableOverrides;
};

// --- Dashboard data ---

export type DashboardStat = {
  label: string;
  value: number;
};

export type RecentItem = {
  table: string;
  label: string;
  items: Record<string, unknown>[];
  columns: string[];
};

// --- Loader data (discriminated union by view) ---

export type AdminLoaderData =
  | {
      view: "dashboard";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      stats: DashboardStat[];
      recentItems: RecentItem[];
    }
  | {
      view: "list";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      items: Record<string, unknown>[];
      total: number;
      page: number;
      totalPages: number;
      columns: AdminColumnConfig[];
      searchable: string[];
      sort: { column: string; direction: string };
      search: string;
    }
  | {
      view: "detail";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      item: Record<string, unknown>;
      columns: AdminColumnConfig[];
    }
  | {
      view: "create";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      columns: AdminColumnConfig[];
    }
  | {
      view: "edit";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      item: Record<string, unknown>;
      columns: AdminColumnConfig[];
    }
  | {
      view: "users";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      items: Array<AdminUser & { createdAt?: string }>;
      total: number;
      page: number;
      totalPages: number;
      search: string;
      assignableRoles: string[];
    }
  | {
      view: "user-detail";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      targetUser: AdminUser & { createdAt?: string };
      assignableRoles: string[];
    }
  | {
      view: "error";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      message: string;
    };

// --- Action result ---

export type AdminActionResult =
  | { success: string }
  | { error: string }
  | { fieldErrors: Record<string, string> };
