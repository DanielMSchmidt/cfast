import type { Grant, DrizzleTable, CrudAction } from "./types";
import { getTableName, CRUD_ACTIONS } from "./types";

/**
 * A single granted action for a table, including the matching grants.
 *
 * - `unrestricted: true` means at least one grant has no `where` clause,
 *   so the action is unconditionally permitted for every row.
 * - `unrestricted: false` means all matching grants have `where` clauses,
 *   so whether the action is permitted depends on the specific row.
 */
export type GrantedAction = {
  action: CrudAction;
  grants: Grant[];
  unrestricted: boolean;
};

/**
 * Returns the distinct CRUD actions that are granted for a given table.
 *
 * `manage` grants are expanded into the four CRUD actions. For each action,
 * the result includes the matching grants and whether any of them is
 * unrestricted (no `where` clause). Actions with no matching grant at all
 * are excluded from the result.
 *
 * Used by `@cfast/db` to build `_can` annotations on query results.
 *
 * @param grants - The user's resolved permission grants.
 * @param table - The Drizzle table to check grants against.
 * @returns Array of GrantedAction objects for each permitted action.
 */
export function getGrantedActions(
  grants: Grant[],
  table: DrizzleTable,
): GrantedAction[] {
  const targetName = getTableName(table);
  const result: GrantedAction[] = [];

  for (const action of CRUD_ACTIONS) {
    const matching = grants.filter((g) => {
      const actionOk = g.action === action || g.action === "manage";
      if (!actionOk) return false;
      if (g.subject === "all") return true;
      if (g.subject === table) return true;
      return getTableName(g.subject) === targetName;
    });

    if (matching.length === 0) continue;

    const unrestricted = matching.some((g) => !g.where);
    result.push({ action, grants: matching, unrestricted });
  }

  return result;
}
