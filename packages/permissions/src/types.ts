import type { Table, SQL } from "drizzle-orm";

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export type CrudAction = Exclude<PermissionAction, "manage">;

export const CRUD_ACTIONS: readonly CrudAction[] = ["read", "create", "update", "delete"] as const;

export type WhereClause<TUser = unknown> = (
  columns: Record<string, unknown>,
  user: TUser,
) => SQL | undefined;

export type Grant<TUser = unknown> = {
  action: PermissionAction;
  subject: Table | "all";
  where?: WhereClause<TUser>;
};

export type PermissionDescriptor = {
  action: PermissionAction;
  table: Table;
};

export type PermissionCheckResult = {
  permitted: boolean;
  denied: PermissionDescriptor[];
  reasons: string[];
};

export type PermissionsConfig<
  TRoles extends readonly string[],
  TUser = unknown,
> = {
  roles: TRoles;
  grants: Record<TRoles[number], Grant<TUser>[]>;
  hierarchy?: Partial<Record<TRoles[number], TRoles[number][]>>;
};

export type Permissions<
  TRoles extends readonly string[] = readonly string[],
  TUser = unknown,
> = {
  roles: TRoles;
  grants: Record<TRoles[number], Grant<TUser>[]>;
  resolvedGrants: Record<TRoles[number], Grant<TUser>[]>;
};
