import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  body: text("body").notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Revision table intentionally using a camelCase JS key with a snake_case
 * SQL name. This is the regression fixture for cfast issues #146, #175,
 * and #177: before the fix, a permission grant written as
 * `grant("read", "post_versions")` or `grant("read", "postVersions")`
 * matched by name but held a non-schema shadow reference, so a Drizzle
 * relational `with: { versions: true }` query on `posts` silently returned
 * rows with empty `versions` arrays.
 *
 * With runtime resolution in `definePermissions<User, typeof schema>({ schema })`,
 * both string forms resolve to this exact table reference and `with`
 * queries correctly apply the root-table permission filter.
 */
export const postVersions = sqliteTable("post_versions", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  revision: integer("revision").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Drizzle relation definitions. Required so `db.query(posts).findMany({
 * with: { versions: true } })` can resolve the child table by reference.
 * Drizzle looks up the child through the schema map at drizzle() init — so
 * if a permission grant stored a different reference, relational queries
 * wouldn't fail noisily, they'd silently return detached rows.
 */
export const postsRelations = relations(posts, ({ many }) => ({
  versions: many(postVersions),
  comments: many(comments),
}));

export const postVersionsRelations = relations(postVersions, ({ one }) => ({
  post: one(posts, {
    fields: [postVersions.postId],
    references: [posts.id],
  }),
}));

export const schema = {
  users,
  posts,
  comments,
  postVersions,
  postsRelations,
  postVersionsRelations,
};
