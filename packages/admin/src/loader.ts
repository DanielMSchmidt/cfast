import { getTableColumns, getTableName, eq, like, or, asc, desc } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "@cfast/db";
import { parseAdminParams } from "./utils.js";
import type {
  AdminConfig,
  AdminLoaderData,
  AdminTableMeta,
  AdminUser,
  DashboardStat,
  RecentItem,
} from "./types.js";

const PAGE_SIZE = 20;

/**
 * Shared table list for the sidebar, derived from tableMetas.
 */
function tableList(tableMetas: AdminTableMeta[]): Array<{ name: string; label: string }> {
  return tableMetas.map((t) => ({ name: t.name, label: t.label }));
}

/**
 * Find a table meta by name, or return undefined.
 */
function findTableMeta(
  tableMetas: AdminTableMeta[],
  name: string,
): AdminTableMeta | undefined {
  return tableMetas.find((t) => t.name === name);
}

/**
 * Get a drizzle column reference by column name from a SQLiteTable.
 * Returns the column object that can be used with eq(), like(), etc.
 */
function getColumn(drizzleTable: SQLiteTable, columnName: string) {
  const columns = getTableColumns(drizzleTable);
  return columns[columnName];
}

/**
 * Find the users table in the schema by looking for a table named "user" or "users".
 */
function findUsersTable(schema: Record<string, SQLiteTable>): SQLiteTable | undefined {
  for (const table of Object.values(schema)) {
    const name = getTableName(table);
    if (name === "user" || name === "users") {
      return table;
    }
  }
  return undefined;
}

/**
 * Build a search WHERE clause for LIKE matching on searchable columns.
 */
function buildSearchWhere(
  drizzleTable: SQLiteTable,
  searchableColumns: string[],
  search: string,
): unknown {
  if (!search || searchableColumns.length === 0) {
    return undefined;
  }

  const pattern = `%${search}%`;
  const conditions = searchableColumns
    .map((colName) => {
      const col = getColumn(drizzleTable, colName);
      if (!col) return undefined;
      return like(col, pattern);
    })
    .filter((c): c is NonNullable<typeof c> => c != null);

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return or(...conditions);
}

/**
 * Build an orderBy clause from sort column name and direction.
 */
function buildOrderBy(
  drizzleTable: SQLiteTable,
  sortColumn: string,
  direction: "asc" | "desc",
): unknown {
  const col = getColumn(drizzleTable, sortColumn);
  if (!col) return undefined;
  return direction === "asc" ? asc(col) : desc(col);
}

/**
 * Load dashboard view data: table counts and recent items.
 */
async function loadDashboard(
  config: AdminConfig,
  db: Db,
  tableMetas: AdminTableMeta[],
  user: AdminUser,
): Promise<AdminLoaderData> {
  const tables = tableList(tableMetas);
  const stats: DashboardStat[] = [];
  const recentItems: RecentItem[] = [];

  if (config.dashboard?.widgets) {
    // Use configured widgets
    for (const widget of config.dashboard.widgets) {
      const meta = findTableMeta(tableMetas, widget.table);
      if (!meta) continue;

      if (widget.type === "count") {
        const rows = await db
          .query(meta.drizzleTable)
          .findMany({ columns: {} })
          .run({});
        stats.push({ label: widget.label, value: rows.length });
      } else if (widget.type === "recent") {
        const limit = widget.limit ?? 5;
        const items = (await db
          .query(meta.drizzleTable)
          .findMany({
            limit,
            orderBy: buildOrderBy(
              meta.drizzleTable,
              meta.primaryKey,
              "desc",
            ),
          })
          .run({})) as Record<string, unknown>[];
        recentItems.push({
          table: meta.name,
          label: widget.label,
          items,
          columns: meta.listColumns,
        });
      }
    }
  } else {
    // Default: count each table + recent items from first table
    for (const meta of tableMetas) {
      const rows = await db
        .query(meta.drizzleTable)
        .findMany({ columns: {} })
        .run({});
      stats.push({ label: meta.label, value: rows.length });
    }

    const firstMeta = tableMetas[0];
    if (firstMeta) {
      const items = (await db
        .query(firstMeta.drizzleTable)
        .findMany({
          limit: 5,
          orderBy: buildOrderBy(
            firstMeta.drizzleTable,
            firstMeta.primaryKey,
            "desc",
          ),
        })
        .run({})) as Record<string, unknown>[];
      recentItems.push({
        table: firstMeta.name,
        label: firstMeta.label,
        items,
        columns: firstMeta.listColumns,
      });
    }
  }

  return {
    view: "dashboard",
    user,
    tables,
    stats,
    recentItems,
  };
}

/**
 * Load list view data with pagination, sorting, and search.
 */
