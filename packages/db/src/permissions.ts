import {
  checkPermissions,
  ForbiddenError,
} from "@cfast/permissions";
import type {
  Permissions,
  PermissionDescriptor,
  PermissionAction,
  DrizzleTable,
  Grant,
} from "@cfast/permissions";

type User = { id: string; role: string };

export function resolvePermissionFilters(
  permissions: Permissions,
  user: User,
  action: PermissionAction,
  table: DrizzleTable,
): Array<(columns: Record<string, unknown>, user: User) => unknown> {
  const grants = permissions.resolvedGrants[user.role] ?? [];

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

export function checkOperationPermissions(
  permissions: Permissions,
  user: User | null,
  descriptors: PermissionDescriptor[],
): void {
  if (descriptors.length === 0) return;

  const role = user?.role ?? "anonymous";
  const result = checkPermissions(role, permissions, descriptors);

  if (!result.permitted) {
    const first = result.denied[0];
    throw new ForbiddenError({
      action: first.action,
      table: first.table,
      role,
      descriptors: result.denied,
    });
  }
}
