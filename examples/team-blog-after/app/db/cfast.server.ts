import { createDb } from "@cfast/db";
import type { Db } from "@cfast/db";
import * as schema from "./schema";
import { permissions } from "../permissions";
import type { AuthUser, UserRole } from "../permissions";

const ROLE_PRIORITY: UserRole[] = ["admin", "editor", "author", "reader"];

/**
 * Pick the highest role from a user's role list.
 *
 * @cfast/db expects a single `role` string. Since the blog's permission
 * hierarchy is linear (admin > editor > author > reader), picking the
 * highest role gives the user all permissions they're entitled to.
 */
function getHighestRole(roles: UserRole[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return "reader";
}

export function createCfDb(d1: D1Database, user: AuthUser | null): Db {
  return createDb({
    d1,
    schema: schema as unknown as Record<string, any>,
    permissions,
    user: user ? { id: user.id, role: getHighestRole(user.roles) } : null,
    cache: false,
  });
}
