import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "@cfast/db";
import type { Grant } from "@cfast/permissions";
import type {
  AdminActionResult,
  AdminConfig,
  AdminColumnConfig,
  AdminTableMeta,
  AdminUser,
  RowActionContext,
  RowActionEmailClient,
} from "./types.js";

// ---------------------------------------------------------------------------
// Lazy-loaded drizzle-orm helpers (issue #188).
//
// Deferring the import keeps `@cfast/admin/server` module evaluation instant
// so vitest tests no longer bust the default 5 s timeout on cold import.
// ---------------------------------------------------------------------------

let _drizzle: typeof import("drizzle-orm") | undefined;

async function loadDrizzle() {
  return (_drizzle ??= await import("drizzle-orm"));
}

/**
 * Resolve the optional email client from an {@link AdminConfig}.
 *
 * Accepts the "direct value" form (`email: client`) and the "lazy getter"
 * form (`email: () => client`) — the getter path exists because production
 * email clients in cfast apps capture Cloudflare bindings via `env.get()`,
 * which is not safe to call at module scope. Returns `undefined` when no
 * email client is configured so row actions can branch on availability.
 */
function resolveEmailClient(
  config: AdminConfig,
): RowActionEmailClient | undefined {
  if (!config.email) return undefined;
  return typeof config.email === "function" ? config.email() : config.email;
}

/**
 * Internal field names that should be skipped when extracting form values.
 */
const INTERNAL_FIELDS = new Set([
  "_action",
  "_table",
  "_id",
  "_actionName",
]);

/**
 * Get a drizzle column reference by column name from a SQLiteTable.
 */
async function getColumn(drizzleTable: SQLiteTable, columnName: string) {
  const { getTableColumns } = await loadDrizzle();
  const columns = getTableColumns(drizzleTable);
  return columns[columnName];
}

/**
 * Find a table meta by name.
 */
function findTableMeta(
  tableMetas: AdminTableMeta[],
  name: string,
): AdminTableMeta | undefined {
  return tableMetas.find((t) => t.name === name);
}

/**
 * Extract and coerce form values for a table's columns.
 *
 * - Skips internal fields (_action, _table, _id, etc.)
 * - Skips primary key columns
 * - Coerces numbers (dataType "number") and booleans (columnType "SQLiteBoolean")
 * - Skips empty strings for non-required fields
 */
function extractFormValues(
  formData: FormData,
  columns: AdminColumnConfig[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const col of columns) {
    // Skip primary key columns — they should not be set from form data
    if (col.isPrimaryKey) continue;

    // Skip if the form didn't include this field
    if (!formData.has(col.name)) continue;

    const rawValue = formData.get(col.name);

    // Skip internal fields
    if (INTERNAL_FIELDS.has(col.name)) continue;

    // Handle boolean columns
    if (col.columnType === "SQLiteBoolean") {
      // Checkboxes: present means true, absent means false
      // But we already checked formData.has(), so if we get here it's present
      values[col.name] = rawValue === "true" || rawValue === "on" || rawValue === "1";
      continue;
    }

    const strValue = rawValue != null ? String(rawValue) : "";

    // Skip empty strings for non-required fields (treat as null/unset)
    if (strValue === "" && !col.required) {
      values[col.name] = null;
      continue;
    }

    // Coerce number types
    if (col.dataType === "number") {
      const num = Number(strValue);
      values[col.name] = Number.isFinite(num) ? num : strValue;
      continue;
    }

    values[col.name] = strValue;
  }

  return values;
}

/**
 * Create an admin action function from config and introspected table metadata.
 *
 * The returned action handles all admin mutations: record create, update, delete,
 * role assignment/removal, impersonation start/stop, and custom row actions.
 * It reads the `_action` field from the submitted `FormData` to dispatch to the
 * appropriate handler.
 *
 * Like the loader, it guards access using the auth adapter and creates a
 * permission-scoped DB instance per request.
 *
 * Use this instead of {@link createAdmin} when you need server/client code splitting.
 *
 * @param config - The admin configuration (same object passed to {@link createAdmin}).
 * @param tableMetas - Table metadata from {@link introspectSchema}.
 * @returns An async function that takes a `Request` and returns an {@link AdminActionResult} or a `Response` (for impersonation redirects).
 *
 * @example
 * ```typescript
 * // app/admin.server.ts
 * import { createAdminAction, introspectSchema } from "@cfast/admin";
 * import * as schema from "~/schema";
 *
 * const tableMetas = introspectSchema(schema);
 * export const adminAction = createAdminAction(config, tableMetas);
 * ```
 */
