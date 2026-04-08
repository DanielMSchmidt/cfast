/**
 * Minimal structural type for a Drizzle ORM table reference.
 *
 * Drizzle stores table metadata via Symbols (e.g., `Symbol('drizzle:Name')`).
 * Uses `object` so real Drizzle table classes (which lack an explicit index
 * signature) are assignable without an `as` cast, while still excluding
 * primitives.
 */
export type DrizzleTable = object;

/**
 * Minimal structural type for a Drizzle SQL expression.
 *
 * Matches any object with a `getSQL()` method, which includes Drizzle's
 * `SQL`, `SQLWrapper`, and condition builder results.
 */
export type DrizzleSQL = { getSQL(): unknown };

/**
 * A schema map: an object mapping JS schema keys to Drizzle table references.
 *
 * Typically the result of `import * as schema from "./schema"`. Used as the
 * `TTables` generic parameter for {@link definePermissions}, {@link can}, and
 * the curried {@link grant} callback so that string subjects (e.g.
 * `"projects"` or `"project_versions"`) are constrained to known table names
 * at compile time.
 */
export type SchemaMap = Record<string, DrizzleTable>;

/**
 * Structural shape of a Drizzle table's static metadata used purely for
 * type-level SQL-name extraction.
 *
 * Drizzle tables expose their SQL name on a readonly `_.name` field (see
 * `drizzle-orm/table` `Table._.name`). By narrowing against this shape we can
 * extract `"project_versions"` from `typeof projectVersions` even though the
 * runtime value lives on a `Symbol.for("drizzle:Name")` key.
 */
type TableWithSqlName = { _: { name: string } };

/**
 * Extracts the SQL table name literal from a Drizzle table reference, or
 * `never` when the argument is not a Drizzle table with a `_.name` field.
 *
 * @example
 * ```ts
 * const postVersions = sqliteTable("post_versions", { ... });
 * type N = SqlNameOf<typeof postVersions>; // "post_versions"
 * ```
 */
export type SqlNameOf<T> = T extends TableWithSqlName
  ? T["_"]["name"] extends string
    ? T["_"]["name"]
    : never
  : never;

/**
 * Extracts the string-literal union of valid subject keys from a
 * {@link SchemaMap}, including **both** the JS schema keys (e.g.
 * `"postVersions"`) and the SQL table names (e.g. `"post_versions"`).
 *
 * The runtime side of `definePermissions<User, Schema>()` builds a
 * matching lookup table keyed by both forms, so the two string forms are
 * fully interchangeable — whichever matches your mental model.
 *
 * Without this, string subjects were accidentally constrained to JS keys
 * only (#177), causing confusion when a schema's JS key differs from its
 * SQL table name (e.g. `documentVersions` vs `document_versions`).
 */
export type TableName<TTables extends SchemaMap> =
  | Extract<keyof TTables, string>
  | SqlNameOf<TTables[keyof TTables]>;

/**
 * The set of acceptable subject inputs for a grant or `can()` check.
 *
 * - A {@link DrizzleTable} object reference (the original form, always allowed).
 * - A string-literal table name from {@link TableName} — either the JS schema
 *   key (`"postVersions"`) or the SQL table name (`"post_versions"`) — both
 *   resolve to the same underlying table at runtime.
 * - The literal `"all"` for grants that apply to every table.
 */
export type SubjectInput<TTables extends SchemaMap = SchemaMap> =
  | DrizzleTable
  | TableName<TTables>
  | "all";

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

/**
 * Extracts the table name string from a Drizzle table reference, or returns
 * a string subject as-is.
 *
 * Accepts both:
 * - A Drizzle table object containing the `drizzle:Name` symbol — the symbol
 *   is read via `Reflect.get`.
 * - A bare string (e.g., a table-name literal like `"projects"`) — returned
 *   unchanged so callers can use the same key for grant matching whether the
 *   subject was declared as an object or a string.
 *
 * @param table - A Drizzle table object or a string subject key.
 * @returns The table name, the input string, or `"unknown"` if a symbol-less
 *   object was provided.
 */
export function getTableName(table: DrizzleTable | string): string {
  if (typeof table === "string") {
    return table;
  }
  // Use DRIZZLE_NAME_SYMBOL as a property key on the table object.
  // DrizzleTable is typed as `object` to accept Drizzle class instances;
  // Reflect.get safely reads the symbol-keyed property without requiring
  // an index signature.
  const name: unknown = Reflect.get(table, DRIZZLE_NAME_SYMBOL);
  return typeof name === "string" ? name : "unknown";
}

/**
 * A permission action: one of the four CRUD operations, or `"manage"` for all.
 *
 * - `"read"` maps to `SELECT` queries.
 * - `"create"` maps to `INSERT` statements.
 * - `"update"` maps to `UPDATE` statements.
 * - `"delete"` maps to `DELETE` statements.
 * - `"manage"` is shorthand for granting all four CRUD actions.
 */
