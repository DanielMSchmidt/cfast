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

/**
 * Creates a permission configuration that can be shared between server-side
 * enforcement (`@cfast/db`) and client-side introspection (`@cfast/actions`).
 *
 * Supports two calling styles:
 * - **Direct:** `definePermissions(config)` when no custom user type is needed.
 * - **Curried:** `definePermissions<MyUser>()(config)` to get typed `where` clause user parameters.
 *
 * @param config - The permissions configuration with roles, grants, and optional hierarchy.
 * @returns A {@link Permissions} object containing roles, raw grants, and hierarchy-expanded `resolvedGrants`.
 *
 * @example
 * ```typescript
 * import { definePermissions, grant } from "@cfast/permissions";
 * import { eq } from "drizzle-orm";
 * import { posts, comments } from "./schema";
 *
 * const permissions = definePermissions({
 *   roles: ["anonymous", "user", "admin"] as const,
 *   grants: {
 *     anonymous: [
 *       grant("read", posts, { where: (p) => eq(p.published, true) }),
 *     ],
 *     user: [
 *       grant("read", posts),
 *       grant("create", posts),
 *       grant("update", posts, { where: (p, u) => eq(p.authorId, u.id) }),
 *     ],
 *     admin: [grant("manage", "all")],
 *   },
 * });
 * ```
 */
export function definePermissions<TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles>,
): Permissions<TRoles>;
export function definePermissions<TUser>(): <
  TRoles extends readonly string[],
>(
  config: PermissionsConfig<TRoles, TUser>,
) => Permissions<TRoles>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function definePermissions(config?: any): any {
  if (config === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
