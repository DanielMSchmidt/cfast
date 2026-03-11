import type { DrizzleTable } from "@cfast/permissions";
import { createQueryBuilder } from "./query-builder";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "./mutate-builder";
import { createCacheManager, type CacheManager } from "./cache";
import { deduplicateDescriptors } from "./utils";
import type { Db, DbConfig, Operation } from "./types";

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
        async run(params: Record<string, unknown>) {
          const results: unknown[] = [];
          for (const op of operations) {
            results.push(await op.run(params));
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
