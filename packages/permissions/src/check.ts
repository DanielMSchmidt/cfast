import type { Table } from "drizzle-orm";
import type {
  Grant,
  PermissionAction,
  PermissionCheckResult,
  PermissionDescriptor,
  Permissions,
} from "./types";
import { CRUD_ACTIONS } from "./types";

function getTableName(table: Table): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (table as any)._?.name ?? "unknown";
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
  grantSubject: Table | "all",
  requiredTable: Table,
): boolean {
  if (grantSubject === "all") return true;
  return grantSubject === requiredTable;
}

function hasGrantFor(
  grants: Grant[],
  action: PermissionAction,
  table: Table,
): boolean {
  return grants.some(
    (g) =>
      grantMatchesAction(g.action, action) &&
      grantMatchesTable(g.subject, table),
  );
}

function hasManagePermission(grants: Grant[], table: Table): boolean {
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
