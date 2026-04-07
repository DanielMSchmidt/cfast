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
 * `LookupFn` runs at most once). The map is owned by the per-request `Db`
 * instance, so its lifetime exactly matches the request that created the db.
 */
export type LookupCache = Map<Grant, Promise<Record<string, unknown>>>;

/**
 * Creates a fresh per-request lookup cache. One cache is owned by each
 * `Db` instance returned from `createDb()`.
 */
export function createLookupCache(): LookupCache {
  return new Map();
}

/**
 * Resolves the `with` lookup map for a single grant, caching the resulting
 * promise so each lookup function runs at most once per request.
 *
 * @param grant - The grant whose `with` map should be resolved.
 * @param user - The current user passed to each lookup.
 * @param lookupDb - An unsafe-mode db handle the lookups can read freely.
 * @param cache - The per-request lookup cache (from {@link createLookupCache}).
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
  const cached = cache.get(grant);
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

  cache.set(grant, promise);
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
