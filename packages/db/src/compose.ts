import { deduplicateDescriptors } from "./utils";
import type { Operation } from "./types";

type RunFn = (params: Record<string, unknown>) => Promise<unknown>;

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