export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

/**
 * A CRUD-only permission action (excludes `"manage"`).
 *
 * Useful when you need to iterate over concrete operations without the
 * `"manage"` shorthand. See also {@link CRUD_ACTIONS}.
 */
export type CrudAction = Exclude<PermissionAction, "manage">;

/**
 * Readonly array of the four CRUD action strings, useful for iteration.
 *
 * @example
 * ```typescript
 * import { CRUD_ACTIONS } from "@cfast/permissions";
 *
 * for (const action of CRUD_ACTIONS) {
 *   console.log(action); // "read", "create", "update", "delete"
 * }
 * ```
 */
export const CRUD_ACTIONS: readonly CrudAction[] = ["read", "create", "update", "delete"] as const;

/**
 * A function that produces a Drizzle `WHERE` clause for row-level permission filtering.
 *
 * @param columns - The table's column references for building filter expressions.
 * @param user - The current user object (from `@cfast/auth`).
 * @param lookups - Resolved values from the grant's `with` map (see {@link Grant.with}).
 *   Empty object when the grant declares no `with` map. Each key holds the awaited
 *   result of the lookup function with the same name.
 * @returns A Drizzle SQL expression to restrict matching rows, or `undefined` for no restriction.
 */
export type WhereClause = (
  columns: Record<string, unknown>,
  user: unknown,
  lookups: Record<string, unknown>,
) => DrizzleSQL | undefined;

/**
 * Minimal structural type for the read-only database handle passed to grant
 * `with` lookup functions.
 *
 * Defined here so the permissions package stays independent of `@cfast/db`.
 * The runtime instance is provided by `@cfast/db` (an unsafe-mode db) and
 * is structurally compatible with this interface, so authors can call
 * `db.query(table).findMany().run()` inside a lookup without casting.
 *
 * The `query` method is intentionally typed loosely (`unknown` arguments and
 * results) to avoid pulling Drizzle generics into the permissions surface.
 * Authors typically know exactly which table they are querying and cast the
 * result inline.
 */
export interface LookupDb {
  query: (table: DrizzleTable | string) => {
    findMany: (options?: unknown) => { run: (params?: unknown) => Promise<unknown[]> };
    findFirst: (options?: unknown) => { run: (params?: unknown) => Promise<unknown> };
  };
}

/**
 * A single prerequisite lookup function for a grant's `with` map.
 *
 * Lookups run **before** the main query and their resolved values are passed
 * as the third argument to the grant's {@link WhereClause}. Use them to gather
 * data from other tables that a row-level filter depends on (for example,
 * the set of friend ids that a user can see content for).
 *
 * Lookups receive an unsafe-mode db handle so they can read freely without
 * recursively triggering permission checks. Their results are cached for the
 * lifetime of the per-request `Db` instance, so a single lookup runs at most
 * once even when the same grant is consulted multiple times.
 *
 * @typeParam TUser - The user type (typed via `definePermissions<TUser>`).
 */
export type LookupFn<TUser = unknown> = (
  user: TUser,
  db: LookupDb,
) => Promise<unknown> | unknown;

/**
 * A map of named prerequisite lookups for a grant.
 *
 * Each value is a {@link LookupFn} whose resolved result is passed to the
 * grant's `where` clause via the third `lookups` argument under the same key.
 *
 * @typeParam TUser - The user type (typed via `definePermissions<TUser>`).
 */
export type WithLookups<TUser = unknown> = Record<string, LookupFn<TUser>>;

/**
 * A single permission grant: an action on a subject, optionally restricted by a `where` clause.
 *
 * `subject` may be a Drizzle table object, a string table name (e.g.
 * `"projects"`), or the literal `"all"` for grants that apply to every table.
 * String and object subjects are normalized to the same key by
 * {@link getTableName} during matching, so the two forms are interchangeable
 * at runtime.
 */
export type Grant = {
  /** The permitted operation. `"manage"` is shorthand for all four CRUD actions. */
  action: PermissionAction;
  /**
   * The subject of the grant: a Drizzle table object, a string table name,
   * or `"all"` for every table.
   */
  subject: DrizzleTable | string;
  /**
   * Optional prerequisite lookups that resolve **before** the main query and
   * are passed to the {@link where} clause as its third argument.
   *
   * Each lookup receives the current user and an unsafe-mode db handle and
   * may return any value (synchronously or as a promise). Results are cached
   * per `Db` instance, so a single lookup runs at most once per request even
   * when the same grant participates in multiple queries.
   *
   * @example
   * ```ts
   * grant("read", recipes, {
   *   with: {
   *     friendIds: async (user, db) => {
   *       const rows = await db
   *         .query(friendGrants)
   *         .findMany({ where: eq(friendGrants.grantee, user.id) })
   *         .run();
   *       return (rows as { target: string }[]).map((r) => r.target);
   *     },
   *   },
   *   where: (recipe, user, { friendIds }) =>
   *     or(
   *       eq(recipe.visibility, "public"),
   *       eq(recipe.authorId, user.id),
   *       inArray(recipe.authorId, friendIds as string[]),
   *     ),
   * });
   * ```
   */
  with?: WithLookups;
  /** Optional row-level filter that restricts which rows this grant covers. */
  where?: WhereClause;
};

