import type { Grant, SchemaMap, CrudAction } from "@cfast/permissions";
import { resolveTablePermissions } from "@cfast/permissions";
import { toJSON } from "@cfast/db";

/**
 * Server-side loader helper that wraps data with table-level permission
 * metadata and serializes dates.
 *
 * Replaces the manual pattern of calling `can()` per table and `toJSON()`
 * separately. The returned object contains:
 *
 * - All fields from `data`, with Dates converted to ISO strings.
 * - `_tablePerms`: a `Record<tableName, Record<CrudAction, boolean>>` map
 *   covering every table in the schema.
 * - Each array value in `data` is annotated with a non-enumerable
 *   `_tableName` property matching the first table whose SQL name appears
 *   as the data key. This allows the client-side `useCfastLoader` hook to
 *   look up `canAdd()` for the correct table.
 *
 * @param grants - The user's resolved permission grants.
 * @param schema - A schema map (e.g. `import * as schema from "./schema"`).
 * @param data - The loader data to wrap.
 * @returns A serializable object with `_tablePerms` embedded.
 *
 * @example
 * ```ts
 * import { cfastJson } from "@cfast/actions";
 * import * as schema from "../db/schema";
 *
 * export async function loader({ context }) {
 *   const documents = await db.query(documentsTable).findMany().run();
 *   return cfastJson(ctx.auth.grants, schema, { documents });
 * }
 * ```
 */
export function cfastJson<TData extends Record<string, unknown>>(
  grants: Grant[],
  schema: SchemaMap,
  data: TData,
): TData & { _tablePerms: Record<string, Record<CrudAction, boolean>> } {
  const tablePerms = resolveTablePermissions(grants, schema);

  // Serialize dates via toJSON, then re-attach _tablePerms
  const serialized = toJSON(data) as Record<string, unknown>;

  // Build a reverse lookup: JS key name -> SQL table name
  // E.g. { postsRelations: ... } or { posts: "posts", documentVersions: "document_versions" }
  const keyToTableName: Record<string, string> = {};
  for (const [jsKey, table] of Object.entries(schema)) {
    const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");
    if (typeof table === "object" && table !== null) {
      const name: unknown = Reflect.get(table, DRIZZLE_NAME_SYMBOL);
      if (typeof name === "string") {
        // Use both the JS key (e.g. "posts") and the SQL name (e.g. "posts")
        // Also store the lowercase JS key for matching
        keyToTableName[jsKey] = name;
      }
    }
  }

  // Annotate arrays in the serialized data with _tableName so the client
  // hook can figure out which table a collection corresponds to.
  for (const [key, value] of Object.entries(serialized)) {
    if (Array.isArray(value)) {
      // Try to find a matching table name for this data key.
      // Convention: the data key matches the JS schema key or SQL table name.
      let tableName: string | undefined;

      // Direct match: key in schema map
      if (keyToTableName[key]) {
        tableName = keyToTableName[key];
      } else {
        // Try matching against SQL table names
        for (const sqlName of Object.values(keyToTableName)) {
          if (sqlName === key) {
            tableName = sqlName;
            break;
          }
        }
      }

      if (tableName) {
        Object.defineProperty(value, "_tableName", {
          value: tableName,
          enumerable: false,
          writable: false,
          configurable: false,
        });
      }
    }
  }

  return {
    ...serialized,
    _tablePerms: tablePerms,
  } as TData & { _tablePerms: Record<string, Record<CrudAction, boolean>> };
}
