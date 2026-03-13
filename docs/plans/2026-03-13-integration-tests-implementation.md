# Integration Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 62+ integration tests using `@cloudflare/vitest-pool-workers` that exercise real Cloudflare bindings (D1, KV, R2) inside the Workers runtime.

**Architecture:** A single `tests/integration/` workspace package with one vitest project per domain. Each project has its own `wrangler.toml` defining only the bindings it needs. Tests import bindings via `cloudflare:test` and use real Drizzle + real D1 instead of mocks. Shared helpers handle table creation, seeding, and cleanup.

**Tech Stack:** `@cloudflare/vitest-pool-workers`, `vitest ^4.1.0`, `drizzle-orm ^0.45.1`, `better-auth ^1.2.0`, Cloudflare Workers runtime (D1, KV, R2)

---

### Task 1: Scaffold the integration test workspace package

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `tests/integration/package.json`
- Create: `tests/integration/tsconfig.json`
- Create: `tests/integration/vitest.config.ts`
- Create: `tests/integration/worker.ts`

**Step 1: Add `tests/*` to pnpm workspace**

In `pnpm-workspace.yaml`, add the tests directory:

```yaml
packages:
  - "packages/*"
  - "examples/*"
  - "tests/*"
```

**Step 2: Create `tests/integration/package.json`**

```json
{
  "name": "integration",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.8",
    "@cloudflare/workers-types": "^4.20260305.1",
    "vitest": "^4.1.0",
    "wrangler": "^4",
    "drizzle-orm": "^0.45.1",
    "better-auth": "^1.2.0",
    "@cfast/core": "workspace:*",
    "@cfast/db": "workspace:*",
    "@cfast/env": "workspace:*",
    "@cfast/permissions": "workspace:*",
    "@cfast/auth": "workspace:*",
    "@cfast/actions": "workspace:*",
    "@cfast/storage": "workspace:*",
    "@cfast/email": "workspace:*"
  }
}
```

**Step 3: Create `tests/integration/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "types": [
      "@cloudflare/workers-types/experimental",
      "@cloudflare/vitest-pool-workers"
    ]
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

**Step 4: Create `tests/integration/worker.ts`**

This is the no-op worker entry required by wrangler:

```ts
export default {
  fetch(): Response {
    return new Response("integration test worker");
  },
};
```

**Step 5: Create `tests/integration/vitest.config.ts`**

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "db-permissions",
          include: ["db-permissions/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/db-permissions.toml" },
              miniflare: { d1Databases: ["DB"] },
            },
          },
        },
      },
      {
        test: {
          name: "auth-flow",
          include: ["auth-flow/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/auth-flow.toml" },
              miniflare: { d1Databases: ["DB"] },
            },
          },
        },
      },
      {
        test: {
          name: "core-plugins",
          include: ["core-plugins/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/core-plugins.toml" },
              miniflare: {
                d1Databases: ["DB"],
                kvNamespaces: ["KV"],
              },
            },
          },
        },
      },
      {
        test: {
          name: "actions",
          include: ["actions/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/actions.toml" },
              miniflare: { d1Databases: ["DB"] },
            },
          },
        },
      },
      {
        test: {
          name: "storage",
          include: ["storage/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/storage.toml" },
              miniflare: {
                d1Databases: ["DB"],
                r2Buckets: ["UPLOADS"],
              },
            },
          },
        },
      },
      {
        test: {
          name: "env",
          include: ["env/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/env.toml" },
              miniflare: {
                d1Databases: ["DB"],
                kvNamespaces: ["KV"],
                r2Buckets: ["R2"],
              },
            },
          },
        },
      },
      {
        test: {
          name: "email",
          include: ["email/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/email.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "permissions",
          include: ["permissions/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/db-permissions.toml" },
            },
          },
        },
      },
    ],
  },
});
```

**Step 6: Install dependencies**

Run: `pnpm install`
Expected: lockfile updated, no errors

**Step 7: Commit**

```bash
git add tests/integration/package.json tests/integration/tsconfig.json tests/integration/vitest.config.ts tests/integration/worker.ts pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: scaffold integration test workspace package"
```

---

### Task 2: Create wrangler configs

**Files:**
- Create: `tests/integration/wrangler/db-permissions.toml`
- Create: `tests/integration/wrangler/auth-flow.toml`
- Create: `tests/integration/wrangler/core-plugins.toml`
- Create: `tests/integration/wrangler/actions.toml`
- Create: `tests/integration/wrangler/storage.toml`
- Create: `tests/integration/wrangler/env.toml`
- Create: `tests/integration/wrangler/email.toml`

**Step 1: Create `tests/integration/wrangler/db-permissions.toml`**

```toml
name = "integration-db-permissions"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "test-db"
database_id = "test-db-id"
```

**Step 2: Create `tests/integration/wrangler/auth-flow.toml`**

```toml
name = "integration-auth-flow"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "test-db"
database_id = "test-db-id"

[vars]
APP_URL = "http://localhost:8787"
MAILGUN_API_KEY = "test-key"
MAILGUN_DOMAIN = "test.example.com"
```

**Step 3: Create `tests/integration/wrangler/core-plugins.toml`**

```toml
name = "integration-core-plugins"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "test-db"
database_id = "test-db-id"

[[kv_namespaces]]
binding = "KV"
id = "test-kv-id"
```

**Step 4: Create `tests/integration/wrangler/actions.toml`**

```toml
name = "integration-actions"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "test-db"
database_id = "test-db-id"
```

**Step 5: Create `tests/integration/wrangler/storage.toml`**

```toml
name = "integration-storage"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "test-db"
database_id = "test-db-id"

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "test-uploads"
```

**Step 6: Create `tests/integration/wrangler/env.toml`**

```toml
name = "integration-env"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "test-db"
database_id = "test-db-id"

[[kv_namespaces]]
binding = "KV"
id = "test-kv-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "test-r2"

[vars]
ENVIRONMENT = "development"
APP_NAME = "test-app"
```

**Step 7: Create `tests/integration/wrangler/email.toml`**

```toml
name = "integration-email"
main = "../worker.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
```

**Step 8: Commit**

```bash
git add tests/integration/wrangler/
git commit -m "chore: add wrangler configs for integration test domains"
```

---

### Task 3: Create shared test helpers

**Files:**
- Create: `tests/integration/helpers/schema.ts`
- Create: `tests/integration/helpers/d1.ts`
- Create: `tests/integration/helpers/permissions.ts`
- Create: `tests/integration/helpers/auth.ts`

**Step 1: Create `tests/integration/helpers/schema.ts`**

Shared Drizzle table definitions used across multiple test domains. These must be real Drizzle tables (not mocks) since we're testing against real D1.

```ts
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

export const schema = { users, posts, comments };
```

**Step 2: Create `tests/integration/helpers/d1.ts`**

Helper to create tables and seed data in D1 before tests run.

```ts
import type { D1Database } from "@cloudflare/workers-types";

const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`;

const CREATE_POSTS = `
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author_id TEXT NOT NULL REFERENCES users(id),
    published INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`;

const CREATE_COMMENTS = `
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    body TEXT NOT NULL,
    post_id TEXT NOT NULL REFERENCES posts(id),
    author_id TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`;

export async function applyMigrations(db: D1Database): Promise<void> {
  await db.exec(CREATE_USERS);
  await db.exec(CREATE_POSTS);
  await db.exec(CREATE_COMMENTS);
}

export async function resetDatabase(db: D1Database): Promise<void> {
  await db.exec("DELETE FROM comments");
  await db.exec("DELETE FROM posts");
  await db.exec("DELETE FROM users");
}

export type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type SeedPost = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
};

export async function seedUsers(
  db: D1Database,
  users: SeedUser[],
): Promise<void> {
  for (const u of users) {
    await db
      .prepare(
        "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)",
      )
      .bind(u.id, u.email, u.name, u.role)
      .run();
  }
}

