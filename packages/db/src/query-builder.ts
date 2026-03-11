import { drizzle } from "drizzle-orm/d1";
import type { Grant, DrizzleTable } from "@cfast/permissions";
import { checkOperationPermissions } from "./permissions";
import { buildPermissionFilter, combineWhere, makePermissions } from "./utils";
import type { User } from "./utils";
import type { Operation, FindManyOptions, FindFirstOptions } from "./types";

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

function buildQueryOperation<TResult>(
  config: QueryBuilderConfig,
  db: ReturnType<typeof drizzle>,
  tableKey: string,
  method: "findMany" | "findFirst",
  options?: FindManyOptions | FindFirstOptions,
): Operation<TResult> {
  const permissions = makePermissions(config.unsafe, "read", config.table);

  return {
    permissions,
    async run(_params: Record<string, unknown>): Promise<TResult> {
      if (!config.unsafe) {
        checkOperationPermissions(config.grants, permissions);
      }

      const permFilter = buildPermissionFilter(
        config.grants, "read", config.table, config.user, config.unsafe,
      );
      const userWhere = options?.where;
      const combinedWhere = combineWhere(userWhere, permFilter);

      const queryOptions: Record<string, unknown> = { ...options };
      if (combinedWhere) {
        queryOptions.where = combinedWhere;
      }
      delete queryOptions.cache;

      const result = await (db.query as any)[tableKey][method](queryOptions);
      return (method === "findFirst" ? result ?? undefined : result) as TResult;
    },
  };
}

export function createQueryBuilder(config: QueryBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const tableKey = getTableKey(config.schema, config.table);

  return {
    findMany(options?: FindManyOptions): Operation<unknown[]> {
      if (!tableKey) {
        return {
          permissions: makePermissions(config.unsafe, "read", config.table),
          async run(): Promise<unknown[]> { throw new Error("Table not found in schema"); },
        };
      }
      return buildQueryOperation<unknown[]>(config, db, tableKey, "findMany", options);
    },

    findFirst(options?: FindFirstOptions): Operation<unknown | undefined> {
      if (!tableKey) {
        return {
          permissions: makePermissions(config.unsafe, "read", config.table),
          async run(): Promise<unknown | undefined> { throw new Error("Table not found in schema"); },
        };
      }
      return buildQueryOperation<unknown | undefined>(config, db, tableKey, "findFirst", options);
    },
  };
}
