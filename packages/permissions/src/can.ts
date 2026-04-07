import type {
  Grant,
  PermissionAction,
  SchemaMap,
  SubjectInput,
} from "./types";
import { getTableName } from "./types";

/**
 * Checks whether a set of resolved grants permits a specific action on a table.
 *
 * Unlike {@link checkPermissions} (which takes a role string and the full permissions
 * object), `can` works directly with the user's resolved grants — the same grants
 * available in loaders, actions, and client-side via `useActions`.
 *
 * Accepts either a Drizzle table object or a string table name. The two forms
 * are interchangeable and resolve to the same underlying key. To get
 * compile-time validation that a string table name actually exists in your
 * schema, supply the schema map as a generic argument: `can<typeof schema>(...)`.
 *
 * @typeParam TTables - Optional schema map (e.g. `typeof schema`) used to
 *   constrain string subjects to known table-name literals.
 * @param grants - The user's resolved permission grants.
 * @param action - The permission action to check (e.g., `"create"`, `"read"`).
 * @param table - The Drizzle table object or string table name to check against.
 * @returns `true` if any grant permits the action on the table.
 *
 * @example
 * ```ts
 * import { can } from "@cfast/permissions";
 * import * as schema from "../db/schema";
 *
 * // Object form (always works)
 * if (!can(ctx.auth.grants, "create", schema.posts)) throw redirect("/");
 *
 * // String form (always allowed; type-checked when a schema generic is supplied)
 * if (!can<typeof schema>(ctx.auth.grants, "create", "posts")) throw redirect("/");
 *
 * // In a component
 * {can(grants, "update", schema.posts) && <Button>Edit</Button>}
 * ```
 */
export function can<TTables extends SchemaMap = SchemaMap>(
  grants: Grant[],
  action: PermissionAction,
  table: SubjectInput<TTables>,
): boolean {
  const targetKey = getTableName(table);
  return grants.some((g) => {
    const actionOk = g.action === action || g.action === "manage";
    if (!actionOk) return false;
    if (g.subject === "all") return true;
    return getTableName(g.subject) === targetKey;
  });
}
