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

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

/**
 * Extracts the table name string from a Drizzle table reference.
 *
 * @param table - A Drizzle table object containing the `drizzle:Name` symbol.
 * @returns The table name, or `"unknown"` if the symbol is not present.
 */
export function getTableName(table: DrizzleTable): string {
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
 */
export type Grant = {
  /** The permitted operation. `"manage"` is shorthand for all four CRUD actions. */
  action: PermissionAction;
  /** The Drizzle table this grant applies to, or `"all"` for every table. */
  subject: DrizzleTable | "all";
  /** Optional row-level filter that restricts which rows this grant covers. */
  where?: WhereClause;
};

/**
 * Type-safe grant builder function, parameterized by the user type.
 *
 * Used when `grants` is provided as a callback in {@link PermissionsConfig}
 * so that `where` clauses receive a correctly typed `user` parameter.
 *
 * @typeParam TUser - The user type passed to `where` clause callbacks.
 */
export type GrantFn<TUser> = (
  action: PermissionAction,
  subject: DrizzleTable | "all",
  options?: { where?: (columns: Record<string, unknown>, user: TUser) => DrizzleSQL | undefined },
) => Grant;

/**
 * Structural description of a permission requirement.
 *
 * Describes *what kind* of operation on *which table* without specifying concrete row values.
 * This is what makes client-side permission introspection possible: you can check whether a
 * role has the right grants without knowing the specific row being accessed.
 *
 * @example
 * ```typescript
 * const descriptor: PermissionDescriptor = {
 *   action: "update",
 *   table: posts,
 * };
 * ```
 */
export type PermissionDescriptor = {
  /** The operation being checked. */
  action: PermissionAction;
  /** The Drizzle table the operation targets. */
  table: DrizzleTable;
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
 */
export type PermissionsConfig<
  TRoles extends readonly string[],
  TUser = unknown,
> = {
  /** All roles in the application, declared with `as const` for type inference. */
  roles: TRoles;
  /** A map from role to grant arrays, or a callback that receives a typed `grant` function. */
  grants:
    | Record<TRoles[number], Grant[]>
    | ((grant: GrantFn<TUser>) => Record<TRoles[number], Grant[]>);
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