export function createAdminAction(
  config: AdminConfig,
  tableMetas: AdminTableMeta[],
): (request: Request) => Promise<AdminActionResult | Response> {
  const requiredRole = config.requiredRole ?? "admin";

  return async function adminAction(
    request: Request,
  ): Promise<AdminActionResult | Response> {
    // Auth guard
    const { user, grants } = await config.auth.requireUser(request);

    if (!config.auth.hasRole(user, requiredRole)) {
      throw new Response("Forbidden", { status: 403 });
    }

    const db = config.db(grants, user);
    const formData = await request.formData();
    const action = formData.get("_action");

    if (typeof action !== "string" || !action) {
      return { error: "Missing _action field." };
    }

    switch (action) {
      case "create":
        return handleCreate(db, tableMetas, formData);

      case "update":
        return handleUpdate(db, tableMetas, formData);

      case "delete":
        return handleDelete(db, tableMetas, formData);

      case "setRole":
        return handleSetRole(config, formData);

      case "removeRole":
        return handleRemoveRole(config, formData);

      case "impersonate":
        if (!config.auth.impersonate) {
          return { error: "Impersonation is not configured." };
        }
        return handleImpersonate(config, user.id, formData, request);

      case "stopImpersonation":
        if (!config.auth.stopImpersonation) {
          return { error: "Impersonation is not configured." };
        }
        return config.auth.stopImpersonation(request);

      case "custom":
        return handleCustomAction(tableMetas, formData, {
          user,
          db,
          grants,
          request,
          email: resolveEmailClient(config),
        });

      default:
        return { error: `Unknown action: "${action}".` };
    }
  };
}

/**
 * Handle record creation.
 */
