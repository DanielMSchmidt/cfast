import { and, or } from "drizzle-orm";
import type { DrizzleTable, Grant, PermissionAction, PermissionDescriptor } from "@cfast/permissions";
import { resolvePermissionFilters } from "./permissions";

export type User = { id: string };

export function getTableName(table: DrizzleTable): string {
  return (table as any)._?.name
    ?? (table as any)[Symbol.for("drizzle:Name")]
    ?? (table as any)[Symbol.for("drizzle:BaseName")]
    ?? "unknown";
}

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

export function buildPermissionFilter(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
  user: User | null,
  unsafe: boolean,
): unknown {
  if (unsafe || !user) return undefined;
  const filters = resolvePermissionFilters(grants, action, table);
  if (filters.length === 0) return undefined;
  const columns = table as Record<string, unknown>;
  const clauses = filters.map((fn) => fn(columns, user));
  return clauses.length === 1 ? clauses[0] : or(...(clauses as [any, ...any[]]));
}

export function combineWhere(userCondition: unknown, permFilter: unknown): unknown {
  if (permFilter && userCondition) return and(userCondition as any, permFilter as any);
  return (permFilter ?? userCondition) as any;
}

export function makePermissions(
  unsafe: boolean,
  action: PermissionAction,
  table: DrizzleTable,
): PermissionDescriptor[] {
  return unsafe ? [] : [{ action, table }];
}
