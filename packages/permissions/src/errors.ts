import type { DrizzleTable, PermissionAction, PermissionDescriptor } from "./types";
import { getTableName } from "./types";

/** Options for constructing a {@link ForbiddenError}. */
type ForbiddenErrorOptions = {
  /** The action that was denied. */
  action: PermissionAction;
  /** The Drizzle table the action targeted. */
  table: DrizzleTable;
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
  /** The Drizzle table the action targeted. */
  readonly table: DrizzleTable;
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
