import { definePermissions } from "@cfast/permissions";
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
// These definePermissions + grant declarations power the @cfast/db Operations
// layer. When a route calls cfDb.insert(posts).values(...).run(), the
// permissions are checked against these grants automatically.
// ---------------------------------------------------------------------------

const appRoles = ["reader", "author", "editor", "admin"] as const;

export const permissions = definePermissions<AuthUser>()({
  roles: appRoles,
  hierarchy: {
    author: ["reader"],
    editor: ["author"],
    admin: ["editor"],
  },
  grants: (grant) => ({
    reader: [
      grant("read", posts, { where: () => eq(posts.published, true) }),
      grant("read", comments),
      grant("create", comments),
      grant("delete", comments, { where: (_cols, user) => eq(comments.authorId, user.id) }),
    ],
    author: [
      grant("create", posts),
      grant("update", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
      grant("delete", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
      grant("create", comments),
      grant("delete", comments, { where: (_cols, user) => eq(comments.authorId, user.id) }),
    ],
    editor: [
      grant("read", posts),
      grant("update", posts),
      grant("delete", comments),
    ],
    admin: [
      grant("manage", "all"),
    ],
  }),
});


