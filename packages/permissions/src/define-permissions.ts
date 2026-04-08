import type {
  DrizzleTable,
  Grant,
  GrantFn,
  Permissions,
  PermissionAction,
  PermissionsConfig,
  SchemaMap,
  SubjectInput,
  WithLookups,
  WhereClause,
} from "./types";
import { getTableName } from "./types";
import { grant } from "./grant";
import { PermissionRegistrationError } from "./errors";

/**
 * Walks a schema map and returns a lookup indexed by **both** the JS key
 * (e.g. `"documentVersions"`) and the SQL table name (e.g.
 * `"document_versions"`) so string-form grant subjects can resolve to the
 * exact same table reference Drizzle uses internally.
 *
 * Why both? Issue #177: the llms.txt example happened to use `"posts"` as
 * both the JS key and the SQL name, masking the bug. Users with typical
 * `camelCase` JS keys and `snake_case` SQL names expect either form to work.
 *
 * @param schema - The schema map (typically `import * as schema from "./schema"`).
 * @returns A `{ [alias: string]: DrizzleTable }` lookup. When the JS key and
 *   the SQL name collide, the table reference is the same, so overwrites are
 *   harmless.
 */
function buildSchemaLookup(schema: SchemaMap | undefined): {
  lookup: Map<string, DrizzleTable>;
  available: string[];
} {
  const lookup = new Map<string, DrizzleTable>();
  const available = new Set<string>();
  if (!schema) return { lookup, available: [] };

  for (const [jsKey, table] of Object.entries(schema)) {
    if (!table || (typeof table !== "object" && typeof table !== "function")) {
      continue;
    }
    lookup.set(jsKey, table);
    available.add(jsKey);

    const sqlName = getTableName(table);
    if (sqlName && sqlName !== "unknown") {
      lookup.set(sqlName, table);
      available.add(sqlName);
    }
  }

  return { lookup, available: [...available] };
}

/**
 * Wraps the standalone {@link grant} builder with a schema-aware resolver.
 *
 * When the caller passes a **string** subject (e.g. `grant("read", "posts")`),
 * this closure:
 *   1. Resolves the string to a real Drizzle table reference via `lookup`.
 *   2. Throws {@link PermissionRegistrationError} with a clear list of
 *      available tables if the string is unknown.
 *   3. Stores the resolved table object on the {@link Grant} so downstream
 *      consumers (`@cfast/db`, `resolveGrants`, `can`) always see the same
 *      reference Drizzle uses internally. No shadow tables — ever.
 *
 * Object subjects and the literal `"all"` are passed through unchanged.
 *
 * Without this resolution, the `with` option on Drizzle's relational query
 * builder silently returns empty arrays when the permission grant's table
 * reference differs from the one registered in the schema (issues #146, #175).
 */
function makeSchemaAwareGrant<TUser, TTables extends SchemaMap>(
  lookup: Map<string, DrizzleTable>,
  available: readonly string[],
): GrantFn<TUser, TTables> {
  const schemaGrant = ((
    action: PermissionAction,
    subject: SubjectInput<TTables>,
    options?: { with?: WithLookups; where?: WhereClause },
  ): Grant => {
    // Object form and "all" need no resolution — delegate straight to `grant()`.
    if (typeof subject !== "string" || subject === "all") {
      return grant(action, subject, options);
    }

    const resolved = lookup.get(subject);
    if (!resolved) {
      throw new PermissionRegistrationError(subject, available);
    }
    return grant(action, resolved, options);
  }) as GrantFn<TUser, TTables>;
  return schemaGrant;
}

function buildPermissions<
  TRoles extends readonly string[],
  TUser = unknown,
  TTables extends SchemaMap = SchemaMap,
