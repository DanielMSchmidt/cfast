import type {
  Grant,
  GrantFn,
  Permissions,
  PermissionsConfig,
  SchemaMap,
} from "./types";
import { grant } from "./grant";

function buildPermissions<
  TRoles extends readonly string[],
  TUser = unknown,
  TTables extends SchemaMap = SchemaMap,
>(
  config: PermissionsConfig<TRoles, TUser, TTables>,
): Permissions<TRoles> {
  const { roles, hierarchy } = config;

  const grantFn = grant as GrantFn<TUser, TTables>;
  const grants =
    typeof config.grants === "function"
      ? config.grants(grantFn)
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
 * Supports three calling styles:
 * - **Direct:** `definePermissions(config)` when no custom user type is needed.
 * - **Curried (user only):** `definePermissions<MyUser>()(config)` for typed
 *   `where` clause user parameters.
 * - **Curried (user + tables):** `definePermissions<MyUser, typeof schema>()(config)`
 *   to additionally constrain string subjects passed to the `grant` callback
 *   to known table names from the schema map.
 *
 * @param config - The permissions configuration with roles, grants, and optional hierarchy.
 * @returns A {@link Permissions} object containing roles, raw grants, and hierarchy-expanded `resolvedGrants`.
 *
 * @example
 * ```typescript
 * import { definePermissions, grant } from "@cfast/permissions";
 * import { eq } from "drizzle-orm";
 * import * as schema from "./schema";
 * const { posts, comments } = schema;
 *
 * // Direct form — accepts table objects
 * const permissions = definePermissions({
 *   roles: ["anonymous", "user", "admin"] as const,
 *   grants: {
 *     anonymous: [
 *       grant("read", posts, { where: (p) => eq(p.published, true) }),
 *     ],
 *     user: [
 *       grant("read", posts),
 *       grant("create", posts),
 *     ],
 *     admin: [grant("manage", "all")],
 *   },
 * });
 *
 * // Curried form — string subjects constrained to known tables
 * type AuthUser = { id: string };
 * const perms = definePermissions<AuthUser, typeof schema>()({
 *   roles: ["user", "admin"] as const,
 *   grants: (grant) => ({
 *     user: [
 *       grant("read", "posts"),               // string form
 *       grant("update", posts, {              // object form still works
 *         where: (p, u) => eq(p.authorId, u.id),
 *       }),
 *     ],
 *     admin: [grant("manage", "all")],
 *   }),
 * });
 * ```
 */
export function definePermissions<TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles>,
): Permissions<TRoles>;
export function definePermissions<
  TUser,
  TTables extends SchemaMap = SchemaMap,
>(): <TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles, TUser, TTables>,
) => Permissions<TRoles>;
export function definePermissions<TRoles extends readonly string[]>(
  config?: PermissionsConfig<TRoles>,
):
  | Permissions<TRoles>
  | (<TRoles2 extends readonly string[]>(
      config: PermissionsConfig<TRoles2>,
    ) => Permissions<TRoles2>) {
  if (config === undefined) {
    return <TRoles2 extends readonly string[]>(
      c: PermissionsConfig<TRoles2>,
    ) => buildPermissions(c);
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
    resolve(role);
  }

  return resolved;
}
