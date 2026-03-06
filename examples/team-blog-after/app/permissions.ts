import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts, comments } from "./db/schema";

export type UserRole = "admin" | "editor" | "author" | "reader";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: UserRole[];
  isImpersonating?: boolean;
  impersonatedBy?: string;
  realUser?: { id: string; name: string };
};

// ---------------------------------------------------------------------------
// Declarative permission definitions (source of truth)
// ---------------------------------------------------------------------------
// These definePermissions + grant declarations are the source of truth for
// what each role is allowed to do. Once @cfast/db is implemented, these will
// power the Operations layer and replace the hasRole/hasAnyRole checks below.
// For now, both coexist during migration.
// ---------------------------------------------------------------------------

const roles = ["reader", "author", "editor", "admin"] as const;

export const permissions = definePermissions<typeof roles, AuthUser>({
  roles,
  hierarchy: {
    author: ["reader"],
    editor: ["author"],
    admin: ["editor"],
  },
  grants: {
    reader: [
      grant<AuthUser>("read", posts, { where: (_cols, _user) => eq(posts.published, true) }),
      grant<AuthUser>("read", comments),
    ],
    author: [
      grant<AuthUser>("create", posts),
      grant<AuthUser>("update", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
      grant<AuthUser>("delete", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
      grant<AuthUser>("create", comments),
      grant<AuthUser>("delete", comments, { where: (_cols, user) => eq(comments.authorId, user.id) }),
    ],
    editor: [
      grant<AuthUser>("read", posts), // unrestricted — sees unpublished too
      grant<AuthUser>("update", posts), // can update any post
      grant<AuthUser>("delete", comments), // can delete any comment
    ],
    admin: [
      grant<AuthUser>("manage", "all"),
    ],
  },
});

// ---------------------------------------------------------------------------
// Legacy role helpers (kept for backward compatibility during migration)
// ---------------------------------------------------------------------------
// Routes still use these until @cfast/db provides the Operations layer.
// ---------------------------------------------------------------------------

export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (user.roles.includes("admin")) return true;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser, checkRoles: UserRole[]): boolean {
  return checkRoles.some((role) => hasRole(user, role));
}
