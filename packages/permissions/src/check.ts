import type {
  Grant,
  PermissionAction,
  PermissionCheckResult,
  PermissionDescriptor,
  Permissions,
} from "./types";
import { CRUD_ACTIONS, getTableName } from "./types";

function grantMatches(
  g: Grant,
  action: PermissionAction,
  table: PermissionDescriptor["table"],
): boolean {
  const actionOk = g.action === action || g.action === "manage";
  const subjectOk = g.subject === "all" || g.subject === table;
  return actionOk && subjectOk;
}

function hasGrantFor(
  grants: Grant[],
  action: PermissionAction,
  table: PermissionDescriptor["table"],
): boolean {
  return grants.some((g) => grantMatches(g, action, table));
}

function hasManagePermission(
  grants: Grant[],
  table: PermissionDescriptor["table"],
): boolean {
  if (hasGrantFor(grants, "manage", table)) return true;
  return CRUD_ACTIONS.every((action) => hasGrantFor(grants, action, table));
}

export function checkPermissions(
  role: string,
  permissions: Permissions,
  descriptors: PermissionDescriptor[],
): PermissionCheckResult {
  const grants = permissions.resolvedGrants[role] ?? [];

  const denied: PermissionDescriptor[] = [];
  const reasons: string[] = [];

  for (const descriptor of descriptors) {
    let permitted: boolean;

    if (descriptor.action === "manage") {
      permitted = hasManagePermission(grants, descriptor.table);
    } else {
      permitted = hasGrantFor(grants, descriptor.action, descriptor.table);
    }

    if (!permitted) {
      denied.push(descriptor);
      reasons.push(
        `Role '${role}' cannot ${descriptor.action} on '${getTableName(descriptor.table)}'`,
      );
    }
  }

  return {
    permitted: denied.length === 0,
    denied,
    reasons,
  };
}
