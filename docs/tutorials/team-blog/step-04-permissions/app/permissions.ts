import { definePermissions } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts } from "./schema";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

export const permissions = definePermissions<AuthUser>()({
  roles: ["reader", "author", "editor", "admin"] as const,

  hierarchy: {
    author: ["reader"],
    editor: ["author"],
    admin: ["editor"],
  },

  grants: (grant) => ({
    reader: [
      // Readers can only see published posts
      grant("read", posts, { where: () => eq(posts.published, true) }),
    ],

    author: [
      // Authors can create posts and manage their own
      grant("create", posts),
      grant("update", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
      grant("delete", posts, { where: (_cols, user) => eq(posts.authorId, user.id) }),
    ],

    editor: [
      // Editors can read and update all posts
      grant("read", posts),
      grant("update", posts),
      grant("delete", posts),
    ],

    admin: [
      // Admins can do everything
      grant("manage", "all"),
    ],
  }),
});
