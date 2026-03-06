import type { DrizzleTable, PermissionAction, Grant, WhereClause } from "./types";

export function grant(
  action: PermissionAction,
  subject: DrizzleTable | "all",
  options?: { where?: WhereClause },
): Grant {
  return {
    action,
    subject,
    where: options?.where,
  };
}
