import type { DrizzleTable } from "@cfast/permissions";
import { createQueryBuilder } from "./query-builder";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "./mutate-builder";
import { createCacheManager, type CacheManager } from "./cache";
import { deduplicateDescriptors } from "./utils";
import type {
  Db,
  DbConfig,
  Operation,
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder,
} from "./types";

/**
 * Creates a permission-aware database instance bound to the given user.
 *
 * Call this once per request, passing the authenticated user. The returned {@link Db} instance
 * applies permission checks and WHERE clause injection on every {@link Operation}.
 * Sharing a `Db` across requests would apply one user's permissions to another's queries.
 *
 * @param config - Database configuration including D1 binding, schema, grants, and user.
 * @returns A {@link Db} instance with query, insert, update, delete, unsafe, batch, and cache methods.
 *
 * @example
 * ```ts
 * import { createDb } from "@cfast/db";
 * import * as schema from "./schema";
 *
 * const db = createDb({
 *   d1: env.DB,
 *   schema,
 *   grants: resolvedGrants,
 *   user: currentUser,
 *   cache: { backend: "cache-api" },
 * });
 *
 * // All operations check permissions at .run() time
 * const posts = await db.query(postsTable).findMany().run({});
 * ```
 */
export function createDb(config: DbConfig): Db {
  return buildDb(config, false);
}

function buildDb(config: DbConfig, isUnsafe: boolean): Db {
  const cacheManager: CacheManager | null =
    config.cache === false
      ? null
      : createCacheManager(config.cache ?? { backend: "cache-api" });

  const onMutate = (tableName: string) => {
    cacheManager?.invalidateTable(tableName);
  };

  return {
    query<TTable extends DrizzleTable>(table: TTable): QueryBuilder<TTable> {
      // The runtime builder is row-type-erased; the generic on `query` exists
      // purely to propagate `InferRow<TTable>` to callers.
      return createQueryBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
      }) as unknown as QueryBuilder<TTable>;
    },

    insert<TTable extends DrizzleTable>(table: TTable): InsertBuilder<TTable> {
      return createInsertBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      }) as unknown as InsertBuilder<TTable>;
    },

    update<TTable extends DrizzleTable>(table: TTable): UpdateBuilder<TTable> {
      return createUpdateBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      }) as unknown as UpdateBuilder<TTable>;
    },

    delete<TTable extends DrizzleTable>(table: TTable): DeleteBuilder<TTable> {
      return createDeleteBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      }) as unknown as DeleteBuilder<TTable>;
    },

    unsafe() {
      return buildDb(config, true);
    },

    batch(operations: Operation<unknown>[]): Operation<unknown[]> {
      const allPermissions = deduplicateDescriptors(
        operations.flatMap((op) => op.permissions),
      );

      return {
        permissions: allPermissions,
        async run(params?: Record<string, unknown>) {
          const p = params ?? {};
          const results: unknown[] = [];
          for (const op of operations) {
            results.push(await op.run(p));
          }
          return results;
        },
      };
    },

    cache: {
      async invalidate(options: { tags?: string[]; tables?: string[] }) {
        if (!cacheManager) return;
        if (options.tags) {
          await cacheManager.invalidateTags(options.tags);
        }
        if (options.tables) {
          for (const table of options.tables) {
            cacheManager.invalidateTable(table);
          }
        }
      },
    },
  };
}
