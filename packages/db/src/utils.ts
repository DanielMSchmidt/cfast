// `node:async_hooks` is provided by the Workers runtime under the
// `nodejs_compat` flag and by Node.js natively. We avoid depending on
// `@types/node` here (which would drag Node's full global shape into a
// Workers-targeted package) and instead declare the narrow symbol we need.
// @ts-expect-error -- `node:async_hooks` has no types without @types/node,
//  but the runtime is guaranteed under the nodejs_compat flag.
import { AsyncLocalStorage as AsyncLocalStorageImpl } from "node:async_hooks";
type AsyncLocalStorageCtor = new <T>() => {
  getStore(): T | undefined;
  run<R>(store: T, fn: () => R): R;
};
const AsyncLocalStorage: AsyncLocalStorageCtor = AsyncLocalStorageImpl as unknown as AsyncLocalStorageCtor;
import { and, or } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import type {
  DrizzleTable,
  Grant,
  LookupDb,
  PermissionAction,
  PermissionDescriptor,
} from "@cfast/permissions";
import { getTableName } from "@cfast/permissions";
import { resolvePermissionFilters } from "./permissions";

export type User = { id: string };

export { getTableName };

export function deduplicateDescriptors(
  descriptors: PermissionDescriptor[],
): PermissionDescriptor[] {
  const seen = new Set<string>();
  const result: PermissionDescriptor[] = [];
  for (const d of descriptors) {
    const key = `${d.action}:${getTableName(d.table as DrizzleTable)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d);
    }
  }
  return result;
}

/**
 * Per-request cache that holds the resolved `with` lookup map for each grant.
 *
 * Keyed by grant object identity so two queries that consult the same grant
 * within a single request reuse the same lookup promise (each underlying
 * `LookupFn` runs at most once).
 *
 * The cache's lifetime is tied to the surrounding async context rather than
 * to any specific `Db` instance: `createDb()` calls transparently run inside
 * an {@link AsyncLocalStorage} scope, and nested operations resolve their
 * lookups through the active scope's cache. Tests (or anything sharing a
 * single `Db` across logical requests) can scope an explicit cache via
 * {@link runWithLookupCache}.
 */
export type LookupCache = Map<Grant, Promise<Record<string, unknown>>>;

/**
 * AsyncLocalStorage that holds the active per-request lookup cache.
 *
 * The store is populated by:
 *
 * 1. `createDb()` — every public `Db` method runs its async work inside a
 *    fresh cache scope if no outer scope already exists. This makes the
 *    default "one Db per request" flow automatically request-scoped.
 * 2. Explicit {@link runWithLookupCache} calls — for tests or consumers that
 *    want to share the same `Db` across multiple logical requests.
 *
 * The store is `undefined` outside any scope; callers that need a cache in
 * that case should create an ephemeral one and pass it explicitly.
 */
export const lookupCacheStorage = new AsyncLocalStorage<LookupCache>();

/**
 * Creates a fresh per-request lookup cache. Exposed for tests and for the
 * `Db` wrapper that establishes the ALS scope; normal framework consumers
 * should rely on {@link runWithLookupCache} or the automatic scope that
 * `createDb()` sets up on every invocation.
 */
export function createLookupCache(): LookupCache {
  return new Map();
}

/**
 * Runs `fn` inside a fresh per-request lookup cache scope.
 *
 * Use this when you need to reuse a single `Db` across multiple logical
 * requests (e.g. in tests that insert new grants mid-run) and want each
 * logical request to see a clean cache. All nested `Db` operations inside
 * `fn` (and any async work they start) share the same cache.
 *
 * @param fn - The callback to run inside the scope. Its return value is
 *   forwarded back to the caller.
 * @param cache - Optional pre-existing cache to install. Defaults to a fresh
 *   empty cache.
 *
 * @example
 * ```ts
 * // Test setup reusing a single Db:
 * const db = createDb({ ... });
 *
 * await runWithLookupCache(async () => {
 *   await db.insert(friendGrants).values(...).run();
 *   await db.query(posts).findMany().run(); // sees the new grant
 * });
 * ```
 */
export function runWithLookupCache<T>(
  fn: () => T,
  cache: LookupCache = createLookupCache(),
): T {
  return lookupCacheStorage.run(cache, fn);
}

/**
 * Returns the active ALS cache if one exists, otherwise falls back to the
 * provided cache. Used by the builders to honor a caller-established scope
 * without giving up on the legacy "Db owns a cache" fallback path.
 */
export function getActiveLookupCache(fallback: LookupCache): LookupCache {
  return lookupCacheStorage.getStore() ?? fallback;
}

/**
 * Resolves the `with` lookup map for a single grant, caching the resulting
 * promise so each lookup function runs at most once per request.
 *
 * The cache is resolved via {@link getActiveLookupCache}: if an ALS scope is
 * active (established by `createDb()` or {@link runWithLookupCache}) that
 * cache wins, otherwise the caller-supplied fallback is used. This keeps the
 * cache lifetime tied to the logical request rather than a specific `Db`
 * instance, so a `Db` that is reused across request-like boundaries still
 * sees fresh lookup results when each boundary is wrapped in its own scope.
 *
 * @param grant - The grant whose `with` map should be resolved.
 * @param user - The current user passed to each lookup.
 * @param lookupDb - An unsafe-mode db handle the lookups can read freely.
 * @param cache - Fallback per-request lookup cache used when no ALS scope
 *   is active (e.g. legacy callers or explicit test setups).
 * @returns A record mapping each lookup name to its resolved value, or an
 *   empty object when the grant declares no `with` map.
 */
export async function resolveGrantLookups(
  grant: Grant,
  user: unknown,
  lookupDb: LookupDb,
  cache: LookupCache,
): Promise<Record<string, unknown>> {
  if (!grant.with) return {};
  const activeCache = getActiveLookupCache(cache);
  const cached = activeCache.get(grant);
  if (cached) return cached;

  const entries = Object.entries(grant.with);
  const promise = (async () => {
    const resolved: Record<string, unknown> = {};
    // Resolve every lookup in parallel — they're independent reads against the
    // same unsafe db handle, so concurrency is safe and saves round trips.
    await Promise.all(
      entries.map(async ([key, fn]) => {
        resolved[key] = await fn(user, lookupDb);
      }),
    );
    return resolved;
  })();

  activeCache.set(grant, promise);
  return promise;
}

/**
 * Builds the OR-combined permission filter SQL for an (action, table) pair,
 * resolving any prerequisite `with` lookups attached to the matching grants.
 *
 * Returns `undefined` when permissions are unrestricted (or when in unsafe
 * mode), so callers can skip the AND-combine step entirely. The function is
 * async because lookup functions are async; results are cached on `cache` so
 * a second invocation for the same grant within a request is essentially free.
 *
 * `getLookupDb` is invoked **lazily** — only if at least one matching grant
 * declares a `with` map. Plain grants pay no cost for the cross-table lookup
 * machinery.
 */
export async function buildPermissionFilter(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
  user: User | null,
  unsafe: boolean,
  getLookupDb: () => LookupDb,
  cache: LookupCache,
): Promise<SQL | undefined> {
  if (unsafe || !user) return undefined;
  const matching = resolvePermissionFilters(grants, action, table);
  if (matching.length === 0) return undefined;
  const columns = table as Record<string, unknown>;

  // Resolve `with` lookups for every matching grant. Plain grants resolve to
  // `{}` instantly via the fast path in {@link resolveGrantLookups}, so the
  // only network cost (and the only `getLookupDb()` call) comes from grants
  // that genuinely need cross-table data.
  const needsLookupDb = matching.some((g) => g.with !== undefined);
  const lookupDb = needsLookupDb ? getLookupDb() : (undefined as unknown as LookupDb);
  const lookupSets = await Promise.all(
    matching.map((g) => resolveGrantLookups(g, user, lookupDb, cache)),
  );

  // Permission filter fns return DrizzleSQL (structurally { getSQL(): unknown }),
  // which at runtime are Drizzle SQL expressions compatible with SQLWrapper.
  const clauses = matching.map(
    (g, i) =>
      g.where!(columns, user, lookupSets[i]) as SQLWrapper | undefined,
  );
  return or(...clauses);
}

export function combineWhere(
  userCondition: SQL | SQLWrapper | undefined,
  permFilter: SQL | SQLWrapper | undefined,
): SQL | undefined {
  if (permFilter && userCondition) return and(userCondition, permFilter);
  if (permFilter) return permFilter.getSQL();
  if (userCondition) return userCondition.getSQL();
  return undefined;
}

export function makePermissions(
  unsafe: boolean,
  action: PermissionAction,
  table: DrizzleTable,
): PermissionDescriptor[] {
  return unsafe ? [] : [{ action, table }];
}
