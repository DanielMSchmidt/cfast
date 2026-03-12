import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  introspectSchema,
  tableNameToLabel,
  columnNameToLabel,
} from "../introspect.js";

// --- Test schema ---

const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  published: integer("published", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Auth tables (should be auto-excluded)
const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
});

const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
});

const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
});

const passkey = sqliteTable("passkey", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  publicKey: text("public_key").notNull(),
});

const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role", { enum: ["admin", "editor", "author"] }).notNull(),
});

// --- Tests ---

describe("tableNameToLabel", () => {
  it("converts snake_case to Title Case with pluralization", () => {
    expect(tableNameToLabel("blog_post")).toBe("Blog Posts");
  });

  it("pluralizes single words", () => {
    expect(tableNameToLabel("user")).toBe("Users");
  });

  it("handles words ending in y (consonant + y)", () => {
    expect(tableNameToLabel("category")).toBe("Categories");
  });

  it("handles words ending in y (vowel + y)", () => {
    expect(tableNameToLabel("key")).toBe("Keys");
  });

  it("handles words ending in s", () => {
    expect(tableNameToLabel("status")).toBe("Statuses");
  });

  it("handles camelCase names", () => {
    expect(tableNameToLabel("blogPost")).toBe("Blog Posts");
  });

  it("handles already-plural-looking names", () => {
    expect(tableNameToLabel("posts")).toBe("Postses");
  });
});

describe("columnNameToLabel", () => {
  it("converts snake_case to Title Case", () => {
    expect(columnNameToLabel("created_at")).toBe("Created At");
  });

  it("converts camelCase to Title Case", () => {
    expect(columnNameToLabel("userId")).toBe("User Id");
  });

  it("handles single word", () => {
    expect(columnNameToLabel("email")).toBe("Email");
  });
});

describe("introspectSchema", () => {
  it("returns table metadata for each non-excluded table", () => {
    const result = introspectSchema({ users, posts });

    expect(result).toHaveLength(2);
    const names = result.map((t) => t.name);
    expect(names).toContain("users");
    expect(names).toContain("posts");
  });

  it("auto-excludes session, account, verification, passkey tables", () => {
    const schema = {
      users,
      posts,
      session,
      account,
      verification,
      passkey,
    };
    const result = introspectSchema(schema);

    const names = result.map((t) => t.name);
    expect(names).not.toContain("session");
    expect(names).not.toContain("account");
    expect(names).not.toContain("verification");
    expect(names).not.toContain("passkey");
    expect(names).toContain("users");
    expect(names).toContain("posts");
  });

  it("includes auto-excluded tables when overrides are provided", () => {
    const schema = { session };
    const result = introspectSchema(schema, {
      session: { label: "Active Sessions" },
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("session");
    expect(result[0].label).toBe("Active Sessions");
  });

  it("excludes tables with exclude: true override", () => {
    const result = introspectSchema(
      { users, posts },
      { posts: { exclude: true } },
    );

    const names = result.map((t) => t.name);
    expect(names).toContain("users");
    expect(names).not.toContain("posts");
  });

  it("generates labels from table names", () => {
    const result = introspectSchema({ users, posts });

    const usersTable = result.find((t) => t.name === "users");
    const postsTable = result.find((t) => t.name === "posts");
    expect(usersTable?.label).toBe("Userses");
    expect(postsTable?.label).toBe("Postses");
  });

  it("uses override labels when provided", () => {
    const result = introspectSchema(
      { posts },
      { posts: { label: "Blog Posts" } },
    );

    expect(result[0].label).toBe("Blog Posts");
  });

  it("detects primary key column", () => {
    const result = introspectSchema({ users });
    const usersTable = result.find((t) => t.name === "users");

    expect(usersTable?.primaryKey).toBe("id");
  });

  it("detects column metadata correctly", () => {
    const result = introspectSchema({ users });
    const usersTable = result.find((t) => t.name === "users");
    const columns = usersTable?.columns ?? [];

    const idCol = columns.find((c) => c.name === "id");
    expect(idCol?.dataType).toBe("string");
    expect(idCol?.isPrimaryKey).toBe(true);
    // text PKs don't auto-generate defaults (unlike integer PKs with autoincrement)
    expect(idCol?.required).toBe(true);

    const emailCol = columns.find((c) => c.name === "email");
    expect(emailCol?.dataType).toBe("string");
    expect(emailCol?.required).toBe(true);

    const avatarCol = columns.find((c) => c.name === "avatar_url");
    expect(avatarCol?.required).toBe(false);
  });

  it("detects foreign key references", () => {
    const result = introspectSchema({ users, posts });
    const postsTable = result.find((t) => t.name === "posts");
    const authorCol = postsTable?.columns.find(
      (c) => c.name === "author_id",
    );

    expect(authorCol?.referencesTable).toBe("users");
    expect(authorCol?.referencesColumn).toBe("id");
  });

  it("detects enum values", () => {
    const result = introspectSchema({ roles });
    const rolesTable = result.find((t) => t.name === "roles");
    const roleCol = rolesTable?.columns.find((c) => c.name === "role");

    expect(roleCol?.enumValues).toEqual(["admin", "editor", "author"]);
  });

  it("defaults listColumns to all non-PK columns", () => {
    const result = introspectSchema({ users });
    const usersTable = result.find((t) => t.name === "users");

    expect(usersTable?.listColumns).not.toContain("id");
    expect(usersTable?.listColumns).toContain("email");
    expect(usersTable?.listColumns).toContain("name");
    expect(usersTable?.listColumns).toContain("avatar_url");
    expect(usersTable?.listColumns).toContain("created_at");
  });

  it("uses override listColumns when provided", () => {
    const result = introspectSchema(
      { posts },
      { posts: { listColumns: ["title", "published"] } },
    );

    expect(result[0].listColumns).toEqual(["title", "published"]);
  });

  it("defaults searchable to first text column", () => {
    const result = introspectSchema({ posts });
    const postsTable = result.find((t) => t.name === "posts");

    // First text column in posts is "id" (string type)
    expect(postsTable?.searchableColumns).toEqual(["id"]);
  });

  it("uses override searchable columns", () => {
    const result = introspectSchema(
      { posts },
      { posts: { searchable: ["title", "content"] } },
    );

    expect(result[0].searchableColumns).toEqual(["title", "content"]);
  });

  it("defaults sort to primary key descending", () => {
    const result = introspectSchema({ users });
    const usersTable = result.find((t) => t.name === "users");

    expect(usersTable?.defaultSort).toEqual({
      column: "id",
      direction: "desc",
    });
  });

  it("uses override sort when provided", () => {
    const result = introspectSchema(
      { posts },
      { posts: { defaultSort: { column: "created_at", direction: "asc" } } },
    );

    expect(result[0].defaultSort).toEqual({
      column: "created_at",
      direction: "asc",
    });
  });

  it("returns tables sorted alphabetically", () => {
    const schema = { posts, users, roles };
    const result = introspectSchema(schema);

    expect(result.map((t) => t.name)).toEqual(["posts", "roles", "users"]);
  });

  it("returns empty array for empty schema", () => {
    const result = introspectSchema({});
    expect(result).toEqual([]);
  });

  it("stores the original drizzle table reference", () => {
    const result = introspectSchema({ users });
    expect(result[0].drizzleTable).toBe(users);
  });

  it("stores overrides on the table meta", () => {
    const overrides = {
      label: "Blog Posts",
      listColumns: ["title"],
    };
    const result = introspectSchema({ posts }, { posts: overrides });

    expect(result[0].overrides).toBe(overrides);
  });
});
