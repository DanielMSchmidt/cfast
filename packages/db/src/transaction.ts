import type { DrizzleTable } from "@cfast/permissions";
import { getBatchable } from "./batchable";
import type {
  Db,
  InsertBuilder,
  InsertReturningBuilder,
  Operation,
  QueryBuilder,
  Tx,
  UpdateBuilder,
  UpdateWhereBuilder,
  UpdateReturningBuilder,
  DeleteBuilder,
  DeleteReturningBuilder,
} from "./types";

/**
 * Internal: A write operation collected during a transaction callback.
 *
 * Writes are recorded and their `.run()` resolves immediately with `undefined`
 * so the callback can keep making sync progress. The actual SQL runs later
 * during {@link flushWrites}.
 *
 * `.returning()` is intentionally NOT fetchable inside a transaction callback:
 * D1 doesn't let us execute statements one-at-a-time and then batch-commit,
 * so any row fetched via `.returning()` would only be available AFTER flush,
 * and awaiting it inside the callback would deadlock the flush. We resolve
 * `.returning().run()` with `undefined` as well, and the transaction's llms.txt
 * documents the pattern: generate ids client-side (e.g. `crypto.randomUUID()`),
 * or issue the read as a separate `db.query(...)` call AFTER the transaction
 * commits.
 */
type PendingWrite = {
  /** The underlying Operation produced by tx.insert/update/delete. */
  op: Operation<unknown>;
};

/**
 * Context object threaded through tx proxies. Tracks the collected writes and
 * whether the transaction has already been flushed or aborted so we can surface
 * clear errors on misuse.
 */
type TxContext = {
  pending: PendingWrite[];
  /** True once the transaction has flushed successfully or errored. */
  closed: boolean;
  /** True when the callback threw and we're unwinding — no more ops allowed. */
  aborted: boolean;
  /** True if we're inside a nested `tx.transaction()` — triggers flattening. */
  nested: boolean;
};

/**
 * Error thrown when a transaction is misused (e.g. an op is recorded after the
 * transaction has already committed or aborted).
 */
export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Wraps an `Operation<unknown>` produced by tx.insert/update/delete so that
 * calling `.run()` records it into the transaction's pending queue instead of
 * executing immediately.
 *
 * This is the heart of the recording-proxy approach: the proxy looks like a
 * normal Operation to userland, but nothing touches D1 until `flushWrites()`
 * is called at the end of the transaction callback.
 *
 * `.run()` resolves immediately with `undefined` so the callback can keep
 * making sync progress. `.returning().run()` also resolves with `undefined`
 * — see the comment on {@link PendingWrite} for why returning isn't fetchable
 * inside a transaction callback.
 */
function wrapWriteOperation(
  ctx: TxContext,
  op: Operation<unknown> & {
    returning?: () => Operation<unknown>;
  },
): Operation<void> & { returning?: () => Operation<unknown> } {
  const record = (toQueue: Operation<unknown>) => {
    if (ctx.closed) {
      throw new TransactionError(
        "Cannot run an operation after the transaction has committed or aborted.",
      );
    }
    if (ctx.aborted) {
      throw new TransactionError(
        "Transaction has been aborted; no further operations may run.",
      );
    }
    ctx.pending.push({ op: toQueue });
  };

  const proxied: Operation<void> & { returning?: () => Operation<unknown> } = {
    permissions: op.permissions,
    async run(): Promise<void> {
      record(op);
      // Resolve immediately — the batch is flushed at the end of the tx.
      return undefined;
    },
  };

  if (typeof op.returning === "function") {
    proxied.returning = (): Operation<unknown> => {
      const returningOp = op.returning!();
      return {
        permissions: returningOp.permissions,
        async run(): Promise<unknown> {
          record(returningOp);
          // Row values cannot be surfaced inside the callback because the
          // batch flushes only after the callback returns. Resolve with
          // `undefined` so the caller's `.run()` doesn't deadlock; users who
          // need the row should read it back via `db.query(...)` after the
          // transaction commits, or generate the id client-side with
          // `crypto.randomUUID()` and reference that.
          return undefined;
        },
      };
    };
  }

  return proxied;
}

/**
 * Creates the `tx` handle passed to the transaction callback. Wraps the real
 * Db's mutate builders so their `.run()` calls are recorded, and passes
 * reads through untouched so they execute eagerly.
 *
 * Reads are intentionally not buffered: the caller needs their results to make
 * decisions (e.g. "abort if stock < qty"). This means reads are not isolated
 * from concurrent transactions — D1 gives no snapshot isolation across async
 * code anyway, so concurrency-safe code must use relative SQL + WHERE guards
 * on writes to prevent oversell / lost updates.
 */
function createTxHandle(db: Db, ctx: TxContext): Tx {
  return {
    query: <TTable extends DrizzleTable>(table: TTable): QueryBuilder<TTable> => {
      // Reads flow through directly. Nothing to record.
      return db.query(table);
    },

    insert: <TTable extends DrizzleTable>(table: TTable): InsertBuilder<TTable> => {
      const realBuilder = db.insert(table);
      return {
        values: (values: Record<string, unknown>) => {
          const realOp = realBuilder.values(values) as unknown as Operation<unknown> & {
            returning?: () => Operation<unknown>;
          };
          return wrapWriteOperation(ctx, realOp) as unknown as InsertReturningBuilder<TTable>;
        },
      };
    },

    update: <TTable extends DrizzleTable>(table: TTable): UpdateBuilder<TTable> => {
      const realBuilder = db.update(table);
      return {
        set: (values: Record<string, unknown>): UpdateWhereBuilder<TTable> => {
          const realSet = realBuilder.set(values);
          return {
            where: (condition: unknown) => {
              const realOp = realSet.where(condition) as unknown as Operation<unknown> & {
                returning?: () => Operation<unknown>;
              };
              return wrapWriteOperation(ctx, realOp) as unknown as UpdateReturningBuilder<TTable>;
            },
          };
        },
      };
    },

    delete: <TTable extends DrizzleTable>(table: TTable): DeleteBuilder<TTable> => {
      const realBuilder = db.delete(table);
      return {
        where: (condition: unknown) => {
          const realOp = realBuilder.where(condition) as unknown as Operation<unknown> & {
            returning?: () => Operation<unknown>;
          };
          return wrapWriteOperation(ctx, realOp) as unknown as DeleteReturningBuilder<TTable>;
        },
      };
    },

    transaction: <T>(callback: (tx: Tx) => Promise<T>): Promise<T> => {
      // Flatten: share the outer context so nested writes land in the same
      // atomic batch. Any error thrown here aborts the entire outer tx.
      return runTransaction(db, callback, ctx);
    },
  };
}

