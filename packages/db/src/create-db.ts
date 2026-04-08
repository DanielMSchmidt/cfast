import { drizzle } from "drizzle-orm/d1";
import type { BatchItem } from "drizzle-orm/batch";
import type { DrizzleTable, LookupDb } from "@cfast/permissions";
import { createQueryBuilder } from "./query-builder";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "./mutate-builder";
import { createCacheManager, type CacheManager } from "./cache";
import { createLookupCache, deduplicateDescriptors, type LookupCache } from "./utils";
import { checkOperationPermissions } from "./permissions";
import { getBatchable } from "./batchable";
import { runTransaction } from "./transaction";
import type {
  Db,
  DbConfig,
  Operation,
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder,
  Tx,
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
  // Each `createDb()` call (typically per request) gets its own lookup cache.
  // The cache is shared between the safe Db and its unsafe sibling so a
  // grant's `with` lookups still hit the cache when the safe Db delegates the
  // lookup queries to the unsafe sibling.
  const lookupCache = createLookupCache();
  return buildDb(config, false, lookupCache);
}

function buildDb(
  config: DbConfig,
  isUnsafe: boolean,
  lookupCache: LookupCache,
): Db {
  const cacheManager: CacheManager | null =
    config.cache === false
      ? null
      : createCacheManager(config.cache ?? { backend: "cache-api" });

  const onMutate = (tableName: string) => {
    cacheManager?.invalidateTable(tableName);
  };

  // Lazily build the unsafe sibling — used as the LookupDb passed to grant
  // `with` lookups. We only need it when at least one grant declares a `with`
  // map, and constructing it eagerly would needlessly recurse for every Db
  // instance even when no cross-table grants exist.
  let lookupDbCache: LookupDb | null = null;
  const getLookupDb = (): LookupDb => {
    if (lookupDbCache) return lookupDbCache;
    // The unsafe sibling shares the same lookup cache so a lookup that runs
    // through the unsafe handle still benefits from per-request memoization
    // (and never accidentally diverges from the safe Db's cache state).
    lookupDbCache = isUnsafe
      ? (db as unknown as LookupDb)
      : (buildDb(config, true, lookupCache) as unknown as LookupDb);
    return lookupDbCache;
  };

  const db: Db = {
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
        lookupCache,
        getLookupDb,
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
        lookupCache,
        getLookupDb,
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
        lookupCache,
        getLookupDb,
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
        lookupCache,
        getLookupDb,
      }) as unknown as DeleteBuilder<TTable>;
    },

    unsafe() {
      // Reuse the same per-request lookup cache so safe + unsafe siblings
      // never duplicate the same lookup work.
      return buildDb(config, true, lookupCache);
    },

    batch(operations: Operation<unknown>[]): Operation<unknown[]> {
      const allPermissions = deduplicateDescriptors(
        operations.flatMap((op) => op.permissions),
      );

      return {
        permissions: allPermissions,
        async run(params?: Record<string, unknown>) {
          const p = params ?? {};

          // Up-front permission check across every sub-operation. We refuse to
          // run any of the SQL if the user can't perform every action in the
          // batch -- this matches the user-visible "atomic" semantic.
          if (!isUnsafe) {
            checkOperationPermissions(config.grants, allPermissions);
          }

          // Try to pack everything into D1's native atomic batch via Drizzle.
          // Every op produced by db.insert/update/delete is "batchable"; only
          // arbitrary user-supplied operations (e.g. from compose() executors)
          // fall through to the sequential path.
          const batchables = operations.map((op) => getBatchable(op));
          const everyOpBatchable =
            operations.length > 0 && batchables.every((b) => b !== undefined);

          if (everyOpBatchable) {
            const sharedDb = drizzle(config.d1, { schema: config.schema });
            // Resolve any async preparation work (e.g. permission `with`
            // lookups for update/delete) before invoking the synchronous
            // `build()` step. We can't make `build()` itself async because
            // Drizzle queries are thenables and would self-execute when
            // awaited.
            await Promise.all(
              batchables.map((b) => b!.prepare?.() ?? Promise.resolve()),
            );
            const items = batchables.map((b) => b!.build(sharedDb));
            // Drizzle's `db.batch()` requires a non-empty tuple type, so we
            // cast at the boundary -- the array is guaranteed non-empty here.
            const batchResults = (await sharedDb.batch(
              items as unknown as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]],
            )) as unknown[];

            // Bump cache versions for every mutated table now that the batch
            // has committed atomically.
            const tables = new Set<string>();
            for (const b of batchables) {
              tables.add(b!.tableName);
            }
            for (const t of tables) {
              cacheManager?.invalidateTable(t);
            }

            // Surface results in the same order as the input operations.
            return batchables.map((b, i) => (b!.withResult ? batchResults[i] : undefined));
          }

          // Fallback: sequential execution. Used when at least one operation
          // is not directly batchable (e.g. ops produced by compose()).
          const results: unknown[] = [];
          for (const op of operations) {
            results.push(await op.run(p));
          }
          return results;
        },
      };
    },

    transaction<T>(callback: (tx: Tx) => Promise<T>): Promise<T> {
      return runTransaction(db, callback);
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
  return db;
}
