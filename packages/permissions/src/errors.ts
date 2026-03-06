import type { Table } from "drizzle-orm";
import type { PermissionAction, PermissionDescriptor } from "./types";

function getTableName(table: Table): string {
  return (table as any)._?.name ?? "unknown";
}

type ForbiddenErrorOptions = {
  action: PermissionAction;
  table: Table;
  role: string;
  descriptors?: PermissionDescriptor[];
};

export class ForbiddenError extends Error {
  readonly action: PermissionAction;
  readonly table: Table;
  readonly role: string;
  readonly descriptors: PermissionDescriptor[];

  constructor(options: ForbiddenErrorOptions) {
    const tableName = getTableName(options.table);
    super(`Role '${options.role}' cannot ${options.action} on '${tableName}'`);
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
