import { drizzle } from "drizzle-orm/d1";
import { and, or } from "drizzle-orm";
import type { Grant, PermissionDescriptor, DrizzleTable, PermissionAction } from "@cfast/permissions";
import { resolvePermissionFilters, checkOperationPermissions } from "./permissions";
import type { Operation } from "./types";

type User = { id: string };

type MutateBuilderConfig = {
  d1: D1Database;
  schema: Record<string, unknown>;
  grants: Grant[];
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
  onMutate?: (tableName: string) => void;
};

function makePermissions(
  config: MutateBuilderConfig,
  action: PermissionAction,
): PermissionDescriptor[] {
  return config.unsafe ? [] : [{ action, table: config.table }];
}

function buildMutatePermissionFilter(
  config: MutateBuilderConfig,
  action: PermissionAction,
): unknown {
  if (config.unsafe || !config.user) return undefined;
  const filters = resolvePermissionFilters(config.grants, config.user, action, config.table);
  if (filters.length === 0) return undefined;
  const columns = config.table as Record<string, unknown>;
  const clauses = filters.map((fn) => fn(columns, config.user!));
  return clauses.length === 1 ? clauses[0] : or(...(clauses as [any, ...any[]]));
}

function combineWhere(userCondition: unknown, permFilter: unknown): unknown {
  if (permFilter && userCondition) return and(userCondition as any, permFilter as any);
  return (permFilter ?? userCondition) as any;
}

function getTableName(table: DrizzleTable): string {
  return (table as any)._?.name ?? (table as any)[Symbol.for("drizzle:Name")] ?? "unknown";
}

export function createInsertBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const permissions = makePermissions(config, "create");
  const tableName = getTableName(config.table);

  return {
    values(values: Record<string, unknown>) {
      const base: Operation<void> & { returning: () => Operation<unknown> } = {
        permissions,
        async run(_params: Record<string, unknown>): Promise<void> {
          if (!config.unsafe) {
            checkOperationPermissions(config.grants, permissions);
          }
          await db.insert(config.table as any).values(values).run();
          config.onMutate?.(tableName);
        },
        returning() {
          return {
            permissions,
            async run(_params: Record<string, unknown>): Promise<unknown> {
              if (!config.unsafe) {
                checkOperationPermissions(config.grants, permissions);
              }
              const result = await db
                .insert(config.table as any)
                .values(values)
                .returning()
                .get();
              config.onMutate?.(tableName);
              return result;
            },
          };
        },
      };
      return base;
    },
  };
}

export function createUpdateBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const permissions = makePermissions(config, "update");
  const tableName = getTableName(config.table);

  return {
    set(values: Record<string, unknown>) {
      return {
        where(condition: unknown) {
          const base: Operation<void> & { returning: () => Operation<unknown> } = {
            permissions,
            async run(_params: Record<string, unknown>): Promise<void> {
              if (!config.unsafe) {
                checkOperationPermissions(config.grants, permissions);
              }
              const permFilter = buildMutatePermissionFilter(config, "update");
              const combinedWhere = combineWhere(condition, permFilter);
              await db.update(config.table as any).set(values).where(combinedWhere as any).run();
              config.onMutate?.(tableName);
            },
            returning() {
              return {
                permissions,
                async run(_params: Record<string, unknown>): Promise<unknown> {
                  if (!config.unsafe) {
                    checkOperationPermissions(config.grants, permissions);
                  }
                  const permFilter = buildMutatePermissionFilter(config, "update");
                  const combinedWhere = combineWhere(condition, permFilter);
                  const result = await db
                    .update(config.table as any)
                    .set(values)
                    .where(combinedWhere as any)
                    .returning()
                    .get();
                  config.onMutate?.(tableName);
                  return result;
                },
              };
            },
          };
          return base;
        },
      };
    },
  };
}

export function createDeleteBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const permissions = makePermissions(config, "delete");
  const tableName = getTableName(config.table);

  return {
    where(condition: unknown) {
      const base: Operation<void> & { returning: () => Operation<unknown> } = {
        permissions,
        async run(_params: Record<string, unknown>): Promise<void> {
          if (!config.unsafe) {
            checkOperationPermissions(config.grants, permissions);
          }
          const permFilter = buildMutatePermissionFilter(config, "delete");
          const combinedWhere = combineWhere(condition, permFilter);
          await db.delete(config.table as any).where(combinedWhere as any).run();
          config.onMutate?.(tableName);
        },
        returning() {
          return {
            permissions,
            async run(_params: Record<string, unknown>): Promise<unknown> {
              if (!config.unsafe) {
                checkOperationPermissions(config.grants, permissions);
              }
              const permFilter = buildMutatePermissionFilter(config, "delete");
              const combinedWhere = combineWhere(condition, permFilter);
              const result = await db
                .delete(config.table as any)
                .where(combinedWhere as any)
                .returning()
                .get();
              config.onMutate?.(tableName);
              return result;
            },
          };
        },
      };
      return base;
    },
  };
}
