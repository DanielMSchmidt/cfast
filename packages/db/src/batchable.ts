import type { BatchItem } from "drizzle-orm/batch";
import type { drizzle } from "drizzle-orm/d1";

/**
 * Internal symbol used by mutate builders to expose a "build the underlying
 * Drizzle query" function so that {@link Db.batch} can pack multiple operations
 * into D1's native atomic batch via Drizzle's `db.batch()` API.
 *
 * Operations that don't carry this symbol fall back to sequential execution
 * (the same behavior as before native batch support was added).
 *
 * The function takes a Drizzle D1 instance and returns a `BatchItem<'sqlite'>`
 * (a built but un-executed Drizzle query) plus metadata used by the batch
 * runner to invalidate the right cache tables after the batch completes.
 *
 * @internal
 */
export const BATCHABLE = Symbol.for("@cfast/db/batchable");

/**
 * The shape returned by an Operation's {@link BATCHABLE} hook.
 *
 * @internal
 */
export type BatchableMeta = {
  /** Builds the Drizzle query (un-executed) for this operation. */
  build: (drizzleDb: ReturnType<typeof drizzle>) => BatchItem<"sqlite">;
  /** The cache table name to invalidate after the batch commits. */
  tableName: string;
  /**
   * Whether the result of this query should be returned to the caller. When
   * `false`, the corresponding entry in the batch result array is discarded
   * (matching the existing `.run()` semantics that resolve to void).
   */
  withResult: boolean;
};

/**
 * Type guard / accessor for the {@link BATCHABLE} symbol on an Operation.
 *
 * @internal
 */
export function getBatchable(op: unknown): BatchableMeta | undefined {
  if (op === null || typeof op !== "object") return undefined;
  const meta = (op as Record<symbol, unknown>)[BATCHABLE];
  return meta as BatchableMeta | undefined;
}
