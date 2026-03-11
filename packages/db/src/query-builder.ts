import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Column, SQL } from "drizzle-orm";
import type { Grant, DrizzleTable } from "@cfast/permissions";
import { checkOperationPermissions } from "./permissions";
import { buildPermissionFilter, combineWhere, makePermissions } from "./utils";
import type { User } from "./utils";
import { decodeCursor, encodeCursor, buildCursorWhere } from "./paginate";
import type { Operation, FindManyOptions, FindFirstOptions, CursorPage, OffsetPage, PaginateOptions } from "./types";
import type { CursorParams, OffsetParams } from "./types";

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

    paginate(
      params: CursorParams | OffsetParams,
      options?: PaginateOptions,
    ): Operation<CursorPage<unknown>> | Operation<OffsetPage<unknown>> {
      const permissions = makePermissions(config.unsafe, "read", config.table);

      function ensureTableKey(): string {
        if (!tableKey) throw new Error("Table not found in schema");
        return tableKey;
      }

      function checkAndBuildWhere(extraWhere?: unknown) {
        if (!config.unsafe) {
          checkOperationPermissions(config.grants, permissions);
        }
        const permFilter = buildPermissionFilter(
          config.grants, "read", config.table, config.user, config.unsafe,
        );
        return combineWhere(combineWhere(options?.where, permFilter), extraWhere);
      }

      function buildBaseQueryOptions(where: unknown) {
        const qo: Record<string, unknown> = {};
        if (options?.columns) qo.columns = options.columns;
        if (options?.orderBy) qo.orderBy = options.orderBy;
        if (options?.with) qo.with = options.with;
        if (where) qo.where = where;
        return qo;
      }

      if (params.type === "cursor") {
        const cursorColumns = (options?.cursorColumns ?? []) as Column[];
        return {
          permissions,
          async run(_params: Record<string, unknown>): Promise<CursorPage<unknown>> {
            const key = ensureTableKey();
            const cursorValues = decodeCursor(params.cursor);
            const direction = options?.orderDirection ?? "desc";
            const cursorWhere = cursorValues
              ? buildCursorWhere(cursorColumns, cursorValues, direction)
              : undefined;

            const combinedWhere = checkAndBuildWhere(cursorWhere);
            const queryOptions = buildBaseQueryOptions(combinedWhere);
            queryOptions.limit = params.limit + 1;

            const rows = await (db.query as any)[key].findMany(queryOptions) as unknown[];
            const hasMore = rows.length > params.limit;
            const items = hasMore ? rows.slice(0, params.limit) : rows;

            let nextCursor: string | null = null;
            if (hasMore && items.length > 0) {
              const lastItem = items[items.length - 1] as Record<string, unknown>;
              const values = cursorColumns.map((col) => {
                const colName = (col as any).name as string;
                return lastItem[colName];
              });
              nextCursor = encodeCursor(values);
            }

            return { items, nextCursor };
          },
        };
      }

      // Offset pagination
      return {
        permissions,
        async run(_params: Record<string, unknown>): Promise<OffsetPage<unknown>> {
          const key = ensureTableKey();
          const combinedWhere = checkAndBuildWhere();
          const queryOptions = buildBaseQueryOptions(combinedWhere);
          queryOptions.limit = params.limit;
          queryOptions.offset = (params.page - 1) * params.limit;

          const countQuery = db
            .select({ count: count() })
            .from(config.table as any)
            .$dynamic();
          if (combinedWhere) countQuery.where(combinedWhere as SQL);

          const [items, countResult] = await Promise.all([
            (db.query as any)[key].findMany(queryOptions) as Promise<unknown[]>,
            countQuery,
          ]);

          const total = countResult[0]?.count ?? 0;
          return {
            items,
            total,
            page: params.page,
            totalPages: Math.ceil(total / params.limit),
          };
        },
      };
    },
  };
}
