import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts, comments } from "./schema";

export const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  grants: {
    anonymous: [
      grant("read", posts, { where: (cols) => eq(cols.published as never, true) }),
    ],
    user: [
      grant("read", posts, { where: (cols) => eq(cols.published as never, true) }),
      grant("create", posts),
      grant("update", posts, {
        where: (cols, user) => eq(cols.authorId as never, user.id),
      }),
      grant("delete", posts, {
        where: (cols, user) => eq(cols.authorId as never, user.id),
      }),
      grant("read", comments),
      grant("create", comments),
      grant("delete", comments, {
        where: (cols, user) => eq(cols.authorId as never, user.id),
      }),
    ],
    editor: [
      grant("read", posts),
      grant("create", posts),
      grant("update", posts),
      grant("delete", posts),
      grant("read", comments),
      grant("create", comments),
      grant("delete", comments),
    ],
    admin: [grant("manage", "all")],
  },
  hierarchy: {
    admin: ["editor"],
    editor: ["user"],
  },
});

export const testUsers = {
  alice: {
    id: "alice-1",
    email: "alice@test.com",
    name: "Alice",
    role: "admin",
  },
  bob: { id: "bob-1", email: "bob@test.com", name: "Bob", role: "editor" },
  charlie: {
    id: "charlie-1",
    email: "charlie@test.com",
    name: "Charlie",
    role: "user",
  },
  anon: {
    id: "anon-1",
    email: "anon@test.com",
    name: "Anon",
    role: "anonymous",
  },
} as const;

export const testPosts = [
  {
    id: "post-1",
    title: "Alice Draft",
    content: "...",
    authorId: "alice-1",
    published: false,
  },
  {
    id: "post-2",
    title: "Alice Published",
    content: "...",
    authorId: "alice-1",
    published: true,
  },
  {
    id: "post-3",
    title: "Charlie Draft",
    content: "...",
    authorId: "charlie-1",
    published: false,
  },
  {
    id: "post-4",
    title: "Charlie Published",
    content: "...",
    authorId: "charlie-1",
    published: true,
  },
  {
    id: "post-5",
    title: "Bob Post",
    content: "...",
    authorId: "bob-1",
    published: true,
  },
];
