import type { Grant, CrudAction, SchemaMap } from "./types";
import { CRUD_ACTIONS, getTableName } from "./types";
import { can } from "./can";

/**
 * Resolves table-level CRUD permissions for every table in a schema.
 *
 * Iterates each key in the schema map, extracts its table name, and calls
 * {@link can} for each of the four CRUD actions (`read`, `create`, `update`,
 * `delete`). Returns a flat, serializable map suitable for embedding in
 * loader data and sending to the client.
 *
 * This is a pure grant-structural check — no database access, no SQL.
 * Row-level `where` clauses on grants are ignored; the result reflects
 * whether the user has *any* grant for the action on the table.
 *
 * @param grants - The user's resolved permission grants.
 * @param schema - A schema map (e.g. `import * as schema from "./schema"`).
 * @returns A record keyed by SQL table name, each mapping CRUD actions to booleans.
 *
 * @example
 * ```ts
 * import { resolveTablePermissions } from "@cfast/permissions";
 * import * as schema from "../db/schema";
 *
 * const perms = resolveTablePermissions(grants, schema);
 * // { posts: { read: true, create: true, update: false, delete: false }, ... }
 * ```
 */
export function resolveTablePermissions(
  grants: Grant[],
  schema: SchemaMap,
): Record<string, Record<CrudAction, boolean>> {
  const result: Record<string, Record<CrudAction, boolean>> = {};

  for (const key of Object.keys(schema)) {
    const table = schema[key];
    const tableName = getTableName(table);
    // Skip non-table entries (e.g. relations objects) that resolve to "unknown"
    if (tableName === "unknown") continue;
    // Avoid duplicates when multiple JS keys map to the same SQL name
    if (result[tableName]) continue;

    const perms = {} as Record<CrudAction, boolean>;
    for (const action of CRUD_ACTIONS) {
      perms[action] = can(grants, action, table);
    }
    result[tableName] = perms;
  }

  return result;
}