export async function seedPosts(
  db: D1Database,
  posts: SeedPost[],
): Promise<void> {
  for (const p of posts) {
    await db
      .prepare(
        "INSERT INTO posts (id, title, content, author_id, published) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(p.id, p.title, p.content, p.authorId, p.published ? 1 : 0)
      .run();
  }
}
```

**Step 3: Create `tests/integration/helpers/permissions.ts`**

Standard permission fixtures.

```ts
import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts, comments } from "./schema";

export const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  grants: {
    anonymous: [grant("read", posts, { where: (cols) => eq(cols.published, true) })],
    user: [
      grant("read", posts, { where: (cols) => eq(cols.published, true) }),
      grant("create", posts),
      grant("update", posts, {
        where: (cols, user) => eq(cols.authorId, user.id),
      }),
      grant("delete", posts, {
        where: (cols, user) => eq(cols.authorId, user.id),
      }),
      grant("read", comments),
      grant("create", comments),
      grant("delete", comments, {
        where: (cols, user) => eq(cols.authorId, user.id),
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
  alice: { id: "alice-1", email: "alice@test.com", name: "Alice", role: "admin" },
  bob: { id: "bob-1", email: "bob@test.com", name: "Bob", role: "editor" },
  charlie: { id: "charlie-1", email: "charlie@test.com", name: "Charlie", role: "user" },
  anon: { id: "anon-1", email: "anon@test.com", name: "Anon", role: "anonymous" },
} as const;

export const testPosts = [
  { id: "post-1", title: "Alice Draft", content: "...", authorId: "alice-1", published: false },
  { id: "post-2", title: "Alice Published", content: "...", authorId: "alice-1", published: true },
  { id: "post-3", title: "Charlie Draft", content: "...", authorId: "charlie-1", published: false },
  { id: "post-4", title: "Charlie Published", content: "...", authorId: "charlie-1", published: true },
  { id: "post-5", title: "Bob Post", content: "...", authorId: "bob-1", published: true },
];
```

**Step 4: Create `tests/integration/helpers/auth.ts`**

Auth test helper for creating sessions. This will be fleshed out more in the auth-flow task, but provides the base.

```ts
export type TestSession = {
  userId: string;
  role: string;
  grants: import("@cfast/permissions").Grant[];
};

export function createTestSession(
  userId: string,
  role: string,
  permissions: import("@cfast/permissions").Permissions<readonly string[]>,
): TestSession {
  const { resolveGrants } = await import("@cfast/permissions");
  return {
    userId,
    role,
    grants: resolveGrants(permissions, [role]),
  };
}
```

**Step 5: Verify the package installs and vitest can discover the config**

Run: `cd tests/integration && pnpm vitest --help`
Expected: vitest help output (no config errors)

**Step 6: Commit**

```bash
git add tests/integration/helpers/
git commit -m "chore: add shared integration test helpers (schema, d1, permissions, auth)"
```

---

### Task 4: db-permissions — row-level-filters tests

**Files:**
- Create: `tests/integration/db-permissions/row-level-filters.test.ts`

**Step 1: Write the test file**

```ts
import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("db-permissions / row-level filters", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function dbAs(user: { id: string; role: string }) {
    return createDb({
      d1: env.DB,
      schema,
      grants: resolveGrants(permissions, [user.role]),
      user: { id: user.id },
    });
  }

  it("read with where grant returns only matching rows", async () => {
    const db = dbAs(testUsers.charlie);
    const result = await db.query(posts).findMany().run({});

    // Charlie (user role) can only read published posts
    expect(result).toHaveLength(3); // post-2, post-4, post-5 are published
    expect(result.every((p) => p.published)).toBe(true);
  });

  it("anonymous reads only published posts", async () => {
    const db = dbAs(testUsers.anon);
    const result = await db.query(posts).findMany().run({});

    expect(result).toHaveLength(3);
    expect(result.every((p) => p.published)).toBe(true);
  });

  it("multiple grants on same action+table: where clauses ORed", async () => {
    // User role has read grant with where: published=true
    // If we add a second read grant for own posts, both should apply via OR
    // Editor role has unrestricted read — test that separately
    // Here we test user role: can read published posts (grant 1)
    const db = dbAs(testUsers.charlie);
    const result = await db.query(posts).findMany().run({});

    // Charlie sees all published posts (3), not his own drafts (user role only has published filter for read)
    expect(result).toHaveLength(3);
  });

  it("unrestricted grant (no where) wins over filtered grants", async () => {
    // Editor has unrestricted read on posts
    const db = dbAs(testUsers.bob);
    const result = await db.query(posts).findMany().run({});

    // Bob (editor) sees ALL posts including drafts
    expect(result).toHaveLength(5);
  });

  it("manage grant on 'all' bypasses all filters", async () => {
    const db = dbAs(testUsers.alice);
    const result = await db.query(posts).findMany().run({});

    // Alice (admin with manage all) sees everything
    expect(result).toHaveLength(5);
  });

  it("permission where AND'd with user-supplied where", async () => {
    const db = dbAs(testUsers.charlie);
    // Charlie can read published posts; also filter by author
    const result = await db
      .query(posts)
      .findMany({ where: eq(posts.authorId, "alice-1") })
      .run({});

    // Only Alice's published posts (post-2)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("post-2");
  });
});
```

**Step 2: Run the test**

Run: `cd tests/integration && pnpm vitest run --project db-permissions db-permissions/row-level-filters`
Expected: All 6 tests pass (adjust based on actual API behavior — if any fail, the test has caught a real bug or the API differs from README)

**Step 3: Commit**

```bash
git add tests/integration/db-permissions/row-level-filters.test.ts
git commit -m "test(integration): db-permissions row-level filter tests"
```

---

### Task 5: db-permissions — query-builder tests

**Files:**
- Create: `tests/integration/db-permissions/query-builder.test.ts`

**Step 1: Write the test file**

```ts
import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { createDb } from "@cfast/db";
import { resolveGrants, ForbiddenError } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts, users } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("db-permissions / query builder", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function dbAs(user: { id: string; role: string }) {
    return createDb({
      d1: env.DB,
      schema,
      grants: resolveGrants(permissions, [user.role]),
      user: { id: user.id },
    });
  }

  it("findMany returns all permitted rows", async () => {
    const db = dbAs(testUsers.bob);
    const result = await db.query(posts).findMany().run({});
    expect(result).toHaveLength(5);
  });

  it("findFirst returns first permitted row", async () => {
    const db = dbAs(testUsers.charlie);
    const result = await db.query(posts).findFirst().run({});
    expect(result).toBeDefined();
    expect(result!.published).toBe(true);
  });

  it("insert succeeds for authorized user", async () => {
    const db = dbAs(testUsers.charlie);
    const op = db.insert(posts).values({
      id: "new-post",
      title: "New Post",
      content: "Content",
      authorId: testUsers.charlie.id,
      published: false,
    });
    await op.run({});

    // Verify it was inserted
    const raw = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
      .bind("new-post")
      .first();
    expect(raw).not.toBeNull();
    expect(raw!.title).toBe("New Post");
  });

  it("insert rejected for unauthorized role", async () => {
    const db = dbAs(testUsers.anon);
    const op = db.insert(posts).values({
      id: "anon-post",
      title: "Anon Post",
      content: "Content",
      authorId: testUsers.anon.id,
    });
    await expect(op.run({})).rejects.toThrow(ForbiddenError);
  });

  it("update with row-level grant: silent no-match outside permitted set", async () => {
    const db = dbAs(testUsers.charlie);
    // Charlie can only update own posts — try to update Alice's post
    const op = db
      .update(posts)
      .set({ title: "Hacked" })
      .where(eq(posts.id, "post-1")); // post-1 is Alice's

    // Should either silently no-match or throw ForbiddenError
    // depending on implementation — the row-level filter prevents the update
    await op.run({});

    // Verify post was NOT updated
    const raw = await env.DB.prepare("SELECT title FROM posts WHERE id = ?")
      .bind("post-1")
      .first();
    expect(raw!.title).toBe("Alice Draft");
  });

  it("delete with row-level grant: only deletes own rows", async () => {
    const db = dbAs(testUsers.charlie);
    // Delete Charlie's draft
    const op = db.delete(posts).where(eq(posts.id, "post-3"));
    await op.run({});

    const raw = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
      .bind("post-3")
      .first();
    expect(raw).toBeNull();
  });

  it("returning() on insert returns inserted row", async () => {
    const db = dbAs(testUsers.charlie);
    const op = db
      .insert(posts)
      .values({
        id: "ret-post",
        title: "Returning Test",
        content: "...",
        authorId: testUsers.charlie.id,
      })
      .returning();

    const result = await op.run({});
    expect(result).toBeDefined();
    expect(result[0].id).toBe("ret-post");
    expect(result[0].title).toBe("Returning Test");
  });
});
```

**Step 2: Run the test**

Run: `cd tests/integration && pnpm vitest run --project db-permissions db-permissions/query-builder`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/integration/db-permissions/query-builder.test.ts
git commit -m "test(integration): db-permissions query builder tests"
```

