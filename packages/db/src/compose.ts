import type { PermissionDescriptor } from "@cfast/permissions";
import type { Operation } from "./types";

function deduplicateDescriptors(
  descriptors: PermissionDescriptor[],
): PermissionDescriptor[] {
  const seen = new Set<string>();
  const result: PermissionDescriptor[] = [];

  for (const d of descriptors) {
    const tableName = (d.table as any)._?.name
      ?? (d.table as any)[Symbol.for("drizzle:Name")]
      ?? (d.table as any)[Symbol.for("drizzle:BaseName")]
      ?? "unknown";
    const key = `${d.action}:${tableName}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d);
    }
  }

  return result;
}

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