>(
  config: PermissionsConfig<TRoles, TUser, TTables>,
  schema?: TTables,
): Permissions<TRoles> {
  const { roles, hierarchy } = config;

  const grantFn: GrantFn<TUser, TTables> = schema
    ? (() => {
        const { lookup, available } = buildSchemaLookup(schema);
        return makeSchemaAwareGrant<TUser, TTables>(lookup, available);
      })()
    : (grant as GrantFn<TUser, TTables>);

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
 * Supports four calling styles:
 *
 * 1. **Direct:** `definePermissions(config)` — when no custom user type and
 *    no schema map is needed.
 *
 * 2. **Curried (user only):** `definePermissions<MyUser>()(config)` — types
 *    the `user` parameter inside `where` clauses. String subjects are still
 *    accepted but are **not** compile-time or runtime validated against a
 *    schema; they are stored as opaque strings and matched by `getTableName`.
 *
 * 3. **Curried (user + schema types only, no runtime schema):**
 *    `definePermissions<MyUser, typeof schema>()(config)` — constrains
 *    string subjects to `"jsKey" | "sql_name"` at compile time, but at
 *    runtime still stores strings opaquely. Prefer style (4) when you can.
 *
 * 4. **Curried with runtime schema (RECOMMENDED):**
 *    `definePermissions<MyUser, typeof schema>({ schema })(config)` — walks
 *    the schema at startup and resolves every string-form subject to the
 *    exact Drizzle table reference the schema uses. This is the only form
 *    that lets string-form grants work with Drizzle relational `with`
 *    queries, because Drizzle identifies tables by reference, not name
 *    (see issues #146, #175, #177).
 *
 *    - Unknown strings throw {@link PermissionRegistrationError} **at
 *      startup** (fast, loud failure instead of silently matching nothing).
 *    - Both the JS key (`"documentVersions"`) and the SQL table name
 *      (`"document_versions"`) resolve to the same table reference.
 *    - Object-form subjects still work unchanged.
 *
 * @param configOrOptions - Either the permissions config (style 1) or the
 *   resolver options `{ schema }` (style 4). When omitted entirely, returns
 *   the curried form (styles 2 and 3).
 * @returns A {@link Permissions} object, or a function that takes a config
 *   and returns one.
 *
 * @example
 * ```typescript
 * import { definePermissions, grant } from "@cfast/permissions";
 * import { eq } from "drizzle-orm";
 * import * as schema from "./schema";
 * const { posts, comments } = schema;
 *
 * // Style 1 — direct, accepts table objects
 * const permissions = definePermissions({
 *   roles: ["anonymous", "user", "admin"] as const,
 *   grants: {
 *     anonymous: [
 *       grant("read", posts, { where: (p) => eq(p.published, true) }),
 *     ],
 *     user: [grant("read", posts), grant("create", posts)],
 *     admin: [grant("manage", "all")],
 *   },
 * });
 *
 * // Style 4 — recommended: runtime-resolved string subjects
 * type AuthUser = { id: string };
 * const perms = definePermissions<AuthUser, typeof schema>({ schema })({
 *   roles: ["user", "admin"] as const,
 *   grants: (grant) => ({
 *     user: [
 *       grant("read", "posts"),                // JS key — resolves
 *       grant("create", "post_versions"),      // SQL name — also resolves
 *       grant("update", posts, {               // object form still works
 *         where: (p, u) => eq(p.authorId, u.id),
 *       }),
 *       // grant("read", "unknownTable"),      // throws at startup
 *     ],
 *     admin: [grant("manage", "all")],
 *   }),
 * });
 * ```
 */
// Overload 1: direct form — `definePermissions(config)`
export function definePermissions<TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles>,
): Permissions<TRoles>;
// Overload 2: curried form with runtime schema — `definePermissions<User, Schema>({ schema })(config)`
export function definePermissions<
  TUser,
  TTables extends SchemaMap,
>(
  options: { schema: TTables },
): <TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles, TUser, TTables>,
) => Permissions<TRoles>;
// Overload 3: curried form without runtime schema — `definePermissions<User>()(config)` / `definePermissions<User, Schema>()(config)`
export function definePermissions<
  TUser,
  TTables extends SchemaMap = SchemaMap,
>(): <TRoles extends readonly string[]>(
  config: PermissionsConfig<TRoles, TUser, TTables>,
) => Permissions<TRoles>;
export function definePermissions<TRoles extends readonly string[]>(
  configOrOptions?:
    | PermissionsConfig<TRoles>
    | { schema: SchemaMap },
):
  | Permissions<TRoles>
  | (<TRoles2 extends readonly string[]>(
      config: PermissionsConfig<TRoles2>,
    ) => Permissions<TRoles2>) {
  // Case A: no argument — curried form with no runtime schema.
  if (configOrOptions === undefined) {
    return <TRoles2 extends readonly string[]>(
      c: PermissionsConfig<TRoles2>,
    ) => buildPermissions(c);
  }

  // Case B: argument is `{ schema }` — curried form with runtime resolution.
  // Use a structural probe rather than `in` so we only route here for the
  // options bag, never for a real `PermissionsConfig` that happened to carry
  // an unrelated `schema` field.
  if (isSchemaOptions(configOrOptions)) {
    const { schema } = configOrOptions;
    return <TRoles2 extends readonly string[]>(
      c: PermissionsConfig<TRoles2, unknown, SchemaMap>,
    ) => buildPermissions(c, schema);
  }

  // Case C: argument is a PermissionsConfig — direct form.
  return buildPermissions(configOrOptions);
}

/**
 * Type guard distinguishing the runtime-schema options bag from a
 * {@link PermissionsConfig}.
 *
 * We rely on the presence of `schema` (which is only in the options bag)
 * and the absence of `roles` (which any real config must declare).
 */
function isSchemaOptions(
  value: PermissionsConfig<readonly string[]> | { schema: SchemaMap },
): value is { schema: SchemaMap } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { schema?: unknown; roles?: unknown };
  return (
    v.schema !== undefined &&
    typeof v.schema === "object" &&
    v.schema !== null &&
    v.roles === undefined
  );
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