async function loadList(
  db: Db,
  tableMetas: AdminTableMeta[],
  user: AdminUser,
  tableName: string,
  page: number,
  sort: string | null,
  direction: "asc" | "desc",
  search: string,
): Promise<AdminLoaderData> {
  const tables = tableList(tableMetas);
  const meta = findTableMeta(tableMetas, tableName);

  if (!meta) {
    return {
      view: "error",
      user,
      tables,
      message: `Table "${tableName}" not found.`,
    };
  }

  const sortColumn = sort ?? meta.defaultSort.column;
  const sortDirection = sort ? direction : meta.defaultSort.direction;

  const where = buildSearchWhere(
    meta.drizzleTable,
    meta.searchableColumns,
    search,
  );
  const orderBy = buildOrderBy(meta.drizzleTable, sortColumn, sortDirection);

  // Fetch total count (using empty columns projection and array length)
  const allRows = await db
    .query(meta.drizzleTable)
    .findMany({ columns: {}, where })
    .run({});
  const total = allRows.length;

  // Fetch page of items
  const offset = (page - 1) * PAGE_SIZE;
  const items = (await db
    .query(meta.drizzleTable)
    .findMany({
      where,
      orderBy,
      limit: PAGE_SIZE,
      offset,
    })
    .run({})) as Record<string, unknown>[];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    view: "list",
    user,
    tables,
    tableName: meta.name,
    tableLabel: meta.label,
    items,
    total,
    page,
    totalPages,
    columns: meta.columns,
    searchable: meta.searchableColumns,
    sort: { column: sortColumn, direction: sortDirection },
    search,
  };
}

/**
 * Load detail view data for a single record.
 */
async function loadDetail(
  db: Db,
  tableMetas: AdminTableMeta[],
  user: AdminUser,
  tableName: string,
  id: string,
): Promise<AdminLoaderData> {
  const tables = tableList(tableMetas);
  const meta = findTableMeta(tableMetas, tableName);

  if (!meta) {
    return {
      view: "error",
      user,
      tables,
      message: `Table "${tableName}" not found.`,
    };
  }

  const pkCol = getColumn(meta.drizzleTable, meta.primaryKey);
  if (!pkCol) {
    return {
      view: "error",
      user,
      tables,
      message: `Primary key column "${meta.primaryKey}" not found in table "${tableName}".`,
    };
  }

  const item = (await db
    .query(meta.drizzleTable)
    .findFirst({ where: eq(pkCol, id) })
    .run({})) as Record<string, unknown> | undefined;

  if (!item) {
    return {
      view: "error",
      user,
      tables,
      message: `Record with id "${id}" not found in table "${tableName}".`,
    };
  }

  return {
    view: "detail",
    user,
    tables,
    tableName: meta.name,
    tableLabel: meta.label,
    item,
    columns: meta.columns,
  };
}

/**
 * Load create view data (just columns metadata).
 */
function loadCreate(
  tableMetas: AdminTableMeta[],
  user: AdminUser,
  tableName: string,
): AdminLoaderData {
  const tables = tableList(tableMetas);
  const meta = findTableMeta(tableMetas, tableName);

  if (!meta) {
    return {
      view: "error",
      user,
      tables,
      message: `Table "${tableName}" not found.`,
    };
  }

  return {
    view: "create",
    user,
    tables,
    tableName: meta.name,
    tableLabel: meta.label,
    columns: meta.columns,
  };
}

/**
 * Load edit view data (record + columns metadata).
 */
async function loadEdit(
  db: Db,
  tableMetas: AdminTableMeta[],
  user: AdminUser,
  tableName: string,
  id: string,
): Promise<AdminLoaderData> {
  const tables = tableList(tableMetas);
  const meta = findTableMeta(tableMetas, tableName);

  if (!meta) {
    return {
      view: "error",
      user,
      tables,
      message: `Table "${tableName}" not found.`,
    };
  }

  const pkCol = getColumn(meta.drizzleTable, meta.primaryKey);
  if (!pkCol) {
    return {
      view: "error",
      user,
      tables,
      message: `Primary key column "${meta.primaryKey}" not found in table "${tableName}".`,
    };
  }

  const item = (await db
    .query(meta.drizzleTable)
    .findFirst({ where: eq(pkCol, id) })
    .run({})) as Record<string, unknown> | undefined;

  if (!item) {
    return {
      view: "error",
      user,
      tables,
      message: `Record with id "${id}" not found in table "${tableName}".`,
    };
  }

  return {
    view: "edit",
    user,
    tables,
    tableName: meta.name,
    tableLabel: meta.label,
    item,
    columns: meta.columns,
  };
}

/**
 * Load user list view data.
 */