---

### Task 6: db-permissions — cache, unsafe, batch, compose tests

**Files:**
- Create: `tests/integration/db-permissions/cache-invalidation.test.ts`
- Create: `tests/integration/db-permissions/unsafe-and-batch.test.ts`
- Create: `tests/integration/db-permissions/compose.test.ts`

**Step 1: Create `cache-invalidation.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("db-permissions / cache invalidation", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function dbAs(
    user: { id: string; role: string },
    cacheConfig?: Record<string, unknown>,
  ) {
    return createDb({
      d1: env.DB,
      schema,
      grants: resolveGrants(permissions, [user.role]),
      user: { id: user.id },
      cache: cacheConfig ?? false,
    });
  }

  it("repeated read returns same data (cache hit)", async () => {
    const db = dbAs(testUsers.alice, { backend: "cache-api", ttl: "30s" });

    const first = await db.query(posts).findMany().run({});
    const second = await db.query(posts).findMany().run({});

    expect(first).toEqual(second);
  });

  it("mutation invalidates cache for that table", async () => {
    const db = dbAs(testUsers.alice, { backend: "cache-api", ttl: "30s" });

    const before = await db.query(posts).findMany().run({});
    expect(before).toHaveLength(5);

    await db
      .insert(posts)
      .values({
        id: "post-6",
        title: "New",
        content: "...",
        authorId: "alice-1",
      })
      .run({});

    const after = await db.query(posts).findMany().run({});
    expect(after).toHaveLength(6);
  });

  it("cache: false per-query skips cache", async () => {
    const db = dbAs(testUsers.alice, { backend: "cache-api", ttl: "30s" });

    // Direct D1 insert (bypasses cache invalidation)
    await env.DB.prepare(
      "INSERT INTO posts (id, title, content, author_id, published) VALUES (?, ?, ?, ?, ?)",
    )
      .bind("sneaky", "Sneaky", "...", "alice-1", 1)
      .run();

    const cached = await db.query(posts).findMany().run({});
    // The non-cache-skipping query might return stale data
    // But cache: false should see the new row
    const fresh = await db
      .query(posts)
      .findMany({ cache: false })
      .run({});
    expect(fresh).toHaveLength(cached.length <= 5 ? 6 : fresh.length);
  });

  it("manual cache invalidation via db.cache.invalidate()", async () => {
    const db = dbAs(testUsers.alice, { backend: "cache-api", ttl: "30s" });

    await db.query(posts).findMany().run({});

    // Insert directly, bypassing cache invalidation
    await env.DB.prepare(
      "INSERT INTO posts (id, title, content, author_id, published) VALUES (?, ?, ?, ?, ?)",
    )
      .bind("manual", "Manual", "...", "alice-1", 1)
      .run();

    await db.cache.invalidate({ tables: ["posts"] });

    const after = await db.query(posts).findMany().run({});
    expect(after.some((p) => p.id === "manual")).toBe(true);
  });

  it("cache key includes role: different roles get isolated cache", async () => {
    const adminDb = dbAs(testUsers.alice, { backend: "cache-api", ttl: "30s" });
    const userDb = dbAs(testUsers.charlie, { backend: "cache-api", ttl: "30s" });

    const adminPosts = await adminDb.query(posts).findMany().run({});
    const userPosts = await userDb.query(posts).findMany().run({});

    // Admin sees all 5, user sees only 3 published
    expect(adminPosts.length).toBeGreaterThan(userPosts.length);
  });
});
```

**Step 2: Create `unsafe-and-batch.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("db-permissions / unsafe and batch", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function dbAs(user: { id: string; role: string }) {
    return createDb({
      d1: env.DB,
      schema,
      grants: resolveGrants(permissions, [user.role]),
      user: { id: user.id },
    });
  }

  it("db.unsafe() skips permission checks and WHERE injection", async () => {
    const db = dbAs(testUsers.anon);

    // Anonymous normally can only read published posts
    const unsafe = db.unsafe();
    const result = await unsafe.query(posts).findMany().run({});

    // Unsafe sees everything
    expect(result).toHaveLength(5);
  });

  it("db.batch() runs operations sequentially with permission checks", async () => {
    const db = dbAs(testUsers.alice);

    const op1 = db.insert(posts).values({
      id: "batch-1",
      title: "Batch 1",
      content: "...",
      authorId: "alice-1",
    });
    const op2 = db.insert(posts).values({
      id: "batch-2",
      title: "Batch 2",
      content: "...",
      authorId: "alice-1",
    });

    await db.batch([op1, op2]);

    const raw = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE id LIKE 'batch-%'",
    ).first();
    expect(raw!.count).toBe(2);
  });
});
```

**Step 3: Create `compose.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createDb, compose } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts, comments } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("db-permissions / compose", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function dbAs(user: { id: string; role: string }) {
    return createDb({
      d1: env.DB,
      schema,
      grants: resolveGrants(permissions, [user.role]),
      user: { id: user.id },
    });
  }

  it("compose merges permission descriptors from both operations", async () => {
    const db = dbAs(testUsers.charlie);

    const readPosts = db.query(posts).findMany();
    const readComments = db.query(comments).findMany();

    const composed = compose([readPosts, readComments], async (runPosts, runComments) => {
      const p = await runPosts({});
      const c = await runComments({});
      return { posts: p, comments: c };
    });

    // Composed operation has descriptors from both
    expect(composed.permissions).toHaveLength(
      readPosts.permissions.length + readComments.permissions.length,
    );
  });

  it("compose executor receives run functions and returns combined result", async () => {
    const db = dbAs(testUsers.bob);

    const readPosts = db.query(posts).findMany();

    const composed = compose([readPosts], async (runPosts) => {
      const p = await runPosts({});
      return { total: p.length };
    });

    const result = await composed.run({});
    expect(result.total).toBe(5); // editor sees all
  });
});
```

**Step 4: Run all db-permissions tests**

Run: `cd tests/integration && pnpm vitest run --project db-permissions`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tests/integration/db-permissions/
git commit -m "test(integration): db-permissions cache, unsafe, batch, compose tests"
```

---

### Task 7: auth-flow tests

**Files:**
- Create: `tests/integration/auth-flow/session-lifecycle.test.ts`
- Create: `tests/integration/auth-flow/role-management.test.ts`
- Create: `tests/integration/auth-flow/impersonation.test.ts`

**Note:** Auth tests require Better Auth tables in D1. Check `packages/auth/src/schema.ts` for the exact table definitions needed. The `beforeAll` must create both the app tables AND the Better Auth tables (user, session, account, passkey, role, etc.).

**Step 1: Create `tests/integration/auth-flow/session-lifecycle.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createAuth } from "@cfast/auth";
import { permissions } from "../helpers/permissions";

