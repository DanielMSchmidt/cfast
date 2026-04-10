import { count, sql, or as drizzleOr } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Column, SQL, SQLWrapper } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Grant, DrizzleTable, LookupDb } from "@cfast/permissions";
import { getGrantedActions } from "@cfast/permissions";
import type { GrantedAction } from "@cfast/permissions";
import { checkOperationPermissions } from "./permissions";
import { buildPermissionFilter, combineWhere, makePermissions, resolveGrantLookups } from "./utils";
import type { LookupCache, User } from "./utils";
import { decodeCursor, encodeCursor, buildCursorWhere, getPrimaryKeyColumns } from "./paginate";
import type { Operation, FindManyOptions, FindFirstOptions, CursorPage, OffsetPage, PaginateOptions } from "./types";
import type { CursorParams, OffsetParams } from "./types";

type QueryBuilderConfig = {
  d1: D1Database;
  schema: Record<string, unknown>;
  grants: Grant[];
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
  /** Per-request cache for grant `with` lookup results. */
  lookupCache: LookupCache;
  /** Lazily resolved unsafe sibling Db used as the LookupDb for `with` lookups. */
  getLookupDb: () => LookupDb;
};

/**
 * Minimal shape of a Drizzle relational query builder.
 * Matches the `findMany` and `findFirst` methods we use from `db.query[tableName]`.
 */
type DrizzleRelationalQueryBuilder = {
  findMany(config?: Record<string, unknown>): Promise<unknown[]>;
  findFirst(config?: Record<string, unknown>): Promise<unknown>;
};

/**
 * The `db.query` record after schema registration. Drizzle types this as a mapped type
 * over the schema generic, but since we pass `Record<string, unknown>` we access via
 * a typed record at this single boundary point.
 */
type DrizzleQueryMap = Record<string, DrizzleRelationalQueryBuilder>;

function getTableKey(schema: Record<string, unknown>, table: DrizzleTable): string | undefined {
  for (const [key, val] of Object.entries(schema)) {
    if (val === table) return key;
  }
  return undefined;
}

/**
 * Returns the relational query builder for a table key from a Drizzle db instance.
 * Centralizes the single cast needed to access `db.query[key]` with a dynamic key.
 */
function getQueryTable(
  db: ReturnType<typeof drizzle>,
  key: string,
): DrizzleRelationalQueryBuilder {
  return (db.query as DrizzleQueryMap)[key];
}

/** Prefix used for _can computed SQL column aliases. */
const CAN_PREFIX = "_can_";

/**
 * Builds the `extras` record for `_can` annotations.
 *
 * For each granted action:
 * - The queried action (e.g. "read") -> literal `1` (WHERE already filters)
 * - Unrestricted grants -> literal `1`
 * - Restricted grants -> `CASE WHEN <where1 OR where2> THEN 1 ELSE 0 END`
 */
async function buildCanExtras(
  config: QueryBuilderConfig,
  grantedActions: GrantedAction[],
  queriedAction: string,
): Promise<Record<string, unknown>> {
  const extras: Record<string, unknown> = {};

  for (const ga of grantedActions) {
    const alias = `${CAN_PREFIX}${ga.action}`;

    // The queried action already has its WHERE filter applied, so every
    // returned row satisfies it. Use literal true.
    if (ga.action === queriedAction) {
      extras[alias] = sql<number>`1`.as(alias);
      continue;
    }

    if (ga.unrestricted) {
      extras[alias] = sql<number>`1`.as(alias);
      continue;
    }

    // Restricted: resolve lookups and build CASE WHEN from the where clauses.
    const needsLookupDb = ga.grants.some((g) => g.with !== undefined);
    const lookupDb = needsLookupDb
      ? config.getLookupDb()
      : (undefined as unknown as LookupDb);

    const lookupSets = await Promise.all(
      ga.grants.map((g) => resolveGrantLookups(g, config.user, lookupDb, config.lookupCache)),
    );

    const columns = config.table as Record<string, unknown>;
    const clauses = ga.grants
      .map((g, i) =>
        g.where ? (g.where(columns, config.user, lookupSets[i]) as SQLWrapper | undefined) : undefined,
      )
      .filter((c): c is SQLWrapper => c !== undefined);

    if (clauses.length === 0) {
      extras[alias] = sql<number>`1`.as(alias);
      continue;
    }

    const combined = clauses.length === 1
      ? clauses[0]
      : drizzleOr(...clauses)!;
    extras[alias] = sql<number>`CASE WHEN ${combined} THEN 1 ELSE 0 END`.as(alias);
  }

  return extras;
}

/**
 * Collects `_can_*` columns from a row into a `_can: Record<string, boolean>`
 * object, adding `false` for any CRUD action not in the granted set.
 */