async function loadUserList(
  config: AdminConfig,
  db: Db,
  tableMetas: AdminTableMeta[],
  user: AdminUser,
  page: number,
  search: string,
): Promise<AdminLoaderData> {
  const tables = tableList(tableMetas);
  const usersTable = findUsersTable(config.schema);

  if (!usersTable) {
    return {
      view: "error",
      user,
      tables,
      message: "Users table not found in schema.",
    };
  }

  const unsafeDb = db.unsafe();
  const columns = getTableColumns(usersTable);

  // Build search where for users (search by name or email)
  const searchableUserCols = ["name", "email"].filter((c) => columns[c] != null);
  const where = buildSearchWhere(usersTable, searchableUserCols, search);

  // Get total count
  const allRows = await unsafeDb
    .query(usersTable)
    .findMany({ columns: {}, where })
    .run({});
  const total = allRows.length;

  // Fetch page of users
  const offset = (page - 1) * PAGE_SIZE;
  const rawUsers = (await unsafeDb
    .query(usersTable)
    .findMany({
      where,
      limit: PAGE_SIZE,
      offset,
    })
    .run({})) as Record<string, unknown>[];

  // Enrich with roles
  const items: Array<AdminUser & { createdAt?: string }> = [];
  for (const raw of rawUsers) {
    const userId = String(raw["id"] ?? "");
    const roles = await config.auth.getRoles(userId);
    items.push({
      id: userId,
      email: String(raw["email"] ?? ""),
      name: String(raw["name"] ?? ""),
      avatarUrl: raw["avatarUrl"] != null ? String(raw["avatarUrl"]) : (raw["avatar_url"] != null ? String(raw["avatar_url"]) : null),
      roles,
      createdAt: raw["createdAt"] != null ? String(raw["createdAt"]) : (raw["created_at"] != null ? String(raw["created_at"]) : undefined),
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const assignableRoles = config.users?.assignableRoles ?? [];

  return {
    view: "users",
    user,
    tables,
    items,
    total,
    page,
    totalPages,
    search,
    assignableRoles,
  };
}

/**
 * Load user detail view data.
 */
async function loadUserDetail(
  config: AdminConfig,
  db: Db,
  tableMetas: AdminTableMeta[],
  user: AdminUser,
  targetId: string,
): Promise<AdminLoaderData> {
  const tables = tableList(tableMetas);
  const usersTable = findUsersTable(config.schema);

  if (!usersTable) {
    return {
      view: "error",
      user,
      tables,
      message: "Users table not found in schema.",
    };
  }

  const unsafeDb = db.unsafe();
  const pkCol = getColumn(usersTable, "id");
  if (!pkCol) {
    return {
      view: "error",
      user,
      tables,
      message: 'Users table has no "id" column.',
    };
  }

  const raw = (await unsafeDb
    .query(usersTable)
    .findFirst({ where: eq(pkCol, targetId) })
    .run({})) as Record<string, unknown> | undefined;

  if (!raw) {
    return {
      view: "error",
      user,
      tables,
      message: `User with id "${targetId}" not found.`,
    };
  }

  const roles = await config.auth.getRoles(targetId);
  const assignableRoles = config.users?.assignableRoles ?? [];

  const targetUser: AdminUser & { createdAt?: string } = {
    id: String(raw["id"] ?? ""),
    email: String(raw["email"] ?? ""),
    name: String(raw["name"] ?? ""),
    avatarUrl: raw["avatarUrl"] != null ? String(raw["avatarUrl"]) : (raw["avatar_url"] != null ? String(raw["avatar_url"]) : null),
    roles,
    createdAt: raw["createdAt"] != null ? String(raw["createdAt"]) : (raw["created_at"] != null ? String(raw["created_at"]) : undefined),
  };

  return {
    view: "user-detail",
    user,
    tables,
    targetUser,
    assignableRoles,
  };
}

/**
 * Create an admin loader function from config and introspected table metadata.
 *
 * The returned loader:
 * 1. Guards access with auth + role check
 * 2. Parses URL params to determine the view
 * 3. Fetches appropriate data and returns AdminLoaderData
 */
export function createAdminLoader(
  config: AdminConfig,
  tableMetas: AdminTableMeta[],
): (request: Request) => Promise<AdminLoaderData> {
  const requiredRole = config.requiredRole ?? "admin";

  return async function adminLoader(request: Request): Promise<AdminLoaderData> {
    // Auth guard
    const { user, grants } = await config.auth.requireUser(request);

    if (!config.auth.hasRole(user, requiredRole)) {
      throw new Response("Forbidden", { status: 403 });
    }

    // Create DB instance scoped to this user's grants
    const db = config.db(grants, user);

    // Parse URL to determine which view to load
    const url = new URL(request.url);
    const params = parseAdminParams(url);

    switch (params.kind) {
      case "dashboard":
        return loadDashboard(config, db, tableMetas, user);

      case "list":
        return loadList(
          db,
          tableMetas,
          user,
          params.table,
          params.page,
          params.sort,
          params.direction,
          params.search,
        );

      case "detail":
        return loadDetail(db, tableMetas, user, params.table, params.id);

      case "create":
        return loadCreate(tableMetas, user, params.table);

      case "edit":
        return loadEdit(db, tableMetas, user, params.table, params.id);

      case "user-list":
        return loadUserList(
          config,
          db,
          tableMetas,
          user,
          params.page,
          params.search,
        );

      case "user-detail":
        return loadUserDetail(
          config,
          db,
          tableMetas,
          user,
          params.id,
        );
    }
  };
}