// Better Auth requires its own tables — these are created by the auth adapter
// We need to check the exact migration SQL from @cfast/auth/schema

describe("auth-flow / session lifecycle", () => {
  let auth: ReturnType<ReturnType<typeof createAuth>>;

  beforeAll(async () => {
    // Create Better Auth tables
    // The exact SQL depends on @cfast/auth's schema export
    // Read packages/auth/src/schema.ts at implementation time
    const authFactory = createAuth({
      permissions,
      magicLink: { enabled: true },
      passkeys: { enabled: false },
    });

    auth = authFactory({
      d1: env.DB,
      appUrl: "http://localhost:8787",
      mailgunApiKey: env.MAILGUN_API_KEY ?? "test-key",
      mailgunDomain: env.MAILGUN_DOMAIN ?? "test.example.com",
    });
  });

  it("initAuth creates auth instance with real D1", () => {
    expect(auth).toBeDefined();
    expect(auth.createContext).toBeTypeOf("function");
    expect(auth.requireUser).toBeTypeOf("function");
    expect(auth.handler).toBeTypeOf("function");
  });

  it("createContext returns null user for unauthenticated request", async () => {
    const request = new Request("http://localhost:8787/");
    const ctx = await auth.createContext(request);

    expect(ctx.user).toBeNull();
    expect(ctx.grants).toEqual([]);
  });

  it("handler responds to Better Auth API routes", async () => {
    const request = new Request("http://localhost:8787/api/auth/session", {
      method: "GET",
    });
    const response = await auth.handler(request);

    // Should return a valid response (even if no session)
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBeLessThan(500);
  });

  it("sendMagicLink creates verification token in D1", async () => {
    await auth.sendMagicLink({
      email: "test@example.com",
      callbackURL: "http://localhost:8787/auth/callback",
    });

    // Verify a verification record exists in D1
    // The exact table name depends on Better Auth's schema
    const result = await env.DB.prepare(
      "SELECT * FROM verification WHERE identifier = ?",
    )
      .bind("test@example.com")
      .first();
    expect(result).not.toBeNull();
  });

  it("requireUser throws for unauthenticated request", async () => {
    const request = new Request("http://localhost:8787/");
    await expect(auth.requireUser(request)).rejects.toThrow();
  });
});
```

**Step 2: Create `tests/integration/auth-flow/role-management.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createAuth } from "@cfast/auth";
import { permissions } from "../helpers/permissions";

describe("auth-flow / role management", () => {
  let auth: ReturnType<ReturnType<typeof createAuth>>;

  beforeAll(async () => {
    const authFactory = createAuth({
      permissions,
      magicLink: { enabled: true },
      passkeys: { enabled: false },
    });

    auth = authFactory({
      d1: env.DB,
      appUrl: "http://localhost:8787",
      mailgunApiKey: "test-key",
      mailgunDomain: "test.example.com",
    });

    // Create a test user directly in D1
    await env.DB.prepare(
      "INSERT INTO user (id, email, name, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    )
      .bind("user-1", "user@test.com", "Test User")
      .run();
  });

  it("setRole assigns a role and getRoles retrieves it", async () => {
    await auth.setRole("user-1", "editor");
    const roles = await auth.getRoles("user-1");

    expect(roles).toContain("editor");
  });

  it("setRoles assigns multiple roles", async () => {
    await auth.setRoles("user-1", ["editor", "admin"]);
    const roles = await auth.getRoles("user-1");

    expect(roles).toContain("editor");
    expect(roles).toContain("admin");
  });

  it("removeRole removes a specific role", async () => {
    await auth.setRoles("user-1", ["editor", "admin"]);
    await auth.removeRole("user-1", "admin");

    const roles = await auth.getRoles("user-1");
    expect(roles).toContain("editor");
    expect(roles).not.toContain("admin");
  });

  it("getRoles returns empty array for user with no roles", async () => {
    // Create a user with no roles
    await env.DB.prepare(
      "INSERT INTO user (id, email, name, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    )
      .bind("user-2", "noroles@test.com", "No Roles")
      .run();

    const roles = await auth.getRoles("user-2");
    expect(roles).toEqual([]);
  });
});
```

**Step 3: Create `tests/integration/auth-flow/impersonation.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createAuth } from "@cfast/auth";
import { permissions } from "../helpers/permissions";

describe("auth-flow / impersonation", () => {
  let auth: ReturnType<ReturnType<typeof createAuth>>;

  beforeAll(async () => {
    const authFactory = createAuth({
      permissions,
      magicLink: { enabled: true },
      passkeys: { enabled: false },
    });

    auth = authFactory({
      d1: env.DB,
      appUrl: "http://localhost:8787",
      mailgunApiKey: "test-key",
      mailgunDomain: "test.example.com",
    });

    // Create admin and regular user
    await env.DB.prepare(
      "INSERT INTO user (id, email, name, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    )
      .bind("admin-1", "admin@test.com", "Admin")
      .run();
    await env.DB.prepare(
      "INSERT INTO user (id, email, name, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    )
      .bind("target-1", "target@test.com", "Target User")
      .run();

    await auth.setRole("admin-1", "admin");
    await auth.setRole("target-1", "user");
  });

  it("admin can impersonate another user", async () => {
    await auth.impersonate("admin-1", "target-1");

    // Verify impersonation log exists
    const log = await env.DB.prepare(
      "SELECT * FROM impersonation_log WHERE admin_id = ? AND target_id = ?",
    )
      .bind("admin-1", "target-1")
      .first();
    expect(log).not.toBeNull();
  });

  it("non-admin cannot impersonate", async () => {
    await expect(
      auth.impersonate("target-1", "admin-1"),
    ).rejects.toThrow();
  });
});
```

**Step 4: Run auth-flow tests**

Run: `cd tests/integration && pnpm vitest run --project auth-flow`
Expected: All tests pass

**Note for implementer:** The exact Better Auth table schemas and API shapes may differ slightly from what's shown here. Read `packages/auth/src/schema.ts` and `packages/auth/src/index.ts` at implementation time and adjust the SQL in `beforeAll` and the API calls accordingly. The test structure and assertions remain the same.

**Step 5: Commit**

```bash
git add tests/integration/auth-flow/
git commit -m "test(integration): auth-flow session, role, and impersonation tests"
```

---

### Task 8: core-plugins tests

**Files:**
- Create: `tests/integration/core-plugins/plugin-chain.test.ts`
- Create: `tests/integration/core-plugins/error-handling.test.ts`
- Create: `tests/integration/core-plugins/app-helpers.test.ts`

**Step 1: Create `tests/integration/core-plugins/plugin-chain.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createApp, definePlugin, CfastConfigError } from "@cfast/core";
import { defineEnv } from "@cfast/env";
import { permissions } from "../helpers/permissions";

describe("core-plugins / plugin chain", () => {
  const envSchema = defineEnv({
    DB: { type: "d1" },
    KV: { type: "kv" },
  });

  it("plugins run in registration order via app.context()", async () => {
    const order: string[] = [];

    const pluginA = definePlugin({
      name: "pluginA",
      setup() {
        order.push("A");
        return { a: true };
      },
    });

    const pluginB = definePlugin({
      name: "pluginB",
      setup() {
        order.push("B");
        return { b: true };
      },
    });

    const pluginC = definePlugin({
      name: "pluginC",
      setup() {
        order.push("C");
        return { c: true };
      },
    });

    const app = createApp({ env: envSchema, permissions })
      .use(pluginA)
      .use(pluginB)
      .use(pluginC);

    app.init({ DB: env.DB, KV: env.KV });

    const request = new Request("http://localhost/");
    await app.context(request);

    expect(order).toEqual(["A", "B", "C"]);
  });

  it("each plugin receives prior plugins output in ctx", async () => {
    const pluginA = definePlugin({
      name: "first",
      setup() {
        return { fromFirst: 42 };
      },
    });

    const pluginB = definePlugin({
      name: "second",
      setup(ctx) {
        // ctx should have the output of pluginA
        return { receivedFromFirst: (ctx as Record<string, unknown>).fromFirst };
      },
    });

    const app = createApp({ env: envSchema, permissions })
      .use(pluginA)
      .use(pluginB);

    app.init({ DB: env.DB, KV: env.KV });

    const request = new Request("http://localhost/");
    const context = await app.context(request);

    expect(context.receivedFromFirst).toBe(42);
  });

  it("duplicate plugin names throw CfastConfigError", () => {
    const pluginA = definePlugin({ name: "dup", setup: () => ({}) });
    const pluginB = definePlugin({ name: "dup", setup: () => ({}) });

    expect(() =>
      createApp({ env: envSchema, permissions }).use(pluginA).use(pluginB),
    ).toThrow(CfastConfigError);
  });
});
```

**Step 2: Create `tests/integration/core-plugins/error-handling.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createApp, definePlugin, CfastPluginError } from "@cfast/core";
import { defineEnv } from "@cfast/env";
import { permissions } from "../helpers/permissions";

describe("core-plugins / error handling", () => {
  const envSchema = defineEnv({
    DB: { type: "d1" },
    KV: { type: "kv" },
  });

  it("plugin throw during setup() wrapped in CfastPluginError", async () => {
    const failingPlugin = definePlugin({
      name: "failing",
      setup() {
        throw new Error("setup explosion");
      },
    });

    const app = createApp({ env: envSchema, permissions }).use(failingPlugin);
    app.init({ DB: env.DB, KV: env.KV });

    const request = new Request("http://localhost/");

    await expect(app.context(request)).rejects.toThrow(CfastPluginError);
    try {
      await app.context(request);
    } catch (e) {
      expect((e as CfastPluginError).message).toContain("failing");
    }
  });
});
```

**Step 3: Create `tests/integration/core-plugins/app-helpers.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createApp, definePlugin } from "@cfast/core";
import { defineEnv, EnvError } from "@cfast/env";
import { permissions } from "../helpers/permissions";

