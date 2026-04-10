import type { DrizzleTable } from "@cfast/permissions";
import { drizzle } from "drizzle-orm/d1";
import { getBatchable } from "./batchable";
import { checkOperationPermissions } from "./permissions";
import { deduplicateDescriptors } from "./utils";
import type {
  Db,
  DbConfig,
  InsertBuilder,
  InsertReturningBuilder,
  Operation,
  QueryBuilder,
  TransactionResult,
  Tx,
  UpdateBuilder,
  UpdateWhereBuilder,
  UpdateReturningBuilder,
  DeleteBuilder,
  DeleteReturningBuilder,
} from "./types";

type PendingWrite = { op: Operation<unknown> };

type TxContext = {
  pending: PendingWrite[];
  closed: boolean;
  aborted: boolean;
  nested: boolean;
};

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

function wrapWriteOperation(
  ctx: TxContext,
  op: Operation<unknown> & { returning?: () => Operation<unknown> },
): Operation<void> & { returning?: () => Operation<unknown> } {
  const record = (toQueue: Operation<unknown>) => {
    if (ctx.closed) {
      throw new TransactionError("Cannot run an operation after the transaction has committed or aborted.");
    }
    if (ctx.aborted) {
      throw new TransactionError("Transaction has been aborted; no further operations may run.");
    }
    ctx.pending.push({ op: toQueue });
  };

  const proxied: Operation<void> & { returning?: () => Operation<unknown> } = {
    permissions: op.permissions,
    async run(): Promise<void> { record(op); return undefined; },
  };

  if (typeof op.returning === "function") {
    proxied.returning = (): Operation<unknown> => {
      const returningOp = op.returning!();
      return {
        permissions: returningOp.permissions,
        async run(): Promise<unknown> { record(returningOp); return undefined; },
      };
    };
  }
  return proxied;
}

function createTxHandle(db: Db, ctx: TxContext): Tx {
  return {
    query: <TTable extends DrizzleTable>(table: TTable): QueryBuilder<TTable> => db.query(table),
    insert: <TTable extends DrizzleTable>(table: TTable): InsertBuilder<TTable> => {
      const realBuilder = db.insert(table);
      return {
        values: (values: Record<string, unknown>) => {
          const realOp = realBuilder.values(values) as unknown as Operation<unknown> & { returning?: () => Operation<unknown> };
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
              const realOp = realSet.where(condition) as unknown as Operation<unknown> & { returning?: () => Operation<unknown> };
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
          const realOp = realBuilder.where(condition) as unknown as Operation<unknown> & { returning?: () => Operation<unknown> };
          return wrapWriteOperation(ctx, realOp) as unknown as DeleteReturningBuilder<TTable>;
        },
      };
    },
    transaction: <T>(callback: (tx: Tx) => Promise<T>): Promise<T> => runTransaction(db, callback, ctx),
  };
}

type FlushResult = { changes: number; writeResults: D1Result[] };

async function flushWritesDirect(
  config: Pick<DbConfig, "d1" | "schema" | "grants">,
  isUnsafe: boolean,
  pending: PendingWrite[],
): Promise<FlushResult> {
  if (pending.length === 0) return { changes: 0, writeResults: [] };
  const ops = pending.map((p) => p.op);
  for (const op of ops) {
    if (getBatchable(op) === undefined) {
      throw new TransactionError(
        "Internal error: a pending transaction operation was not batchable. " +
        "Transactions only accept operations produced by tx.insert/update/delete.",
      );
    }
  }

  const allPermissions = deduplicateDescriptors(ops.flatMap((op) => op.permissions));
  if (!isUnsafe) { checkOperationPermissions(config.grants, allPermissions); }

  const batchables = ops.map((op) => getBatchable(op)!);
  await Promise.all(batchables.map((b) => b.prepare?.() ?? Promise.resolve()));

  const sharedDb = drizzle(config.d1, { schema: config.schema });
  const items = batchables.map((b) => b.build(sharedDb));

  // Use Drizzle's batch which internally calls d1.batch() with prepared
  // statements. The raw D1Result objects flow through as the batch results.
  const batchResults = (await sharedDb.batch(
    items as unknown as [import("drizzle-orm/batch").BatchItem<"sqlite">, ...import("drizzle-orm/batch").BatchItem<"sqlite">[]],
  )) as unknown[];

  // Drizzle's batch returns the raw D1 results which include meta.changes.
  const writeResults: D1Result[] = batchResults.map((r) => {
    if (r && typeof r === "object" && "meta" in r) {
      return r as D1Result;
    }
    return { results: [], success: true, meta: { changes: 0 } } as unknown as D1Result;
  });
  const changes = writeResults.reduce(
    (sum, r) => sum + (((r?.meta as Record<string, unknown>)?.changes as number) ?? 0), 0,
  );
  return { changes, writeResults };
}

export async function runTransaction<T>(
  db: Db,
  callback: (tx: Tx) => Promise<T>,
  parentCtx: TxContext,
): Promise<T>;
export async function runTransaction<T>(
  db: Db,
  callback: (tx: Tx) => Promise<T>,
  config?: Pick<DbConfig, "d1" | "schema" | "grants">,
  isUnsafe?: boolean,
): Promise<TransactionResult<T>>;
export async function runTransaction<T>(
  db: Db,
  callback: (tx: Tx) => Promise<T>,
  parentCtxOrConfig?: TxContext | Pick<DbConfig, "d1" | "schema" | "grants">,
  isUnsafe?: boolean,
): Promise<TransactionResult<T> | T> {
  if (parentCtxOrConfig && "pending" in parentCtxOrConfig) {
    const parentCtx = parentCtxOrConfig;
    if (parentCtx.closed || parentCtx.aborted) {
      throw new TransactionError("Cannot start a nested transaction: parent has already committed or aborted.");
    }
    return callback(createTxHandle(db, parentCtx));
  }

  const config = parentCtxOrConfig as Pick<DbConfig, "d1" | "schema" | "grants"> | undefined;
  const ctx: TxContext = { pending: [], closed: false, aborted: false, nested: false };
  const tx = createTxHandle(db, ctx);

  let result: T;
  try { result = await callback(tx); }
  catch (err) { ctx.aborted = true; ctx.closed = true; ctx.pending.length = 0; throw err; }

  let flushResult: FlushResult;
  try {
    if (config) {
      flushResult = await flushWritesDirect(config, isUnsafe ?? false, ctx.pending);
    } else {
      if (ctx.pending.length > 0) await db.batch(ctx.pending.map((p) => p.op)).run({});
      flushResult = { changes: 0, writeResults: [] };
    }
    ctx.closed = true;
  } catch (err) { ctx.aborted = true; ctx.closed = true; throw err; }

  return { result, meta: { changes: flushResult.changes, writeResults: flushResult.writeResults } };
}
