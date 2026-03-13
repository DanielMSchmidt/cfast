import { deduplicateDescriptors } from "./utils";
import type { Operation } from "./types";

/**
 * A function that executes a single sub-operation within a {@link compose} executor.
 *
 * Each `RunFn` corresponds to one of the operations passed to `compose()`,
 * preserving the same positional order.
 */
type RunFn = (params: Record<string, unknown>) => Promise<unknown>;

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
    async run(_params: Record<string, unknown>): Promise<TResult> {
      const runs = operations.map((op) => op.run);
      return executor(...runs);
    },
  };
}