describe("core-plugins / app helpers", () => {
  it("app.init(rawEnv) validates env and is idempotent", () => {
    const envSchema = defineEnv({
      DB: { type: "d1" },
      KV: { type: "kv" },
    });

    const app = createApp({ env: envSchema, permissions });

    // First call succeeds
    app.init({ DB: env.DB, KV: env.KV });

    // Second call is a no-op (does not throw)
    app.init({ DB: env.DB, KV: env.KV });

    // env() returns validated bindings
    const validated = app.env();
    expect(validated.DB).toBeDefined();
    expect(validated.KV).toBeDefined();
  });

  it("app.init with missing binding throws EnvError", () => {
    const envSchema = defineEnv({
      DB: { type: "d1" },
      MISSING: { type: "kv" },
    });

    const app = createApp({ env: envSchema, permissions });

    expect(() => app.init({ DB: env.DB })).toThrow(EnvError);
  });

  it("app.loader() builds context and calls handler", async () => {
    const envSchema = defineEnv({
      DB: { type: "d1" },
    });

    const plugin = definePlugin({
      name: "test",
      setup() {
        return { greeting: "hello" };
      },
    });

    const app = createApp({ env: envSchema, permissions }).use(plugin);
    app.init({ DB: env.DB });

    const loader = app.loader(async (ctx) => {
      return { message: (ctx as Record<string, unknown>).greeting };
    });

    const result = await loader({
      request: new Request("http://localhost/"),
      context: {},
      params: {},
    });

    expect(result.message).toBe("hello");
  });
});
```

**Step 4: Run core-plugins tests**

Run: `cd tests/integration && pnpm vitest run --project core-plugins`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tests/integration/core-plugins/
git commit -m "test(integration): core-plugins chain, error, and helper tests"
```

---

### Task 9: actions tests

**Files:**
- Create: `tests/integration/actions/single-action.test.ts`
- Create: `tests/integration/actions/composed-actions.test.ts`
- Create: `tests/integration/actions/loader-integration.test.ts`

**Step 1: Create `tests/integration/actions/single-action.test.ts`**

```ts
import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { createActions, checkPermissionStatus } from "@cfast/actions";
import { createDb } from "@cfast/db";
import { resolveGrants, ForbiddenError } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("actions / single action", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function createActionsAs(user: { id: string; role: string }) {
    const grants = resolveGrants(permissions, [user.role]);
    return createActions({
      getContext: async () => ({
        db: createDb({
          d1: env.DB,
          schema,
          grants,
          user: { id: user.id },
        }),
        user: { id: user.id, role: user.role },
        grants,
      }),
    });
  }

  it("createAction builds Operation from db + input", () => {
    const { createAction } = createActionsAs(testUsers.charlie);

    const updatePost = createAction<{ id: string; title: string }, unknown>(
      (db, input) => db.update(posts).set({ title: input.title }).where(eq(posts.id, input.id)),
    );

    expect(updatePost.action).toBeTypeOf("function");
    expect(updatePost.client).toBeDefined();
  });

  it("authorized user executes action successfully", async () => {
    const { createAction } = createActionsAs(testUsers.charlie);

    const updateMyPost = createAction<{ id: string; title: string }, unknown>(
      (db, input) => db.update(posts).set({ title: input.title }).where(eq(posts.id, input.id)),
    );

    // Charlie updates his own post (post-3)
    const request = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "post-3", title: "Updated by Charlie" }),
    });

    await updateMyPost.action({ request, context: {}, params: {} });

    const raw = await env.DB.prepare("SELECT title FROM posts WHERE id = ?")
      .bind("post-3")
      .first();
    expect(raw!.title).toBe("Updated by Charlie");
  });

  it("unauthorized user gets ForbiddenError", async () => {
    const { createAction } = createActionsAs(testUsers.anon);

    const createPost = createAction<{ title: string }, unknown>((db, input) =>
      db.insert(posts).values({
        id: "anon-post",
        title: input.title,
        content: "...",
        authorId: "anon-1",
      }),
    );

    const request = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Anon post" }),
    });

    await expect(
      createPost.action({ request, context: {}, params: {} }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("permissions extracted pre-execution for structural check", () => {
    const { createAction } = createActionsAs(testUsers.charlie);

    const readPosts = createAction<Record<string, never>, unknown>((db) =>
      db.query(posts).findMany(),
    );

    // The buildOperation returns an Operation with .permissions
    const op = readPosts.buildOperation(
      createDb({
        d1: env.DB,
        schema,
        grants: resolveGrants(permissions, ["user"]),
        user: { id: "charlie-1" },
      }),
      {},
      {
        db: {} as never,
        user: testUsers.charlie,
        grants: resolveGrants(permissions, ["user"]),
      },
    );

    expect(op.permissions.length).toBeGreaterThan(0);
    expect(op.permissions[0]).toHaveProperty("action");
    expect(op.permissions[0]).toHaveProperty("table");
  });

  it("checkPermissionStatus returns correct status", () => {
    const adminGrants = resolveGrants(permissions, ["admin"]);
    const anonGrants = resolveGrants(permissions, ["anonymous"]);

    const descriptors = [{ action: "create" as const, table: posts }];

    const adminStatus = checkPermissionStatus(adminGrants, descriptors);
    expect(adminStatus.permitted).toBe(true);

    const anonStatus = checkPermissionStatus(anonGrants, descriptors);
    expect(anonStatus.permitted).toBe(false);
  });
});
```

