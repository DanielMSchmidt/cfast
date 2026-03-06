import type { Grant, Permissions, PermissionsConfig } from "./types";

export function definePermissions<
  TRoles extends readonly string[],
  TUser = unknown,
>(config: PermissionsConfig<TRoles, TUser>): Permissions<TRoles, TUser> {
  const { roles, grants, hierarchy } = config;

  const resolvedGrants = resolveHierarchy(roles, grants, hierarchy);

  return {
    roles,
    grants,
    resolvedGrants,
  };
}

function resolveHierarchy<TRoles extends readonly string[], TUser>(
  roles: TRoles,
  grants: Record<string, Grant<TUser>[]>,
  hierarchy?: Partial<Record<string, string[]>>,
): Record<string, Grant<TUser>[]> {
  if (!hierarchy) {
    return { ...grants };
  }

  const resolved: Record<string, Grant<TUser>[]> = {};
  const resolving = new Set<string>();

  function resolve(role: string): Grant<TUser>[] {
    if (resolved[role]) return resolved[role];

    if (resolving.has(role)) {
      throw new Error(
        `Circular role hierarchy detected: '${role}' inherits from itself`,
      );
    }

    resolving.add(role);

    const own = grants[role] ?? [];
    const parents = hierarchy?.[role] ?? [];

    const inherited = parents.flatMap((parent) => resolve(parent));

    resolved[role] = [...inherited, ...own];
    resolving.delete(role);

    return resolved[role];
  }

  for (const role of roles) {
    resolve(role as string);
  }

  return resolved;
}
