import type { DrizzleTable } from "@cfast/permissions";
import { createQueryBuilder } from "./query-builder";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "./mutate-builder";
import { createCacheManager, type CacheManager } from "./cache";
import { deduplicateDescriptors } from "./utils";
import type { Db, DbConfig, Operation } from "./types";

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
    query(table: DrizzleTable) {
      return createQueryBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
      });
    },

    insert(table: DrizzleTable) {
      return createInsertBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      });
    },

    update(table: DrizzleTable) {
      return createUpdateBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      });
    },

    delete(table: DrizzleTable) {
      return createDeleteBuilder({
        d1: config.d1,
        schema: config.schema,
        grants: config.grants,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      });
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