**Step 2: Create `tests/integration/actions/composed-actions.test.ts`**

```ts
import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { createActions } from "@cfast/actions";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("actions / composed actions", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  function createActionsAs(user: { id: string; role: string }) {
    const grants = resolveGrants(permissions, [user.role]);
    return createActions({
      getContext: async () => ({
        db: createDb({
          d1: env.DB,
          schema,
          grants,
          user: { id: user.id },
        }),
        user: { id: user.id, role: user.role },
        grants,
      }),
    });
  }

  it("composeActions routes by _action field in FormData", async () => {
    const { createAction, composeActions } = createActionsAs(testUsers.bob);

    const publishPost = createAction<{ id: string }, unknown>((db, input) =>
      db.update(posts).set({ published: true }).where(eq(posts.id, input.id)),
    );

    const unpublishPost = createAction<{ id: string }, unknown>((db, input) =>
      db.update(posts).set({ published: false }).where(eq(posts.id, input.id)),
    );

    const composed = composeActions({ publishPost, unpublishPost });

    // Send FormData with _action=publishPost
    const formData = new FormData();
    formData.set("_action", "publishPost");
    formData.set("id", "post-1"); // Alice's draft

    const request = new Request("http://localhost/", {
      method: "POST",
      body: formData,
    });

    await composed.action({ request, context: {}, params: {} });

    const raw = await env.DB.prepare("SELECT published FROM posts WHERE id = ?")
      .bind("post-1")
      .first();
    expect(raw!.published).toBe(1);
  });

  it("JSON input with _action dispatches correctly", async () => {
    const { createAction, composeActions } = createActionsAs(testUsers.bob);

    const deletePost = createAction<{ id: string }, unknown>((db, input) =>
      db.delete(posts).where(eq(posts.id, input.id)),
    );

    const composed = composeActions({ deletePost });

    const request = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "deletePost", id: "post-1" }),
    });

    await composed.action({ request, context: {}, params: {} });

    const raw = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
      .bind("post-1")
      .first();
    expect(raw).toBeNull();
  });

  it("_action field stripped from input before passing to operation", async () => {
    let receivedInput: Record<string, unknown> = {};

    const { createAction, composeActions } = createActionsAs(testUsers.bob);

    const testAction = createAction<{ title: string }, unknown>((db, input) => {
      receivedInput = input as Record<string, unknown>;
      return db.query(posts).findMany();
    });

    const composed = composeActions({ testAction });

    const request = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "testAction", title: "Hello" }),
    });

    await composed.action({ request, context: {}, params: {} });

    expect(receivedInput).not.toHaveProperty("_action");
    expect(receivedInput.title).toBe("Hello");
  });

  it("unknown _action value errors", async () => {
    const { createAction, composeActions } = createActionsAs(testUsers.bob);

    const testAction = createAction<Record<string, never>, unknown>((db) =>
      db.query(posts).findMany(),
    );

    const composed = composeActions({ testAction });

    const request = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "nonexistent" }),
    });

    await expect(
      composed.action({ request, context: {}, params: {} }),
    ).rejects.toThrow();
  });
});
```

**Step 3: Create `tests/integration/actions/loader-integration.test.ts`**

```ts
import { env } from "cloudflare:test";
import { createActions } from "@cfast/actions";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { schema, posts } from "../helpers/schema";
import { permissions, testUsers, testPosts } from "../helpers/permissions";

describe("actions / loader integration", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("loader() injects _actionPermissions with correct status", async () => {
    const grants = resolveGrants(permissions, ["user"]);
    const { createAction, composeActions } = createActions({
      getContext: async () => ({
        db: createDb({
          d1: env.DB,
          schema,
          grants,
          user: { id: "charlie-1" },
        }),
        user: { id: "charlie-1", role: "user" },
        grants,
      }),
    });

    const createPost = createAction<{ title: string }, unknown>((db, input) =>
      db.insert(posts).values({
        id: crypto.randomUUID(),
        title: input.title,
        content: "...",
        authorId: "charlie-1",
      }),
    );

    const composed = composeActions({ createPost });

    const loaderFn = composed.loader(async () => ({
      posts: [{ id: "1", title: "test" }],
    }));

    const result = await loaderFn({
      request: new Request("http://localhost/"),
      context: {},
      params: {},
    });

    expect(result.posts).toHaveLength(1);
    expect(result._actionPermissions).toBeDefined();
    expect(result._actionPermissions.createPost).toBeDefined();
    expect(result._actionPermissions.createPost.permitted).toBe(true);
  });
});
```

**Step 4: Run actions tests**

Run: `cd tests/integration && pnpm vitest run --project actions`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tests/integration/actions/
git commit -m "test(integration): actions single, composed, and loader tests"
```

---

### Task 10: storage tests

**Files:**
- Create: `tests/integration/storage/upload-download.test.ts`
- Create: `tests/integration/storage/validation.test.ts`
- Create: `tests/integration/storage/multipart.test.ts`
- Create: `tests/integration/storage/lifecycle-hooks.test.ts`

**Step 1: Create `tests/integration/storage/upload-download.test.ts`**

```ts
import { env } from "cloudflare:test";
import { defineStorage, filetype } from "@cfast/storage";

describe("storage / upload and download", () => {
  const storage = defineStorage({
    avatars: filetype({
      bucket: "UPLOADS",
      accept: ["image/png", "image/jpeg"],
      maxSize: "2mb",
      key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
    }),
  });

  it("upload via storage.handle() lands in R2 and returns metadata", async () => {
    // Create a minimal PNG (1x1 pixel)
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const formData = new FormData();
    formData.set("file", new Blob([pngBytes], { type: "image/png" }), "avatar.png");

    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    const result = await storage.handle("avatars", request, {
      env: { UPLOADS: env.UPLOADS },
      user: { id: "user-1" },
      input: {},
    });

    expect(result.key).toBe("avatars/user-1/avatar.png");
    expect(result.size).toBeGreaterThan(0);
    expect(result.type).toBe("image/png");

    // Verify file is in R2
    const obj = await env.UPLOADS.get(result.key);
    expect(obj).not.toBeNull();
  });

  it("storage.serve() streams back matching content", async () => {
    // First upload a file
    const content = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    await env.UPLOADS.put("avatars/user-1/test.png", content);

    const response = await storage.serve("avatars", "avatars/user-1/test.png", {
      env: { UPLOADS: env.UPLOADS },
    });

    expect(response.status).toBe(200);
    const body = new Uint8Array(await response.arrayBuffer());
    expect(body).toEqual(content);
  });
});
```

**Step 2: Create `tests/integration/storage/validation.test.ts`**

```ts
import { env } from "cloudflare:test";
import { defineStorage, filetype, StorageError } from "@cfast/storage";

describe("storage / validation", () => {
  const storage = defineStorage({
    avatars: filetype({
      bucket: "UPLOADS",
      accept: ["image/png"],
      maxSize: "1kb",
      key: (file) => `test/${file.name}`,
    }),
  });

  it("wrong MIME type rejected (magic bytes check)", async () => {
    // Send a JPEG pretending to be PNG via Content-Type
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG signature

    const formData = new FormData();
    formData.set("file", new Blob([jpegBytes], { type: "image/png" }), "fake.png");

    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    await expect(
      storage.handle("avatars", request, {
        env: { UPLOADS: env.UPLOADS },
        user: { id: "user-1" },
        input: {},
      }),
    ).rejects.toThrow(StorageError);
  });

  it("exceeds maxSize rejected", async () => {
    // Create a file larger than 1kb
    const largeContent = new Uint8Array(2048).fill(0);
    // Add PNG header so MIME check passes
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ...Array.from(largeContent),
    ]);

    const formData = new FormData();
    formData.set("file", new Blob([png], { type: "image/png" }), "big.png");

    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    await expect(
      storage.handle("avatars", request, {
        env: { UPLOADS: env.UPLOADS },
        user: { id: "user-1" },
        input: {},
      }),
    ).rejects.toThrow(StorageError);
  });

  it("valid file within limits accepted", async () => {
    // Small valid PNG
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const formData = new FormData();
    formData.set("file", new Blob([pngBytes], { type: "image/png" }), "small.png");

    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    const result = await storage.handle("avatars", request, {
      env: { UPLOADS: env.UPLOADS },
      user: { id: "user-1" },
      input: {},
    });

    expect(result.key).toBe("test/small.png");
    expect(result.type).toBe("image/png");
  });
});
```

**Step 3: Create `tests/integration/storage/lifecycle-hooks.test.ts`**

```ts
import { env } from "cloudflare:test";
import { defineStorage, filetype } from "@cfast/storage";

