import type { PermissionDescriptor } from "@cfast/permissions";
import { deduplicateDescriptors } from "./utils";
import type { Db, Operation } from "./types";

/**
 * A function that executes a single sub-operation within a {@link compose} executor.
 *
 * Each `RunFn` corresponds to one of the operations passed to `compose()`,
 * preserving the same positional order.
 */
type RunFn = (params?: Record<string, unknown>) => Promise<unknown>;

/**
 * Merges multiple {@link Operation | Operations} into a single operation with combined,
 * deduplicated permissions and an executor function for controlling data flow.
 *
 * `compose()` itself does not check permissions -- it only merges them. Each sub-operation's
 * `.run()` still performs its own permission check when the executor calls it. This enables
 * data dependencies between operations (e.g., using an insert result's ID in an audit log).
 *
 * @typeParam TResult - The return type of the executor function.
 * @param operations - The operations to compose. Their permissions are merged and deduplicated.
 * @param executor - A function that receives a `run` function for each operation (in order).
 *   You control execution order, data flow between operations, and the return value.
 * @returns A single {@link Operation} with combined permissions.
 *
 * @example
 * ```ts
 * import { compose } from "@cfast/db";
 *
 * const publishWorkflow = compose(
 *   [updatePost, insertAuditLog],
 *   async (doUpdate, doAudit) => {
 *     const updated = await doUpdate({});
 *     await doAudit({});
 *     return { published: true };
 *   },
 * );
 *
 * // Inspect combined permissions
 * publishWorkflow.permissions;
 * // => [{ action: "update", table: "posts" }, { action: "create", table: "audit_logs" }]
 *
 * // Execute all sub-operations
 * await publishWorkflow.run({});
 * ```
 */
export function compose<TResult>(
  operations: Operation<unknown>[],
  executor: (...runs: RunFn[]) => TResult | Promise<TResult>,
): Operation<TResult> {
  const allPermissions = deduplicateDescriptors(
    operations.flatMap((op) => op.permissions),
  );

  return {
    permissions: allPermissions,
    async run(_params?: Record<string, unknown>): Promise<TResult> {
      const runs = operations.map((op) => op.run);
      return executor(...runs);
    },
  };
}

/**
 * Runs multiple {@link Operation | Operations} sequentially and returns their results as an array.
 *
 * This is a shorthand for the common `compose` pattern where operations are
 * simply awaited in order with no data dependencies between them:
 *
 * ```ts
 * // Before: verbose
 * compose([op1, op2], async (run1, run2) => {
 *   await run1({});
 *   await run2({});
 * });
 *
 * // After: concise
 * composeSequential([op1, op2]);
 * ```
 *
 * @param operations - The operations to run in order.
 * @returns A single {@link Operation} that runs all operations sequentially and returns their results.
 */
export function composeSequential(
  operations: Operation<unknown>[],
): Operation<unknown[]> {
  const allPermissions = deduplicateDescriptors(
    operations.flatMap((op) => op.permissions),
  );

  return {
    permissions: allPermissions,
    async run(): Promise<unknown[]> {
      const results: unknown[] = [];
      for (const op of operations) {
        results.push(await op.run({}));
      }
      return results;
    },
  };
}

/**
 * Creates a Proxy that returns more proxies for any property access. Used during
 * the dry-run permission discovery pass of {@link composeSequentialCallback} so that
 * `card.id`, `await op.run()`, and other accesses inside the callback don't crash.
 */
function createSentinel(): unknown {
  // The proxy target is a function so it can be called and `await`-ed safely.
  const target = function () {
    /* sentinel */
  };
  return new Proxy(target, {
    get(_t, prop) {
      // Make `await sentinel` resolve cleanly without recursing forever.
      if (prop === "then") return undefined;
      // Common toString/valueOf coercions used by template literals or comparisons.
      if (prop === Symbol.toPrimitive) return () => "[sentinel]";
      if (prop === "toString") return () => "[sentinel]";
      if (prop === "valueOf") return () => 0;
      // Reading any other property returns another sentinel, recursively.
      return createSentinel();
    },
    apply() {
      return createSentinel();
    },
  });
}

/**
 * Wraps an arbitrary builder/operation object so that:
 *
 * 1. Calling `.run()` records the operation's permissions in `perms` and resolves
 *    to a sentinel value (instead of actually executing).
 * 2. Calling any other method (e.g. `.values()`, `.where()`, `.returning()`)
 *    returns another wrapped object so the entire builder chain stays tracked.
 *
 * Used by {@link composeSequentialCallback} during its dry-run pass.
 */