function attachCan(
  row: Record<string, unknown>,
  grantedActions: GrantedAction[],
): Record<string, unknown> {
  const can: Record<string, boolean> = {};
  const grantedSet = new Set(grantedActions.map((ga) => ga.action));
  const allActions = ["read", "create", "update", "delete"] as const;

  for (const action of allActions) {
    const key = `${CAN_PREFIX}${action}`;
    if (key in row) {
      can[action] = row[key] === 1 || row[key] === true;
      delete row[key];
    } else if (!grantedSet.has(action)) {
      can[action] = false;
    }
  }

  row._can = can;
  return row;
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
    async run(_params?: Record<string, unknown>): Promise<TResult> {
      if (!config.unsafe) {
        checkOperationPermissions(config.grants, permissions);
      }

      const permFilter = await buildPermissionFilter(
        config.grants,
        "read",
        config.table,
        config.user,
        config.unsafe,
        config.getLookupDb,
        config.lookupCache,
      );
      const userWhere = options?.where as SQL | undefined;
      const combinedWhere = combineWhere(userWhere, permFilter);

      const queryOptions: Record<string, unknown> = { ...options };
      if (combinedWhere) {
        queryOptions.where = combinedWhere;
      }
      delete queryOptions.cache;

      // Build _can annotation extras (skip in unsafe mode or when no user).
      const grantedActions = (!config.unsafe && config.user)
        ? getGrantedActions(config.grants, config.table)
        : [];
      if (grantedActions.length > 0) {
        const canExtras = await buildCanExtras(config, grantedActions, "read");
        const userExtras = queryOptions.extras as Record<string, unknown> | undefined;
        queryOptions.extras = userExtras
          ? { ...userExtras, ...canExtras }
          : canExtras;
      }

      const queryTable = getQueryTable(db, tableKey);
      const result = await queryTable[method](queryOptions);

      // Post-process: collect _can_* keys into a _can object.
      if (grantedActions.length > 0) {
        if (method === "findFirst" && result != null) {
          attachCan(result as Record<string, unknown>, grantedActions);
        } else if (method === "findMany" && Array.isArray(result)) {
          for (const row of result) {
            attachCan(row as Record<string, unknown>, grantedActions);
          }
        }
      } else if (!config.unsafe && config.user) {
        // No granted actions at all -- add empty _can with all false.
        const emptyCan = { read: false, create: false, update: false, delete: false };
        if (method === "findFirst" && result != null) {
          (result as Record<string, unknown>)._can = { ...emptyCan };
        } else if (method === "findMany" && Array.isArray(result)) {
          for (const row of result) {
            (row as Record<string, unknown>)._can = { ...emptyCan };
          }
        }
      }

      return (method === "findFirst" ? result ?? undefined : result) as TResult;
    },
  };
}

/**
 * Creates a query builder that produces permission-aware read operations for a table.
 *
 * The builder provides `findMany`, `findFirst`, and `paginate` methods, each returning
 * an `Operation` that applies permission filters at `.run()` time.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, and unsafe flag.
 * @returns A query builder with `findMany`, `findFirst`, and `paginate` methods.
 */
export function createQueryBuilder(config: QueryBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
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

      async function checkAndBuildWhere(extraWhere?: SQL | undefined) {
        if (!config.unsafe) {
          checkOperationPermissions(config.grants, permissions);
        }
        const permFilter = await buildPermissionFilter(
          config.grants,
          "read",
          config.table,
          config.user,
          config.unsafe,
          config.getLookupDb,
          config.lookupCache,
        );
        return combineWhere(
          combineWhere(options?.where as SQL | undefined, permFilter),
          extraWhere,
        );
      }

      function buildBaseQueryOptions(where: SQL | undefined) {
        const qo: Record<string, unknown> = {};
        if (options?.columns) qo.columns = options.columns;
        if (options?.orderBy) qo.orderBy = options.orderBy;
        if (options?.with) qo.with = options.with;
        if (where) qo.where = where;
        return qo;
      }

      if (params.type === "cursor") {
        // Default cursor columns to the table's primary key when not specified.
        // This makes cursor-based pagination work out of the box for the
        // common case (single-column primary key) without requiring callers
        // to repeat the column reference at every call site.
        const explicitCursorColumns = options?.cursorColumns as Column[] | undefined;
        const cursorColumns: Column[] =
          explicitCursorColumns && explicitCursorColumns.length > 0
            ? explicitCursorColumns
            : getPrimaryKeyColumns(config.table as SQLiteTable);

        if (cursorColumns.length === 0) {
          throw new Error(
            "paginate(): cursor pagination requires either explicit `cursorColumns` " +
              "or a table with a primary key. Pass `cursorColumns` in the paginate options.",
          );
        }

        return {
          permissions,
          async run(_params?: Record<string, unknown>): Promise<CursorPage<unknown>> {
            const key = ensureTableKey();
            const cursorValues = decodeCursor(params.cursor);
            const direction = options?.orderDirection ?? "desc";
            const cursorWhere = cursorValues
              ? buildCursorWhere(cursorColumns, cursorValues, direction)
              : undefined;

            const combinedWhere = await checkAndBuildWhere(cursorWhere);
            const queryOptions = buildBaseQueryOptions(combinedWhere);
            queryOptions.limit = params.limit + 1;

            const queryTable = getQueryTable(db, key);
            const rows = await queryTable.findMany(queryOptions) as unknown[];
            const hasMore = rows.length > params.limit;
            const items = hasMore ? rows.slice(0, params.limit) : rows;

            let nextCursor: string | null = null;
            if (hasMore && items.length > 0) {
              const lastItem = items[items.length - 1] as Record<string, unknown>;
              const values = cursorColumns.map((col) => lastItem[col.name]);
              nextCursor = encodeCursor(values);
            }

            return { items, nextCursor };
          },
        };
      }

      // Offset pagination
      return {
        permissions,
        async run(_params?: Record<string, unknown>): Promise<OffsetPage<unknown>> {
          const key = ensureTableKey();
          const combinedWhere = await checkAndBuildWhere();
          const queryOptions = buildBaseQueryOptions(combinedWhere);
          queryOptions.limit = params.limit;
          queryOptions.offset = (params.page - 1) * params.limit;

          const countQuery = db
            .select({ count: count() })
            .from(config.table as SQLiteTable)
            .$dynamic();
          if (combinedWhere) countQuery.where(combinedWhere);

          const queryTable = getQueryTable(db, key);
          const [items, countResult] = await Promise.all([
            queryTable.findMany(queryOptions) as Promise<unknown[]>,
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
