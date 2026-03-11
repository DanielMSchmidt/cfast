import type { Grant, GrantFn, Permissions, PermissionsConfig } from "./types";
import { grant } from "./grant";

function buildPermissions<TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles>,
): Permissions<TRoles> {
  const { roles, hierarchy } = config;

  const grants =
    typeof config.grants === "function"
      ? config.grants(grant as GrantFn<unknown>)
      : config.grants;

  const resolvedGrants = resolveHierarchy(roles, grants, hierarchy);

  return {
    roles,
    grants,
    resolvedGrants,
  };
}

export function definePermissions<TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles>,
): Permissions<TRoles>;
export function definePermissions<TUser>(): <
  TRoles extends readonly string[],
>(
  config: PermissionsConfig<TRoles, TUser>,
) => Permissions<TRoles>;
export function definePermissions(config?: any): any {
  if (config === undefined) {
    return (c: any) => buildPermissions(c);
  }
  return buildPermissions(config);
}

function resolveHierarchy<TRoles extends readonly string[]>(
  roles: TRoles,
  grants: Record<string, Grant[]>,
  hierarchy?: Partial<Record<string, string[]>>,
): Record<string, Grant[]> {
  if (!hierarchy) {
    return { ...grants };
  }

  const resolved: Record<string, Grant[]> = {};
  const resolving = new Set<string>();

  function resolve(role: string): Grant[] {
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