function wrapForTracking<T extends object>(
  target: T,
  perms: PermissionDescriptor[],
): T {
  return new Proxy(target, {
    get(t, prop, receiver) {
      const orig = Reflect.get(t, prop, receiver);

      if (prop === "permissions") return orig;

      if (prop === "run" && typeof orig === "function") {
        return async () => {
          const opPerms = (t as { permissions?: PermissionDescriptor[] }).permissions;
          if (Array.isArray(opPerms)) {
            perms.push(...opPerms);
          }
          return createSentinel();
        };
      }

      if (typeof orig === "function") {
        return (...args: unknown[]) => {
          const result = (orig as (...args: unknown[]) => unknown).apply(t, args);
          if (result && typeof result === "object") {
            return wrapForTracking(result as object, perms);
          }
          return result;
        };
      }

      return orig;
    },
  }) as T;
}

/**
 * Creates a "tracking" Db whose builders record every operation's permissions
 * into the supplied array and whose `.run()` calls return sentinel values
 * instead of touching D1. Used to discover the full permission set of a
 * callback-style {@link composeSequentialCallback} before executing for real.
 */
function createTrackingDb(real: Db, perms: PermissionDescriptor[]): Db {
  return {
    query: (table) => wrapForTracking(real.query(table), perms),
    insert: (table) => wrapForTracking(real.insert(table), perms),
    update: (table) => wrapForTracking(real.update(table), perms),
    delete: (table) => wrapForTracking(real.delete(table), perms),
    unsafe: () => createTrackingDb(real.unsafe(), perms),
    batch: (operations) => {
      for (const op of operations) {
        perms.push(...op.permissions);
      }
      return {
        permissions: deduplicateDescriptors(operations.flatMap((op) => op.permissions)),
        async run() {
          return [createSentinel()];
        },
      };
    },
    cache: real.cache,
  };
}

/**
 * Sequential `compose` variant that accepts a callback for ad-hoc workflows where
 * later operations depend on the results of earlier ones (e.g. inserting a child
 * row that references the inserted parent's id).
 *
 * Permissions are still collected ahead-of-time: the callback is run twice. The
 * first pass uses a tracking proxy that records every operation's permission
 * descriptors and returns sentinel values from `.run()` (so `card.id` and similar
 * accesses don't crash). The second pass runs the callback against the real Db
 * to actually execute the queries.
 *
 * Because the callback runs twice, **it must be free of side effects outside of
 * `db.*` calls** (no `fetch`, no `console.log` you care about, no global state
 * mutation). All control flow that depends on db results should use the sentinel-
 * tolerant property accesses.
 *
 * The dry-run pass is asynchronous, so `op.permissions` is empty until the dry-run
 * resolves. Consumers that need to inspect permissions before calling `.run()` (e.g.
 * the `@cfast/actions` permission UI) should `await op.permissionsAsync()` instead.
 * Calling `op.run()` always awaits the dry-run internally, so permissions are
 * guaranteed to be populated by the time the real callback runs.
 *
 * @typeParam TResult - The return type of the callback.
 * @param db - The real Db that will execute the operations on the second pass.
 * @param callback - A function that receives a Db and returns a value.
 * @returns A single {@link Operation} whose `.permissions` is the union of every
 *   operation discovered during the dry-run pass and whose `.run()` re-executes
 *   the callback against the real Db. The returned object also exposes
 *   `permissionsAsync()` for guaranteed permission retrieval.
 *
 * @example
 * ```ts
 * import { composeSequentialCallback } from "@cfast/db";
 *
 * const op = composeSequentialCallback(db, async (tx) => {
 *   const card = await tx.insert(cards).values({ title: "New" }).returning().run();
 *   await tx.insert(activityLog).values({
 *     cardId: (card as { id: string }).id,
 *     action: "card_created",
 *   }).run();
 *   return card;
 * });
 *
 * await op.permissionsAsync();  // [{ create, cards }, { create, activityLog }]
 * await op.run();
 * ```
 */
export function composeSequentialCallback<TResult>(
  db: Db,
  callback: (db: Db) => Promise<TResult>,
): Operation<TResult> & { permissionsAsync: () => Promise<PermissionDescriptor[]> } {
  // Discover permissions ahead-of-time by running the callback against a
  // tracking db whose .run() returns sentinels. We swallow any errors from the
  // dry-run so they don't escape construction; the real run will surface them.
  const collected: PermissionDescriptor[] = [];
  const trackingDb = createTrackingDb(db, collected);

  const dryRunPromise = (async () => {
    try {
      await callback(trackingDb);
    } catch {
      // Swallow dry-run errors -- the real run will surface them.
    }
  })();

  // `permissions` is a live array that gets populated once the dry-run finishes.
  // It is empty before the first microtask flush. Consumers that need a strong
  // guarantee should `await op.permissionsAsync()`.
  const permissions: PermissionDescriptor[] = [];
  const populated = dryRunPromise.then(() => {
    for (const d of deduplicateDescriptors(collected)) {
      permissions.push(d);
    }
  });

  return {
    permissions,
    async permissionsAsync(): Promise<PermissionDescriptor[]> {
      await populated;
      return permissions;
    },
    async run(_params?: Record<string, unknown>): Promise<TResult> {
      // Ensure permissions are populated for any post-run inspection.
      await populated;
      return callback(db);
    },
  };
}
