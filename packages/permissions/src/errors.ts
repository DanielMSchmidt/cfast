import type { DrizzleTable, PermissionAction, PermissionDescriptor } from "./types";
import { getTableName } from "./types";

type ForbiddenErrorOptions = {
  action: PermissionAction;
  table: DrizzleTable;
  role?: string;
  descriptors?: PermissionDescriptor[];
};

export class ForbiddenError extends Error {
  readonly action: PermissionAction;
  readonly table: DrizzleTable;
  readonly role: string | undefined;
  readonly descriptors: PermissionDescriptor[];

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
