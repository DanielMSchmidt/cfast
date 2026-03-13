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
  const subjectOk =
    g.subject === "all" ||
    g.subject === table ||
    getTableName(g.subject) === getTableName(table);
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

/**
 * Checks whether a role satisfies a set of permission descriptors.
 *
 * This is the low-level structural checking function. It determines whether a
 * role has *any* matching grant for each descriptor (action + table), without
 * evaluating row-level `where` clauses. Row-level enforcement happens at
 * execution time in `@cfast/db`.
 *
 * @param role - The role to check (e.g., `"user"`, `"admin"`).
 * @param permissions - The permissions object from {@link definePermissions}.
 * @param descriptors - Array of permission descriptors to check against.
 * @returns A {@link PermissionCheckResult} with `permitted`, `denied`, and `reasons`.
 *
 * @example
 * ```typescript
 * import { checkPermissions, definePermissions, grant } from "@cfast/permissions";
 *
 * const permissions = definePermissions({
 *   roles: ["user", "admin"] as const,
 *   grants: {
 *     user: [grant("read", posts), grant("create", posts)],
 *     admin: [grant("manage", "all")],
 *   },
 * });
 *
 * const result = checkPermissions("user", permissions, [
 *   { action: "update", table: posts },
 * ]);
 * result.permitted; // false
 * result.denied;    // [{ action: "update", table: posts }]
 * ```
 */
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
