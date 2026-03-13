import { and, or } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import type { DrizzleTable, Grant, PermissionAction, PermissionDescriptor } from "@cfast/permissions";
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

export function buildPermissionFilter(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
  user: User | null,
  unsafe: boolean,
): SQL | undefined {
  if (unsafe || !user) return undefined;
  const filters = resolvePermissionFilters(grants, action, table);
  if (filters.length === 0) return undefined;
  const columns = table as Record<string, unknown>;
  // Permission filter fns return DrizzleSQL (structurally { getSQL(): unknown }),
  // which at runtime are Drizzle SQL expressions compatible with SQLWrapper.
  const clauses = filters.map(
    (fn) => fn(columns, user) as SQLWrapper | undefined,
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
