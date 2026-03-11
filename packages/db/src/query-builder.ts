import { drizzle } from "drizzle-orm/d1";
import { and, or } from "drizzle-orm";
import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import { resolvePermissionFilters, checkOperationPermissions } from "./permissions";
import type { Operation, FindManyOptions, FindFirstOptions } from "./types";

type User = { id: string };

type QueryBuilderConfig = {
  d1: D1Database;
  schema: Record<string, unknown>;
  grants: Grant[];
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
};

function getTableKey(schema: Record<string, unknown>, table: DrizzleTable): string | undefined {
  for (const [key, val] of Object.entries(schema)) {
    if (val === table) return key;
  }
  return undefined;
}

function buildPermissionFilter(
  config: QueryBuilderConfig,
  table: DrizzleTable,
): unknown {
  if (config.unsafe || !config.user) return undefined;
  const filters = resolvePermissionFilters(config.grants, config.user, "read", table);
  if (filters.length === 0) return undefined;

  const columns = table as Record<string, unknown>;
  const clauses = filters.map((fn) => fn(columns, config.user!));
  return clauses.length === 1 ? clauses[0] : or(...(clauses as [any, ...any[]]));
}

export function createQueryBuilder(config: QueryBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const tableKey = getTableKey(config.schema, config.table);

  return {
    findMany(options?: FindManyOptions): Operation<unknown[]> {
      const permissions: PermissionDescriptor[] = config.unsafe
        ? []
        : [{ action: "read" as const, table: config.table }];

      return {
        permissions,
        async run(_params: Record<string, unknown>): Promise<unknown[]> {
          if (!config.unsafe) {
            checkOperationPermissions(config.grants, permissions);
          }

          if (!tableKey) throw new Error("Table not found in schema");

          const permFilter = buildPermissionFilter(config, config.table);
          const userWhere = options?.where;
          const combinedWhere = permFilter && userWhere
            ? and(userWhere as any, permFilter as any)
            : (permFilter ?? userWhere) as any;

          const queryOptions: Record<string, unknown> = { ...options };
          if (combinedWhere) {
            queryOptions.where = combinedWhere;
          }
          delete queryOptions.cache; // cache is not a Drizzle option

          const result = await (db.query as any)[tableKey].findMany(queryOptions);
          return result;
        },
      };
    },

    findFirst(options?: FindFirstOptions): Operation<unknown | undefined> {
      const permissions: PermissionDescriptor[] = config.unsafe
        ? []
        : [{ action: "read" as const, table: config.table }];

      return {
        permissions,
        async run(_params: Record<string, unknown>): Promise<unknown | undefined> {
          if (!config.unsafe) {
            checkOperationPermissions(config.grants, permissions);
          }

          if (!tableKey) throw new Error("Table not found in schema");

          const permFilter = buildPermissionFilter(config, config.table);
          const userWhere = options?.where;
          const combinedWhere = permFilter && userWhere
            ? and(userWhere as any, permFilter as any)
            : (permFilter ?? userWhere) as any;

          const queryOptions: Record<string, unknown> = { ...options };
          if (combinedWhere) {
            queryOptions.where = combinedWhere;
          }
          delete queryOptions.cache;

          const result = await (db.query as any)[tableKey].findFirst(queryOptions);
          return result ?? undefined;
        },
      };
    },
  };
}
