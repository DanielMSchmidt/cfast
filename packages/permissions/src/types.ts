// Minimal structural types for Drizzle.
// Drizzle stores table metadata via Symbols (e.g. Symbol('drizzle:Name')).
// We use a loose type to avoid importing drizzle-orm directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleTable = Record<string | symbol, any>;
export type DrizzleSQL = { getSQL(): unknown };

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

export function getTableName(table: DrizzleTable): string {
  return (table[DRIZZLE_NAME_SYMBOL] as string) ?? "unknown";
}

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export type CrudAction = Exclude<PermissionAction, "manage">;

export const CRUD_ACTIONS: readonly CrudAction[] = ["read", "create", "update", "delete"] as const;

export type WhereClause = (
  columns: Record<string, unknown>,
  user: any,
) => DrizzleSQL | undefined;

export type Grant = {
  action: PermissionAction;
  subject: DrizzleTable | "all";
  where?: WhereClause;
};

export type GrantFn<TUser> = (
  action: PermissionAction,
  subject: DrizzleTable | "all",
  options?: { where?: (columns: Record<string, unknown>, user: TUser) => DrizzleSQL | undefined },
) => Grant;

export type PermissionDescriptor = {
  action: PermissionAction;
  table: DrizzleTable;
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
  grants:
    | Record<TRoles[number], Grant[]>
    | ((grant: GrantFn<TUser>) => Record<TRoles[number], Grant[]>);
  hierarchy?: Partial<Record<TRoles[number], TRoles[number][]>>;
};

export type Permissions<
  TRoles extends readonly string[] = readonly string[],
> = {
  roles: TRoles;
  grants: Record<TRoles[number], Grant[]>;
  resolvedGrants: Record<TRoles[number], Grant[]>;
};
