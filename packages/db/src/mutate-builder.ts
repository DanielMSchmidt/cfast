import { drizzle } from "drizzle-orm/d1";
import type { SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import { checkOperationPermissions } from "./permissions";
import { buildPermissionFilter, combineWhere, makePermissions, getTableName } from "./utils";
import type { User } from "./utils";
import type { Operation } from "./types";
import { BATCHABLE, type BatchableMeta } from "./batchable";

type MutateBuilderConfig = {
  d1: D1Database;
  schema: Record<string, unknown>;
  grants: Grant[];
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
  onMutate?: (tableName: string) => void;
};

function checkIfNeeded(config: MutateBuilderConfig, grants: Grant[], permissions: PermissionDescriptor[]): void {
  if (!config.unsafe) {
    checkOperationPermissions(grants, permissions);
  }
}

/**
 * A function that builds the underlying Drizzle query for a mutation operation
 * without executing it. Used both by the standard `.run()` path and by
 * {@link Db.batch} when packing operations into D1's native atomic batch.
 *
 * The `returning` flag toggles whether the built query has `.returning()`
 * appended (for `.returning().run()` paths).
 */
type DrizzleDb = ReturnType<typeof drizzle>;
type BuildQueryFn = (
  drizzleDb: DrizzleDb,
  returning: boolean,
) => {
  // The Drizzle query, sufficient to be passed to `db.batch([...])`.
  query: import("drizzle-orm/batch").BatchItem<"sqlite">;
  // For the non-batch path: how to read the value back from the query.
  // `void` execution uses `.run()`; returning execution uses `.get()`.
  execute: (returning: boolean) => Promise<unknown>;
};

function buildMutationWithReturning(
  config: MutateBuilderConfig,
  permissions: PermissionDescriptor[],
  tableName: string,
  buildQuery: BuildQueryFn,
): Operation<void> & { returning: () => Operation<unknown> } {
  // Construct the per-builder Drizzle instance once so .run() and the BATCHABLE
  // hook share state (cached prepared statements, etc.).
  const drizzleDb = drizzle(config.d1, { schema: config.schema });

  const runOnce = async (returning: boolean): Promise<unknown> => {
    checkIfNeeded(config, config.grants, permissions);
    const built = buildQuery(drizzleDb, returning);
    const result = await built.execute(returning);
    config.onMutate?.(tableName);
    return result;
  };

  const baseOp: Operation<void> & {
    returning: () => Operation<unknown>;
    [BATCHABLE]?: BatchableMeta;
  } = {
    permissions,
    async run(_params?: Record<string, unknown>): Promise<void> {
      await runOnce(false);
    },
    returning() {
      const returningOp: Operation<unknown> & { [BATCHABLE]?: BatchableMeta } = {
        permissions,
        async run(_params?: Record<string, unknown>): Promise<unknown> {
          return runOnce(true);
        },
      };
      // The returning() variant carries the same query (with `.returning()`
      // appended) so it can also participate in native batches.
      returningOp[BATCHABLE] = {
        build: (sharedDb) => buildQuery(sharedDb, true).query,
        tableName,
        withResult: true,
      };
      return returningOp;
    },
  };

  baseOp[BATCHABLE] = {
    build: (sharedDb) => buildQuery(sharedDb, false).query,
    tableName,
    withResult: false,
  };

  return baseOp;
}

/**
 * Creates an insert builder that produces permission-aware insert operations for a table.
 *
 * Insert permissions are checked at the role level only (no row-level WHERE injection).
 * After a successful insert, the table's cache version is bumped via `onMutate`.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, unsafe flag, and mutation callback.
 * @returns An insert builder with a `values()` method.
 */
export function createInsertBuilder(config: MutateBuilderConfig) {
  const permissions = makePermissions(config.unsafe, "create", config.table);
  const tableName = getTableName(config.table);

  return {
    values(values: Record<string, unknown>) {
      const buildQuery: BuildQueryFn = (sharedDb, returning) => {
        const base = sharedDb.insert(config.table as SQLiteTable).values(values);
        const query = returning ? base.returning() : base;
        return {
          query: query as import("drizzle-orm/batch").BatchItem<"sqlite">,
          execute: async (wantsResult) => {
            if (wantsResult) {
              return (query as ReturnType<typeof base.returning>).get();
            }
            await base.run();
          },
        };
      };
      return buildMutationWithReturning(config, permissions, tableName, buildQuery);
    },
  };
}

/**
 * Creates an update builder that produces permission-aware update operations for a table.
 *
 * Row-level permission WHERE clauses are AND'd with the user-supplied WHERE condition.
 * After a successful update, the table's cache version is bumped via `onMutate`.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, unsafe flag, and mutation callback.
 * @returns An update builder with a `set()` method that chains to `where()`.
 */
export function createUpdateBuilder(config: MutateBuilderConfig) {
  const permissions = makePermissions(config.unsafe, "update", config.table);
  const tableName = getTableName(config.table);

  return {
    set(values: Record<string, unknown>) {
      return {
        where(condition: unknown) {
          const permFilter = buildPermissionFilter(
            config.grants, "update", config.table, config.user, config.unsafe,
          );
          const combinedWhere = combineWhere(condition as SQL | undefined, permFilter);

          const buildQuery: BuildQueryFn = (sharedDb, returning) => {
            const base = sharedDb.update(config.table as SQLiteTable).set(values);
            if (combinedWhere) base.where(combinedWhere);
            const query = returning ? base.returning() : base;
            return {
              query: query as import("drizzle-orm/batch").BatchItem<"sqlite">,
              execute: async (wantsResult) => {
                if (wantsResult) {
                  return (query as ReturnType<typeof base.returning>).get();
                }
                await base.run();
              },
            };
          };
          return buildMutationWithReturning(config, permissions, tableName, buildQuery);
        },
      };
    },
  };
}

/**
 * Creates a delete builder that produces permission-aware delete operations for a table.
 *
 * Row-level permission WHERE clauses are AND'd with the user-supplied WHERE condition.
 * After a successful delete, the table's cache version is bumped via `onMutate`.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, unsafe flag, and mutation callback.
 * @returns A delete builder with a `where()` method.
 */
export function createDeleteBuilder(config: MutateBuilderConfig) {
  const permissions = makePermissions(config.unsafe, "delete", config.table);
  const tableName = getTableName(config.table);

  return {
    where(condition: unknown) {
      const permFilter = buildPermissionFilter(
        config.grants, "delete", config.table, config.user, config.unsafe,
      );
      const combinedWhere = combineWhere(condition as SQL | undefined, permFilter);

      const buildQuery: BuildQueryFn = (sharedDb, returning) => {
        const base = sharedDb.delete(config.table as SQLiteTable);
        if (combinedWhere) base.where(combinedWhere);
        const query = returning ? base.returning() : base;
        return {
          query: query as import("drizzle-orm/batch").BatchItem<"sqlite">,
          execute: async (wantsResult) => {
            if (wantsResult) {
              return (query as ReturnType<typeof base.returning>).get();
            }
            await base.run();
          },
        };
      };
      return buildMutationWithReturning(config, permissions, tableName, buildQuery);
    },
  };
}