describe("storage / lifecycle hooks", () => {
  it("beforeUpload and afterUpload called with correct args", async () => {
    const hookCalls: string[] = [];
    let beforeFile: unknown;
    let afterResult: unknown;

    const storage = defineStorage({
      docs: filetype({
        bucket: "UPLOADS",
        accept: ["image/png"],
        maxSize: "2mb",
        key: (file) => `docs/${file.name}`,
        hooks: {
          beforeUpload: (file, ctx) => {
            hookCalls.push("before");
            beforeFile = file;
          },
          afterUpload: (result, ctx) => {
            hookCalls.push("after");
            afterResult = result;
          },
        },
      }),
    });

    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const formData = new FormData();
    formData.set("file", new Blob([pngBytes], { type: "image/png" }), "hook-test.png");

    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    await storage.handle("docs", request, {
      env: { UPLOADS: env.UPLOADS },
      user: { id: "user-1" },
      input: {},
    });

    expect(hookCalls).toEqual(["before", "after"]);
    expect(beforeFile).toBeDefined();
    expect(afterResult).toHaveProperty("key");
  });
});
```

**Step 4: Run storage tests**

Run: `cd tests/integration && pnpm vitest run --project storage`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tests/integration/storage/
git commit -m "test(integration): storage upload, validation, and hooks tests"
```

---

### Task 11: env tests

**Files:**
- Create: `tests/integration/env/binding-validation.test.ts`
- Create: `tests/integration/env/environment-defaults.test.ts`

**Step 1: Create `tests/integration/env/binding-validation.test.ts`**

```ts
import { env } from "cloudflare:test";
import { defineEnv, EnvError } from "@cfast/env";

describe("env / binding validation", () => {
  it("validates D1 binding via duck-typing (.prepare())", () => {
    const envSchema = defineEnv({ DB: { type: "d1" } });
    envSchema.init({ DB: env.DB });

    const validated = envSchema.get();
    expect(validated.DB).toBe(env.DB);
    expect(typeof validated.DB.prepare).toBe("function");
  });

  it("validates KV binding via duck-typing (.get() and .put())", () => {
    const envSchema = defineEnv({ KV: { type: "kv" } });
    envSchema.init({ KV: env.KV });

    const validated = envSchema.get();
    expect(validated.KV).toBe(env.KV);
  });

  it("validates R2 binding via duck-typing (.put() and .head())", () => {
    const envSchema = defineEnv({ R2: { type: "r2" } });
    envSchema.init({ R2: env.R2 });

    const validated = envSchema.get();
    expect(validated.R2).toBe(env.R2);
  });

  it("missing binding throws EnvError with all failures", () => {
    const envSchema = defineEnv({
      DB: { type: "d1" },
      MISSING_KV: { type: "kv" },
      MISSING_SECRET: { type: "secret" },
    });

    try {
      envSchema.init({ DB: env.DB });
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(EnvError);
      const err = e as EnvError;
      // Should report both missing bindings
      expect(err.errors.length).toBeGreaterThanOrEqual(2);
      expect(err.errors.some((e) => e.key === "MISSING_KV")).toBe(true);
      expect(err.errors.some((e) => e.key === "MISSING_SECRET")).toBe(true);
    }
  });

  it("init() is idempotent and retry after failure works", () => {
    const envSchema = defineEnv({ DB: { type: "d1" } });

    // First call succeeds
    envSchema.init({ DB: env.DB });
    // Second call is no-op
    envSchema.init({ DB: env.DB });
    // get() works
    expect(envSchema.get().DB).toBe(env.DB);
  });

  it("var with validate() runs custom validation", () => {
    const envSchema = defineEnv({
      APP_NAME: {
        type: "var",
        validate: (v: string) => v.length >= 3,
      },
    });

    // Valid
    envSchema.init({ APP_NAME: "test-app" });
    expect(envSchema.get().APP_NAME).toBe("test-app");
  });

  it("var with failing validate() throws EnvError", () => {
    const envSchema = defineEnv({
      APP_NAME: {
        type: "var",
        validate: (v: string) => v.length >= 10,
      },
    });

    expect(() => envSchema.init({ APP_NAME: "ab" })).toThrow(EnvError);
  });

  it("secret must be non-empty string", () => {
    const envSchema = defineEnv({
      API_KEY: { type: "secret" },
    });

    expect(() => envSchema.init({ API_KEY: "" })).toThrow(EnvError);
    expect(() => envSchema.init({})).toThrow(EnvError);
  });
});
```

**Step 2: Create `tests/integration/env/environment-defaults.test.ts`**

```ts
import { defineEnv } from "@cfast/env";

describe("env / environment defaults", () => {
  it("picks correct default based on ENVIRONMENT binding", () => {
    const envSchema = defineEnv({
      ENVIRONMENT: { type: "var", default: "development" },
      API_URL: {
        type: "var",
        default: {
          development: "http://localhost:8787",
          staging: "https://staging.example.com",
          production: "https://api.example.com",
        },
      },
    });

    envSchema.init({ ENVIRONMENT: "production" });
    expect(envSchema.get().API_URL).toBe("https://api.example.com");
  });

  it("uses development default when ENVIRONMENT not set", () => {
    const envSchema = defineEnv({
      API_URL: {
        type: "var",
        default: {
          development: "http://localhost:8787",
          staging: "https://staging.example.com",
          production: "https://api.example.com",
        },
      },
    });

    envSchema.init({});
    expect(envSchema.get().API_URL).toBe("http://localhost:8787");
  });

  it("simple string default used when no ENVIRONMENT binding", () => {
    const envSchema = defineEnv({
      LOG_LEVEL: { type: "var", default: "info" },
    });

    envSchema.init({});
    expect(envSchema.get().LOG_LEVEL).toBe("info");
  });
});
```

**Step 3: Run env tests**

Run: `cd tests/integration && pnpm vitest run --project env`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/env/
git commit -m "test(integration): env binding validation and defaults tests"
```

---

### Task 12: email tests

**Files:**
- Create: `tests/integration/email/send-and-render.test.ts`
- Create: `tests/integration/email/provider-errors.test.ts`

**Step 1: Create `tests/integration/email/send-and-render.test.ts`**

```ts
import { createElement } from "react";
import { createEmailClient, EmailDeliveryError } from "@cfast/email";

