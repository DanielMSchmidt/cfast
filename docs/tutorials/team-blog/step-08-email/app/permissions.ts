import { definePermissions } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts } from "./db/schema";

export type UserRole = "admin" | "editor" | "reader";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: UserRole[];
};

const appRoles = ["reader", "editor", "admin"] as const;

export const permissions = definePermissions<AuthUser>()({
  roles: appRoles,
  hierarchy: {
    editor: ["reader"],
    admin: ["editor"],
  },
  grants: (grant) => ({
    reader: [
      grant("read", posts, { where: () => eq(posts.published, true) }),
    ],
    editor: [
      grant("create", posts),
      grant("read", posts),
      grant("update", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
      grant("delete", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
    ],
    admin: [
      grant("manage", "all"),
    ],
  }),
});

export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (user.roles.includes("admin")) return true;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser, checkRoles: UserRole[]): boolean {
  return checkRoles.some((role) => hasRole(user, role));
}
