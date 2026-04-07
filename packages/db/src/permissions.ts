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
 * Finds matching grants for an action/table combination.
 *
 * Returns the matching {@link Grant} objects so the caller can access both the
 * `where` clause and any prerequisite `with` lookups attached to each grant.
 *
 * If any matching grant has no `where` clause, access is unrestricted and an
 * empty array is returned (no further filtering required, and any `with`
 * lookups on other matching grants can be skipped).
 *
 * @param grants - The resolved permission grants for the current user's role.
 * @param action - The permission action being performed (e.g., `"read"`, `"update"`).
 * @param table - The Drizzle table being accessed.
 * @returns Array of matching restricted grants, or empty array if access is unrestricted.
 */
export function resolvePermissionFilters(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
): Grant[] {
  const targetName = getTableName(table);
  const matching = grants.filter((g) => {
    const actionMatch = g.action === action || g.action === "manage";
    // Subjects normalize through `getTableName`, so a string-subject grant
    // (e.g. `grant("read", "recipes")`) and an object-subject grant
    // referencing the same Drizzle table both match the same target.
    const tableMatch =
      g.subject === "all" ||
      g.subject === table ||
      getTableName(g.subject) === targetName;
    return actionMatch && tableMatch;
  });

  if (matching.length === 0) return [];

  // If any matching grant has no where clause, access is unrestricted
  if (matching.some((g) => !g.where)) return [];

  // Return restricted matching grants (each retains its `with` map)
  return matching.filter(
    (g): g is Grant & { where: NonNullable<Grant["where"]> } => !!g.where,
  );
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
