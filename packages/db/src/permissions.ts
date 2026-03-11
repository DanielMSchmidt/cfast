import {
  ForbiddenError,
} from "@cfast/permissions";
import type {
  PermissionDescriptor,
  PermissionAction,
  DrizzleTable,
  Grant,
} from "@cfast/permissions";
import { CRUD_ACTIONS } from "@cfast/permissions";

type User = { id: string };

export function resolvePermissionFilters(
  grants: Grant[],
  user: User,
  action: PermissionAction,
  table: DrizzleTable,
): Array<(columns: Record<string, unknown>, user: User) => unknown> {
  const matching = grants.filter((g) => {
    const actionMatch = g.action === action || g.action === "manage";
    const tableMatch = g.subject === "all" || g.subject === table;
    return actionMatch && tableMatch;
  });

  if (matching.length === 0) return [];

  // If any matching grant has no where clause, access is unrestricted
  if (matching.some((g) => !g.where)) return [];

  // Return all where clause functions
  return matching
    .filter((g): g is Grant & { where: NonNullable<Grant["where"]> } => !!g.where)
    .map((g) => g.where as (columns: Record<string, unknown>, user: User) => unknown);
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
  grantSubject: DrizzleTable | "all",
  requiredTable: DrizzleTable,
): boolean {
  if (grantSubject === "all") return true;
  return grantSubject === requiredTable;
}

function hasGrantFor(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
): boolean {
  return grants.some(
    (g) =>
      grantMatchesAction(g.action, action) &&
      grantMatchesTable(g.subject, table),
  );
}

function hasManagePermission(grants: Grant[], table: DrizzleTable): boolean {
  if (hasGrantFor(grants, "manage", table)) return true;
  return CRUD_ACTIONS.every((action) => hasGrantFor(grants, action, table));
}

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
        role: "unknown",
        descriptors: [descriptor],
      });
    }
  }
}
