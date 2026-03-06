import type { Table } from "drizzle-orm";
import type { PermissionAction, Grant, WhereClause } from "./types";

type GrantOptions<TUser = unknown> = {
  where?: WhereClause<TUser>;
};

export function grant<TUser = unknown>(
  action: PermissionAction,
  subject: Table | "all",
  options?: GrantOptions<TUser>,
): Grant<TUser> {
  return {
    action,
    subject,
    where: options?.where,
  };
}
