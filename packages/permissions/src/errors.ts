import type { DrizzleTable, PermissionAction, PermissionDescriptor } from "./types";
import { getTableName } from "./types";

/** Options for constructing a {@link ForbiddenError}. */
type ForbiddenErrorOptions = {
  /** The action that was denied. */
  action: PermissionAction;
  /** The Drizzle table or string table name the action targeted. */
  table: DrizzleTable | string;
  /** The role that lacked the permission, if known. */
  role?: string;
  /** The full list of permission descriptors that were checked. */
  descriptors?: PermissionDescriptor[];
};

/**
 * Error thrown when a permission check fails during an operation.
 *
 * Extends `Error` with structured fields for the denied action, target table,
 * and role. Includes a `toJSON()` method so it can be serialized across the
 * server/client boundary.
 */
export class ForbiddenError extends Error {
  /** The action that was denied (e.g., `"delete"`). */
  readonly action: PermissionAction;
  /** The Drizzle table or string table name the action targeted. */
  readonly table: DrizzleTable | string;
  /** The role that lacked the permission, or `undefined` if not specified. */
  readonly role: string | undefined;
  /** The full list of permission descriptors that were checked. */
  readonly descriptors: PermissionDescriptor[];

  /**
   * Creates a new `ForbiddenError`.
   *
   * @param options - The action, table, and optional role/descriptors for the error.
   */
  constructor(options: ForbiddenErrorOptions) {
    const tableName = getTableName(options.table);
    const msg = options.role
      ? `Role '${options.role}' cannot ${options.action} on '${tableName}'`
      : `Cannot ${options.action} on '${tableName}'`;
    super(msg);
    this.name = "ForbiddenError";
    this.action = options.action;
    this.table = options.table;
    this.role = options.role;
    this.descriptors = options.descriptors ?? [];
  }

  /**
   * Serializes the error to a JSON-safe object for server-to-client transfer.
   *
   * @returns A plain object with `name`, `message`, `action`, `table`, and `role` fields.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      table: getTableName(this.table),
      role: this.role,
    };
  }
}

/**
 * Error thrown at **permission-definition time** when a string-form subject
 * passed to the `grant` callback inside
 * `definePermissions<User, typeof schema>()` cannot be resolved to a real
 * Drizzle table reference from the schema map.
 *
 * This is the runtime sibling of the compile-time constraint on
 * {@link TableName} — it catches cases where the schema generic was skipped,
 * the string was typed wrong (typo, wrong case), or the table was removed
 * from the schema without updating the grant.
 *
 * Unlike {@link ForbiddenError} (thrown per-request on a permission check),
 * `PermissionRegistrationError` is thrown **once at startup** from
 * `definePermissions()` — so a misconfigured grant fails fast and loud
 * instead of silently matching nothing at query time.
 */
export class PermissionRegistrationError extends Error {
  /** The unresolved subject string that was passed to `grant()`. */
  readonly subject: string;
  /** The available table names (both JS keys and SQL names) from the schema. */
  readonly availableTables: readonly string[];

  constructor(subject: string, availableTables: readonly string[]) {
    const sorted = [...availableTables].sort();
    const list =
      sorted.length === 0
        ? "<empty schema>"
        : sorted.map((n) => `"${n}"`).join(", ");
    super(
      `grant() subject "${subject}" does not match any table in the schema. ` +
        `Available tables (by JS key and SQL name): ${list}. ` +
        `Did you forget to pass the schema as the second generic to ` +
        `definePermissions<User, typeof schema>()?`,
    );
    this.name = "PermissionRegistrationError";
    this.subject = subject;
    this.availableTables = sorted;
  }
}