async function handleCreate(
  db: Db,
  tableMetas: AdminTableMeta[],
  formData: FormData,
): Promise<AdminActionResult> {
  const tableName = formData.get("_table");
  if (typeof tableName !== "string" || !tableName) {
    return { error: "Missing _table field." };
  }

  const meta = findTableMeta(tableMetas, tableName);
  if (!meta) {
    return { error: `Table "${tableName}" not found.` };
  }

  const values = extractFormValues(formData, meta.columns);

  try {
    await db.insert(meta.drizzleTable).values(values).run({});
    return { success: `Created new ${meta.label} record.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during create.";
    return { error: message };
  }
}

/**
 * Handle record update.
 */
async function handleUpdate(
  db: Db,
  tableMetas: AdminTableMeta[],
  formData: FormData,
): Promise<AdminActionResult> {
  const tableName = formData.get("_table");
  if (typeof tableName !== "string" || !tableName) {
    return { error: "Missing _table field." };
  }

  const id = formData.get("_id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing _id field." };
  }

  const meta = findTableMeta(tableMetas, tableName);
  if (!meta) {
    return { error: `Table "${tableName}" not found.` };
  }

  const pkCol = await getColumn(meta.drizzleTable, meta.primaryKey);
  if (!pkCol) {
    return { error: `Primary key column "${meta.primaryKey}" not found.` };
  }

  const values = extractFormValues(formData, meta.columns);

  try {
    const { eq } = await loadDrizzle();
    await db
      .update(meta.drizzleTable)
      .set(values)
      .where(eq(pkCol, id))
      .run({});
    return { success: `Updated ${meta.label} record.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during update.";
    return { error: message };
  }
}

/**
 * Handle record deletion.
 */
async function handleDelete(
  db: Db,
  tableMetas: AdminTableMeta[],
  formData: FormData,
): Promise<AdminActionResult> {
  const tableName = formData.get("_table");
  if (typeof tableName !== "string" || !tableName) {
    return { error: "Missing _table field." };
  }

  const id = formData.get("_id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing _id field." };
  }

  const meta = findTableMeta(tableMetas, tableName);
  if (!meta) {
    return { error: `Table "${tableName}" not found.` };
  }

  const pkCol = await getColumn(meta.drizzleTable, meta.primaryKey);
  if (!pkCol) {
    return { error: `Primary key column "${meta.primaryKey}" not found.` };
  }

  try {
    const { eq } = await loadDrizzle();
    await db
      .delete(meta.drizzleTable)
      .where(eq(pkCol, id))
      .run({});
    return { success: `Deleted ${meta.label} record.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during delete.";
    return { error: message };
  }
}

/**
 * Handle setting a role on a user.
 */
async function handleSetRole(
  config: AdminConfig,
  formData: FormData,
): Promise<AdminActionResult> {
  const userId = formData.get("_id");
  if (typeof userId !== "string" || !userId) {
    return { error: "Missing _id field." };
  }

  const role = formData.get("role");
  if (typeof role !== "string" || !role) {
    return { error: "Missing role field." };
  }

  try {
    await config.auth.setRole(userId, role);
    return { success: `Role "${role}" added to user.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error setting role.";
    return { error: message };
  }
}

/**
 * Handle removing a role from a user.
 */
async function handleRemoveRole(
  config: AdminConfig,
  formData: FormData,
): Promise<AdminActionResult> {
  const userId = formData.get("_id");
  if (typeof userId !== "string" || !userId) {
    return { error: "Missing _id field." };
  }

  const role = formData.get("role");
  if (typeof role !== "string" || !role) {
    return { error: "Missing role field." };
  }

  try {
    await config.auth.removeRole(userId, role);
    return { success: `Role "${role}" removed from user.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error removing role.";
    return { error: message };
  }
}

/**
 * Handle impersonation.
 */
async function handleImpersonate(
  config: AdminConfig,
  adminId: string,
  formData: FormData,
  request: Request,
): Promise<Response> {
  const targetId = formData.get("_id");
  if (typeof targetId !== "string" || !targetId) {
    throw new Response("Missing _id for impersonation", { status: 400 });
  }

  return config.auth.impersonate!(adminId, targetId, request);
}

/**
 * Handle custom row actions defined in table overrides.
 *
 * Row action handlers receive a {@link RowActionContext} built from the
 * authenticated admin's identity, grants, and the current request. The `db`
 * exposed on the context is the same permission-scoped instance used by the
 * rest of the admin — handlers do not get an elevated bypass.
 */
async function handleCustomAction(
  tableMetas: AdminTableMeta[],
  formData: FormData,
  ctx: {
    user: AdminUser;
    db: Db;
    grants: Grant[];
    request: Request;
    email?: RowActionEmailClient;
  },
): Promise<AdminActionResult> {
  const tableName = formData.get("_table");
  if (typeof tableName !== "string" || !tableName) {
    return { error: "Missing _table field." };
  }

  const actionName = formData.get("_actionName");
  if (typeof actionName !== "string" || !actionName) {
    return { error: "Missing _actionName field." };
  }

  const id = formData.get("_id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing _id field." };
  }

  const meta = findTableMeta(tableMetas, tableName);
  if (!meta) {
    return { error: `Table "${tableName}" not found.` };
  }

  const rowActions = meta.overrides.actions?.row;
  if (!rowActions) {
    return { error: `No custom actions defined for table "${tableName}".` };
  }

  const rowAction = rowActions.find((a) => a.label === actionName);
  if (!rowAction) {
    return { error: `Action "${actionName}" not found for table "${tableName}".` };
  }

  const rowActionContext: RowActionContext = {
    user: ctx.user,
    db: ctx.db,
    grants: ctx.grants,
    request: ctx.request,
    ...(ctx.email ? { email: ctx.email } : {}),
  };

  try {
    await rowAction.action(id, formData, rowActionContext);
    return { success: `Action "${actionName}" completed.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during custom action.";
    return { error: message };
  }
}