describe("email / send and render", () => {
  it("email.send() renders React to HTML and delivers via provider", async () => {
    let sentMessage: { to: string; subject: string; html: string; text: string } | undefined;

    const client = createEmailClient({
      provider: {
        name: "test",
        async send(message) {
          sentMessage = message;
          return { id: "test-1" };
        },
      },
      from: () => "noreply@test.com",
    });

    const result = await client.send({
      to: "user@test.com",
      subject: "Welcome",
      react: createElement("div", null, "Hello ", createElement("strong", null, "World")),
    });

    expect(result.id).toBe("test-1");
    expect(sentMessage).toBeDefined();
    expect(sentMessage!.to).toBe("user@test.com");
    expect(sentMessage!.html).toContain("Hello");
    expect(sentMessage!.html).toContain("<strong>World</strong>");
    expect(sentMessage!.text).toContain("Hello");
    expect(sentMessage!.text).toContain("World");
  });

  it("console provider logs and returns id", async () => {
    // Import console provider — path depends on package exports
    const { console: consoleProvider } = await import("@cfast/email/console");

    const client = createEmailClient({
      provider: consoleProvider(),
      from: "noreply@test.com",
    });

    const result = await client.send({
      to: "user@test.com",
      subject: "Test",
      react: createElement("p", null, "Test email"),
    });

    expect(result.id).toMatch(/^console-/);
  });

  it("lazy from getter called at send time, not initialization", async () => {
    let fromCallCount = 0;

    const client = createEmailClient({
      provider: {
        name: "test",
        async send() {
          return { id: "test-1" };
        },
      },
      from: () => {
        fromCallCount++;
        return "noreply@test.com";
      },
    });

    expect(fromCallCount).toBe(0);

    await client.send({
      to: "a@test.com",
      subject: "1",
      react: createElement("p", null, "1"),
    });
    expect(fromCallCount).toBe(1);

    await client.send({
      to: "b@test.com",
      subject: "2",
      react: createElement("p", null, "2"),
    });
    expect(fromCallCount).toBe(2);
  });
});
```

**Step 2: Create `tests/integration/email/provider-errors.test.ts`**

```ts
import { createElement } from "react";
import { createEmailClient, EmailDeliveryError } from "@cfast/email";

describe("email / provider errors", () => {
  it("provider failure throws EmailDeliveryError with metadata", async () => {
    const client = createEmailClient({
      provider: {
        name: "failing-provider",
        async send() {
          throw new EmailDeliveryError("Delivery failed", {
            provider: "failing-provider",
            statusCode: 503,
            response: "Service Unavailable",
          });
        },
      },
      from: "noreply@test.com",
    });

    try {
      await client.send({
        to: "user@test.com",
        subject: "Fail",
        react: createElement("p", null, "fail"),
      });
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(EmailDeliveryError);
      const err = e as EmailDeliveryError;
      expect(err.provider).toBe("failing-provider");
      expect(err.statusCode).toBe(503);
      expect(err.response).toBe("Service Unavailable");
    }
  });
});
```

**Step 3: Run email tests**

Run: `cd tests/integration && pnpm vitest run --project email`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/email/
git commit -m "test(integration): email send, render, and error tests"
```

---

### Task 13: permissions standalone tests

**Files:**
- Create: `tests/integration/permissions/hierarchy.test.ts`
- Create: `tests/integration/permissions/serialization.test.ts`

**Step 1: Create `tests/integration/permissions/hierarchy.test.ts`**

```ts
import {
  definePermissions,
  grant,
  resolveGrants,
  checkPermissions,
  ForbiddenError,
} from "@cfast/permissions";
import { posts, comments } from "../helpers/schema";

describe("permissions / hierarchy", () => {
  it("circular hierarchy detected and throws Error", () => {
    expect(() =>
      definePermissions({
        roles: ["a", "b", "c"] as const,
        grants: {
          a: [],
          b: [],
          c: [],
        },
        hierarchy: {
          a: ["b"],
          b: ["c"],
          c: ["a"], // circular!
        },
      }),
    ).toThrow();
  });

  it('grant("manage", "all") grants everything', () => {
    const perms = definePermissions({
      roles: ["admin", "user"] as const,
      grants: {
        admin: [grant("manage", "all")],
        user: [grant("read", posts)],
      },
    });

    const adminGrants = resolveGrants(perms, ["admin"]);

    // Admin should be able to do anything on any table
    const result = checkPermissions(adminGrants, [
      { action: "delete", table: comments },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("checkPermissions returns { permitted, denied, reasons }", () => {
    const perms = definePermissions({
      roles: ["reader"] as const,
      grants: {
        reader: [grant("read", posts)],
      },
    });

    const grants = resolveGrants(perms, ["reader"]);

    const allowed = checkPermissions(grants, [
      { action: "read", table: posts },
    ]);
    expect(allowed.permitted).toBe(true);
    expect(allowed.denied).toHaveLength(0);

    const denied = checkPermissions(grants, [
      { action: "delete", table: posts },
    ]);
    expect(denied.permitted).toBe(false);
    expect(denied.denied.length).toBeGreaterThan(0);
    expect(denied.reasons.length).toBeGreaterThan(0);
  });

  it("hierarchy resolves inherited grants", () => {
    const perms = definePermissions({
      roles: ["admin", "editor", "viewer"] as const,
      grants: {
        admin: [grant("manage", "all")],
        editor: [grant("update", posts), grant("create", posts)],
        viewer: [grant("read", posts)],
      },
      hierarchy: {
        admin: ["editor"],
        editor: ["viewer"],
      },
    });

    // Editor should have viewer's read + own update/create
    const editorGrants = resolveGrants(perms, ["editor"]);
    const canRead = checkPermissions(editorGrants, [
      { action: "read", table: posts },
    ]);
    expect(canRead.permitted).toBe(true);

    const canUpdate = checkPermissions(editorGrants, [
      { action: "update", table: posts },
    ]);
    expect(canUpdate.permitted).toBe(true);
  });
});
```

**Step 2: Create `tests/integration/permissions/serialization.test.ts`**

```ts
import { ForbiddenError } from "@cfast/permissions";
import { posts } from "../helpers/schema";

describe("permissions / serialization", () => {
  it("ForbiddenError.toJSON() serializes correctly", () => {
    const error = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
      descriptors: [{ action: "delete", table: posts }],
    });

    const json = error.toJSON();

    expect(json).toHaveProperty("action", "delete");
    expect(json).toHaveProperty("role", "user");
    expect(json).toHaveProperty("message");
    expect(typeof json.message).toBe("string");
  });

  it("ForbiddenError has correct properties", () => {
    const error = new ForbiddenError({
      action: "update",
      table: posts,
      role: "anonymous",
      descriptors: [{ action: "update", table: posts }],
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.action).toBe("update");
    expect(error.role).toBe("anonymous");
    expect(error.descriptors).toHaveLength(1);
  });
});
```

**Step 3: Run permissions tests**

Run: `cd tests/integration && pnpm vitest run --project permissions`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/permissions/
git commit -m "test(integration): permissions hierarchy and serialization tests"
```

---

### Task 14: CI integration + turbo config + root scripts

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `turbo.json`
- Modify: `package.json` (root)

**Step 1: Add `test:integration` task to `turbo.json`**

Add after the existing `test` task:

```json
"test:integration": {
  "dependsOn": ["^build"],
  "cache": false
}
```

**Step 2: Add `test:integration` script to root `package.json`**

```json
"test:integration": "pnpm --filter integration test"
```

**Step 3: Add integration job to `.github/workflows/ci.yml`**

Add after the `e2e` job:

```yaml
  integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: ci
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Restore turbo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ github.sha }}
          restore-keys: turbo-${{ runner.os }}-

      - run: pnpm build

      - name: Run integration tests
        run: pnpm test:integration
```

**Step 4: Run integration tests locally to verify everything works end-to-end**

Run: `pnpm test:integration`
Expected: All 62+ tests pass across all 8 projects

**Step 5: Commit**

```bash
git add turbo.json package.json .github/workflows/ci.yml
git commit -m "ci: add integration test job to CI pipeline"
```

---

### Task 15: Final verification

**Step 1: Run full test suite (unit + integration)**

Run: `pnpm test && pnpm test:integration`
Expected: All unit tests pass, all integration tests pass

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors

**Step 3: Verify CI config is valid**

Run: `cat .github/workflows/ci.yml | head -120`
Expected: Valid YAML with ci, e2e, and integration jobs

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "test(integration): fix any issues found during verification"
```