/**
 * Type-safe grant builder function, parameterized by the user type and an
 * optional schema map.
 *
 * Used when `grants` is provided as a callback in {@link PermissionsConfig}
 * so that `where` clauses receive a correctly typed `user` parameter and
 * string subjects are constrained to known table names from `TTables`.
 *
 * @typeParam TUser - The user type passed to `where` clause callbacks.
 * @typeParam TTables - Optional schema map (e.g. `typeof schema`) used to
 *   constrain string subjects to known table-name literals.
 */
export type GrantFn<TUser, TTables extends SchemaMap = SchemaMap> = <
  TWith extends WithLookups<TUser> = WithLookups<TUser>,
>(
  action: PermissionAction,
  subject: SubjectInput<TTables>,
  options?: {
    /**
     * Prerequisite lookups whose resolved values are passed to {@link where}
     * via its third argument. See {@link Grant.with}.
     */
    with?: TWith;
    /**
     * Row-level filter. The third argument exposes the resolved values from
     * {@link with}, keyed by the same names; pass an empty `with` map (or
     * omit it) when the filter does not need cross-table data.
     */
    where?: (
      columns: Record<string, unknown>,
      user: TUser,
      lookups: { [K in keyof TWith]: Awaited<ReturnType<TWith[K]>> },
    ) => DrizzleSQL | undefined;
  },
) => Grant;

/**
 * Structural description of a permission requirement.
 *
 * Describes *what kind* of operation on *which table* without specifying concrete row values.
 * This is what makes client-side permission introspection possible: you can check whether a
 * role has the right grants without knowing the specific row being accessed.
 *
 * The `table` field accepts either a Drizzle table object or a string table
 * name; both forms are normalized to the same key by {@link getTableName}.
 *
 * @example
 * ```typescript
 * const descriptor: PermissionDescriptor = {
 *   action: "update",
 *   table: posts,         // object form
 * };
 *
 * const descriptor2: PermissionDescriptor = {
 *   action: "create",
 *   table: "posts",       // string form
 * };
 * ```
 */
export type PermissionDescriptor = {
  /** The operation being checked. */
  action: PermissionAction;
  /** The Drizzle table or string table name the operation targets. */
  table: DrizzleTable | string;
};

/**
 * Result of a permission check via {@link checkPermissions}.
 */
export type PermissionCheckResult = {
  /** `true` only if every descriptor in the check was satisfied. */
  permitted: boolean;
  /** The descriptors that were not satisfied. */
  denied: PermissionDescriptor[];
  /** Human-readable reasons for each denial. */
  reasons: string[];
};

/**
 * Configuration object for {@link definePermissions}.
 *
 * @typeParam TRoles - Tuple of role name string literals (use `as const`).
 * @typeParam TUser - The user type for typed `where` clauses (defaults to `unknown`).
 * @typeParam TTables - Optional schema map used to constrain string subjects
 *   inside the `grants` callback to known table names.
 */
export type PermissionsConfig<
  TRoles extends readonly string[],
  TUser = unknown,
  TTables extends SchemaMap = SchemaMap,
> = {
  /** All roles in the application, declared with `as const` for type inference. */
  roles: TRoles;
  /** A map from role to grant arrays, or a callback that receives a typed `grant` function. */
  grants:
    | Record<TRoles[number], Grant[]>
    | ((grant: GrantFn<TUser, TTables>) => Record<TRoles[number], Grant[]>);
  /** Optional role hierarchy declaring which roles inherit from which. */
  hierarchy?: Partial<Record<TRoles[number], TRoles[number][]>>;
};

/**
 * The resolved permissions object returned by {@link definePermissions}.
 *
 * Contains the original roles and grants, plus the hierarchy-expanded `resolvedGrants`.
 * Pass this to `createDb()` for server-side enforcement or import it on the client
 * for UI-level permission introspection.
 *
 * @typeParam TRoles - Tuple of role name string literals.
 */
export type Permissions<
  TRoles extends readonly string[] = readonly string[],
> = {
  /** The role names from the configuration. */
  roles: TRoles;
  /** The raw grants as declared (before hierarchy expansion). */
  grants: Record<TRoles[number], Grant[]>;
  /** Grants expanded with inherited grants from the role hierarchy. */
  resolvedGrants: Record<TRoles[number], Grant[]>;
};