/**
 * Flushes all pending writes recorded during the transaction callback via a
 * single atomic `db.batch([...])` call. D1's batch API wraps the statements in
 * an implicit transaction — all-or-nothing — so this is our atomicity anchor.
 *
 * If any queued op somehow lacks the BATCHABLE hook (should be unreachable
 * given our wrapping), `db.batch()` falls back to sequential execution with
 * the usual caveats — we log a debug check so regressions are loud.
 */
async function flushWrites(db: Db, pending: PendingWrite[]): Promise<void> {
  if (pending.length === 0) return;

  const ops = pending.map((p) => p.op);

  // Sanity check: every pending op MUST carry the BATCHABLE symbol. The
  // wrappers above only accept operations produced by tx.insert/update/delete,
  // which are built on top of the same mutate builders that attach BATCHABLE.
  // A missing hook here indicates a regression in our wrapping.
  for (const op of ops) {
    if (getBatchable(op) === undefined) {
      throw new TransactionError(
        "Internal error: a pending transaction operation was not batchable. " +
          "Transactions only accept operations produced by tx.insert/update/delete.",
      );
    }
  }

  await db.batch(ops).run({});
}

/**
 * Executes a callback inside a transaction context.
 *
 * ## Semantics
 *
 * - **Reads** (`tx.query(...)`) execute eagerly against the underlying db.
 *   They see whatever is committed at the moment they run. D1 does not
 *   provide snapshot isolation across async code, so concurrent transactions
 *   can see each other's reads. **Do not rely on a read's value alone to
 *   gate a write** — use a relative SQL update with a WHERE guard instead
 *   (e.g. `set({ stock: sql\`stock - ${qty}\` }).where(gte(products.stock, qty))`).
 * - **Writes** (`tx.insert/update/delete`) are recorded into a pending queue.
 *   They do not touch D1 until the callback returns successfully. On return,
 *   all pending writes are flushed as a single atomic `db.batch([...])`.
 * - **Rollback on throw**: if the callback throws, the pending queue is
 *   discarded and the error is re-thrown. Nothing was written to D1.
 * - **`.returning().run()`**: the returned promise resolves AFTER the batch
 *   flushes at the end of the callback. If you `await` it inside the
 *   callback and then use the result for a subsequent operation, you'll
 *   deadlock — the returning promise can never resolve inside the callback.
 *   For that pattern, restructure to avoid needing the returned row inside
 *   the callback (e.g. generate ids client-side), or split the work across
 *   multiple transactions.
 * - **Nested transactions**: flattened into the parent. A nested call records
 *   into the same pending queue, so everything still commits atomically.
 * - **Permissions**: each sub-op's permission check runs at flush time via
 *   the underlying `db.batch()` code path, which performs an upfront
 *   permission check across every queued operation. If any op lacks a
 *   grant, the entire transaction fails before any SQL is issued.
 *
 * @param db - The outer Db instance. Reads and the final batch flush go through this db.
 * @param callback - The transaction body. Receives a `tx` handle and may return any value.
 * @param parentCtx - Internal: when present, we're in a nested transaction and should
 *   flatten into the parent's pending queue instead of opening a new one.
 * @returns The value returned by the callback, or rejects with whatever the callback threw.
 */
export async function runTransaction<T>(
  db: Db,
  callback: (tx: Tx) => Promise<T>,
  parentCtx?: TxContext,
): Promise<T> {
  // Nested call: share the parent's context so every write lands in the same
  // atomic batch. The parent's flush handles everything.
  if (parentCtx) {
    if (parentCtx.closed || parentCtx.aborted) {
      throw new TransactionError(
        "Cannot start a nested transaction: parent has already committed or aborted.",
      );
    }
    const nestedTx = createTxHandle(db, parentCtx);
    // Execute immediately against the parent's context. Any writes collected
    // here are appended to the parent's pending queue. If the nested callback
    // throws, the error propagates up and the parent's catch-and-discard
    // handling kicks in.
    return callback(nestedTx);
  }

  const ctx: TxContext = {
    pending: [],
    closed: false,
    aborted: false,
    nested: false,
  };

  const tx = createTxHandle(db, ctx);

  let result: T;
  try {
    result = await callback(tx);
  } catch (err) {
    ctx.aborted = true;
    ctx.closed = true;
    ctx.pending.length = 0;
    throw err;
  }

  // Flush pending writes atomically. If the flush itself throws (e.g. a
  // permission check failed or a conditional update matched zero rows and
  // the underlying D1 batch aborted), we discard the pending queue and
  // propagate the error. Because all writes either commit together or none
  // of them do, callers get clean all-or-nothing semantics.
  try {
    await flushWrites(db, ctx.pending);
    ctx.closed = true;
  } catch (err) {
    ctx.aborted = true;
    ctx.closed = true;
    throw err;
  }

  return result;
}

