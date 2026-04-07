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
 * A schema map: an object mapping table names to Drizzle table references.
 *
 * Typically the result of `import * as schema from "./schema"`. Used as the
 * `TTables` generic parameter for {@link definePermissions}, {@link can}, and
 * the curried {@link grant} callback so that string subjects (e.g.
 * `"projects"`) are constrained to known table names at compile time.
 */
export type SchemaMap = Record<string, DrizzleTable>;

/**
 * Extracts the string-literal union of valid table names from a {@link SchemaMap}.
 *
 * Given `typeof schema` (where `schema` exports tables as named bindings),
 * `TableName<typeof schema>` is the union of all exported table-key strings.
 */
export type TableName<TTables extends SchemaMap> = Extract<keyof TTables, string>;

/**
 * The set of acceptable subject inputs for a grant or `can()` check.
 *
 * - A {@link DrizzleTable} object reference (the original form, always allowed).
 * - A string-literal table name from {@link TableName}, constrained to the
 *   provided `TTables` schema map at compile time when one is supplied.
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
 * @returns A Drizzle SQL expression to restrict matching rows, or `undefined` for no restriction.
 */
export type WhereClause = (
  columns: Record<string, unknown>,
  user: unknown,
) => DrizzleSQL | undefined;

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
export type GrantFn<TUser, TTables extends SchemaMap = SchemaMap> = (
  action: PermissionAction,
  subject: SubjectInput<TTables>,
  options?: { where?: (columns: Record<string, unknown>, user: TUser) => DrizzleSQL | undefined },
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
