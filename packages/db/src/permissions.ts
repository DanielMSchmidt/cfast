import {
  ForbiddenError,
  getTableName,
} from "@cfast/permissions";
import type {
  PermissionDescriptor,
  PermissionAction,
  DrizzleTable,
  Grant,
} from "@cfast/permissions";
import { CRUD_ACTIONS } from "@cfast/permissions";

/**
 * Finds matching grants for an action/table combination and returns their WHERE clause functions.
 *
 * If any matching grant has no `where` clause, access is unrestricted and an empty array is returned.
 * Otherwise, all `where` clause functions are returned for OR-combination.
 *
 * @param grants - The resolved permission grants for the current user's role.
 * @param action - The permission action being performed (e.g., `"read"`, `"update"`).
 * @param table - The Drizzle table being accessed.
 * @returns Array of WHERE clause functions, or empty array if access is unrestricted.
 */
export function resolvePermissionFilters(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
): Array<(columns: Record<string, unknown>, user: { id: string }) => unknown> {
  const matching = grants.filter((g) => {
    const actionMatch = g.action === action || g.action === "manage";
    const tableMatch = g.subject === "all" || g.subject === table || (typeof g.subject === "object" && getTableName(g.subject) === getTableName(table));
    return actionMatch && tableMatch;
  });

  if (matching.length === 0) return [];

  // If any matching grant has no where clause, access is unrestricted
  if (matching.some((g) => !g.where)) return [];

  // Return all where clause functions
  return matching
    .filter((g): g is Grant & { where: NonNullable<Grant["where"]> } => !!g.where)
    .map((g) => g.where as (columns: Record<string, unknown>, user: { id: string }) => unknown);
}

function grantMatchesAction(
  grantAction: PermissionAction,
  requiredAction: PermissionAction,
): boolean {
  if (grantAction === requiredAction) return true;
  if (grantAction === "manage") return true;
  return false;
}

function grantMatchesTable(
  grantSubject: DrizzleTable | string,
  requiredTable: DrizzleTable | string,
): boolean {
  if (grantSubject === "all") return true;
  if (grantSubject === requiredTable) return true;
  return getTableName(grantSubject) === getTableName(requiredTable);
}

function hasGrantFor(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable | string,
): boolean {
  return grants.some(
    (g) =>
      grantMatchesAction(g.action, action) &&
      grantMatchesTable(g.subject, table),
  );
}

function hasManagePermission(
  grants: Grant[],
  table: DrizzleTable | string,
): boolean {
  if (hasGrantFor(grants, "manage", table)) return true;
  return CRUD_ACTIONS.every((action) => hasGrantFor(grants, action, table));
}

/**
 * Checks whether the user's grants satisfy all permission descriptors.
 *
 * Throws `ForbiddenError` if any required permission is not granted. For `"manage"` actions,
 * checks that either an explicit `"manage"` grant exists or all individual CRUD actions are granted.
 *
 * @param grants - The resolved permission grants for the current user's role.
 * @param descriptors - The permission requirements to check.
 * @throws ForbiddenError if any descriptor is not satisfied by the grants.
 */
export function checkOperationPermissions(
  grants: Grant[],
  descriptors: PermissionDescriptor[],
): void {
  if (descriptors.length === 0) return;

  for (const descriptor of descriptors) {
    let permitted: boolean;

    if (descriptor.action === "manage") {
      permitted = hasManagePermission(grants, descriptor.table);
    } else {
      permitted = hasGrantFor(grants, descriptor.action, descriptor.table);
    }

    if (!permitted) {
      throw new ForbiddenError({
        action: descriptor.action,
        table: descriptor.table,
        descriptors: [descriptor],
      });
    }
  }
}
