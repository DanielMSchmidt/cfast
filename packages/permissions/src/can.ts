import type { Grant, PermissionAction, DrizzleTable } from "./types";
import { getTableName } from "./types";

/**
 * Checks whether a set of resolved grants permits a specific action on a table.
 *
 * Unlike {@link checkPermissions} (which takes a role string and the full permissions
 * object), `can` works directly with the user's resolved grants — the same grants
 * available in loaders, actions, and client-side via `useActions`.
 *
 * @param grants - The user's resolved permission grants.
 * @param action - The permission action to check (e.g., `"create"`, `"read"`).
 * @param table - The Drizzle table object to check against.
 * @returns `true` if any grant permits the action on the table.
 *
 * @example
 * ```ts
 * import { can } from "@cfast/permissions";
 *
 * // In a loader
 * if (!can(ctx.auth.grants, "create", posts)) {
 *   throw redirect("/");
 * }
 *
 * // In a component
 * {can(grants, "update", posts) && <Button>Edit</Button>}
 * ```
 */
export function can(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
): boolean {
  return grants.some((g) => {
    const actionOk = g.action === action || g.action === "manage";
    const subjectOk =
      g.subject === "all" ||
      (typeof g.subject === "object" &&
        getTableName(g.subject) === getTableName(table));
    return actionOk && subjectOk;
  });
}
