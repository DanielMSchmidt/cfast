# @cfast/db

**Lazy, permission-aware, cached Drizzle operations for Cloudflare D1. Your queries carry their permissions with them.**

`@cfast/db` wraps Drizzle ORM and returns lazy `Operation` objects instead of promises. An `Operation` knows which permissions it requires and can be inspected, composed, and executed — in that order. When you call `.run()`, permissions are checked first. If denied, a `ForbiddenError` is thrown before any SQL touches the database.

This is application-level Row-Level Security for D1 (which has no native RLS). It's not a separate layer you have to remember to apply. It's the return type of every query.

On top of permissions, `@cfast/db` provides a transparent caching layer using Cloudflare's Cache API or KV. Cache keys are permission-aware: an anonymous user's cached result is never served to an editor.

## Design Goals

- **Lazy by default.** Building a query does not execute it. You get an `Operation` with `.permissions` and `.run()`. You decide when to inspect and when to execute.
- **Permissions are not optional.** You cannot accidentally query without permission checks. The escape hatch (`db.unsafe()`) is explicit and loud.
- **Single source of truth.** The operation *is* the permission declaration. No separate `requires` block that can drift from your actual queries.
- **Prepared statements for free.** Operations use Drizzle's `sql.placeholder()` and compile to prepared statements internally. You get query plan caching without thinking about it.
- **Composable.** Multiple operations can be combined with `compose()`. Their permissions merge. A single `.run()` checks everything upfront, then executes.
- **Drizzle-native.** You still write Drizzle queries. You still use Drizzle's type system. This is Drizzle with permissions and laziness injected, not a different ORM.
- **Cached by default, correct by construction.** Read queries are cached automatically. Cache keys incorporate the user's role and the applied permission filters, so cache poisoning across roles is structurally impossible.
- **D1-optimized.** Respects D1's SQLite dialect, batch API, and transaction semantics.

## API

### `createDb(config)`

Creates a permission-aware database instance.

```typescript
import { createDb } from "@cfast/db";
import { permissions } from "./permissions";
import * as schema from "./schema";

const db = createDb({
  d1: env.DB,
  schema,
  permissions,
  user: currentUser, // from @cfast/auth — determines which permissions apply
  cache: {
    backend: "cache-api", // "cache-api" | "kv" | false
  },
});
```

**Parameters:**

| Field | Type | Required | Description |
|---|---|---|---|
| `d1` | `D1Database` | Yes | Your Cloudflare D1 binding. |
| `schema` | `Record<string, Table>` | Yes | Your Drizzle schema (import `* as schema`). |
| `permissions` | `Permissions` | Yes | The result of `definePermissions()` from `@cfast/permissions`. |
| `user` | `User \| null` | Yes | The current user. `null` means anonymous. The user's role determines which grants apply. |
| `cache` | `CacheConfig \| false` | No | Cache configuration. Defaults to `{ backend: "cache-api" }`. Pass `false` to disable. |

**Returns:** A `Db` instance whose query methods return `Operation` objects.

### `Operation<TParams, TResult>`

The core type. Every method on `db` (query, insert, update, delete) returns an `Operation` instead of a promise.

```typescript
type Operation<TParams extends Record<string, unknown>, TResult> = {
  permissions: PermissionDescriptor[];
  run: (params: TParams) => Promise<TResult>;
};
```

| Property | Type | Description |
|---|---|---|
| `.permissions` | `PermissionDescriptor[]` | Structural permission requirements. Available immediately — no parameter values needed. |
| `.run(params)` | `(params: TParams) => Promise<TResult>` | Binds parameters, checks permissions against the current user, throws `ForbiddenError` if denied, then executes via a Drizzle prepared statement. |

**The two-phase design is intentional:**

1. **Inspection phase** — Read `.permissions` to know what this operation requires. No SQL is executed. No parameter values are needed. This is what enables client-side UI adaptation ("should I show this button?") and upfront composition ("do all three operations in this workflow pass?").

2. **Execution phase** — Call `.run(params)` to bind concrete values, check permissions (including row-level `where` clauses), and execute the SQL. This is where `ForbiddenError` is thrown if the user lacks the required grants.

### Reads: `db.query(table)`

Returns an `Operation` whose `.run()` executes a `SELECT` with permission-derived `WHERE` clauses automatically appended.

```typescript
import { posts } from "./schema";

// Basic read — no parameters
const allVisible = db.query(posts).findMany();

allVisible.permissions;
// → [{ action: "read", table: posts }]

await allVisible.run({});
// Anonymous user → SELECT * FROM posts WHERE published = true
// Editor user   → SELECT * FROM posts
// Admin user    → SELECT * FROM posts
```

**With user-supplied filters (parameterized):**

```typescript
const postsByCategory = db.query(posts).findMany({
  where: eq(posts.category, sql.placeholder("category")),
});

postsByCategory.permissions;
// → [{ action: "read", table: posts }]

await postsByCategory.run({ category: "tech" });
// Anonymous → SELECT * FROM posts WHERE published = true AND category = 'tech'
// Editor   → SELECT * FROM posts WHERE category = 'tech'
```

Your filter composes with the permission filter via `AND`. The permission filter is always applied — you cannot accidentally bypass it.

**With ordering, limits, and column selection:**

```typescript
const recentPosts = db.query(posts).findMany({
  columns: { id: true, title: true, createdAt: true },
  where: eq(posts.category, sql.placeholder("category")),
  orderBy: desc(posts.createdAt),
  limit: 10,
});

await recentPosts.run({ category: "tech" });
```

**Single row:**

```typescript
const postById = db.query(posts).findFirst({
  where: eq(posts.id, sql.placeholder("postId")),
});

const post = await postById.run({ postId: "abc-123" });
// post: Post | undefined
```

**With relations (Drizzle relational queries):**

```typescript
const postWithComments = db.query(posts).findFirst({
  where: eq(posts.id, sql.placeholder("postId")),
  with: {
    comments: {
      orderBy: desc(comments.createdAt),
      limit: 20,
    },
  },
});

postWithComments.permissions;
// → [{ action: "read", table: posts }, { action: "read", table: comments }]
// Both tables' permission filters are applied to their respective parts of the query.

await postWithComments.run({ postId: "abc-123" });
```

When a relational query touches multiple tables, the operation's `.permissions` includes descriptors for each table. Permission filters are applied per-table.

### Writes: `db.insert(table)`

Returns an `Operation` whose `.run()` checks the `"create"` permission and then executes an `INSERT`.

```typescript
const createPost = db.insert(posts).values({
  title: sql.placeholder("title"),
  content: sql.placeholder("content"),
  authorId: sql.placeholder("authorId"),
});

createPost.permissions;
// → [{ action: "create", table: posts }]

await createPost.run({
  title: "Hello World",
  content: "My first post",
  authorId: "user-123",
});
// Checks: does this user's role have a "create" grant on posts?
// If yes → INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)
// If no  → throws ForbiddenError
```

**Returning inserted rows:**

```typescript
const createPost = db.insert(posts)
  .values({
    title: sql.placeholder("title"),
    authorId: sql.placeholder("authorId"),
  })
  .returning();

const inserted = await createPost.run({
  title: "Hello",
  authorId: "user-123",
});
// inserted: Post (the full row with generated id, timestamps, etc.)
```

### Writes: `db.update(table)`

Returns an `Operation` whose `.run()` checks the `"update"` permission (including row-level `where` clauses) and then executes an `UPDATE`.

```typescript
const publishPost = db.update(posts)
  .set({ published: true, publishedAt: sql`CURRENT_TIMESTAMP` })
  .where(eq(posts.id, sql.placeholder("postId")));

publishPost.permissions;
// → [{ action: "update", table: posts }]

await publishPost.run({ postId: "abc-123" });
// For a "user" role with grant: update posts WHERE authorId = user.id
//   → Checks that post abc-123 is owned by this user
//   → If yes: UPDATE posts SET published = true, published_at = CURRENT_TIMESTAMP WHERE id = 'abc-123'
//   → If no: throws ForbiddenError
//
// For an "editor" role with unrestricted update grant:
//   → UPDATE posts SET published = true, published_at = CURRENT_TIMESTAMP WHERE id = 'abc-123'
```

**Returning updated rows:**

```typescript
const publishPost = db.update(posts)
  .set({ published: true })
  .where(eq(posts.id, sql.placeholder("postId")))
  .returning();

const updated = await publishPost.run({ postId: "abc-123" });
// updated: Post
```

### Writes: `db.delete(table)`

Returns an `Operation` whose `.run()` checks the `"delete"` permission and then executes a `DELETE`.

```typescript
const removePost = db.delete(posts)
  .where(eq(posts.id, sql.placeholder("postId")));

removePost.permissions;
// → [{ action: "delete", table: posts }]

await removePost.run({ postId: "abc-123" });
// Same row-level checking as update — if the user's grant has a where clause,
// the target row must satisfy it.
```

### Parameterization with `sql.placeholder()`

Operations use Drizzle's `sql.placeholder()` for parameters. This maps directly to Drizzle prepared statements under the hood, giving you query plan caching for free.

```typescript
import { sql, eq } from "drizzle-orm";

// Define the operation shape once with placeholders
const postsByAuthor = db.query(posts).findMany({
  where: eq(posts.authorId, sql.placeholder("authorId")),
});

// Run it multiple times with different values
const alicePosts = await postsByAuthor.run({ authorId: "alice" });
const bobPosts = await postsByAuthor.run({ authorId: "bob" });
```

**Type safety:** The placeholder names become required keys in the `params` argument of `.run()`. If you define `sql.placeholder("postId")`, then `.run()` requires `{ postId: string }`. TypeScript enforces this.

**When you don't need parameters:**

If your operation has no placeholders, `.run()` takes an empty object:

```typescript
const allPosts = db.query(posts).findMany();
await allPosts.run({});
```

**Multiple placeholders:**

```typescript
const filteredPosts = db.query(posts).findMany({
  where: and(
    eq(posts.category, sql.placeholder("category")),
    eq(posts.published, sql.placeholder("published")),
  ),
});

await filteredPosts.run({ category: "tech", published: true });
```

### `compose(operations, executor)`

The applicative combinator. Takes multiple operations, merges their permissions, and provides executor functions for each.

```typescript
import { compose } from "@cfast/db";

const publishWorkflow = compose(
  [publishPost, insertAuditLog],
  (doPublish, doAudit) => {
    doPublish({ postId: "abc-123" });
    doAudit({ action: "publish", targetId: "abc-123" });
    return { published: true };
  },
);
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `operations` | `[Op1, Op2, ...]` | A tuple of `Operation` objects to compose. |
| `executor` | `(run1, run2, ...) => R` | A function that receives one executor per operation. Each executor has the same signature as the original operation's `.run()`, but permission checking is deferred to the composed `.run()`. |

**Returns:** A new `Operation` with:
- `.permissions` — the deduplicated union of all sub-operation permissions
- `.run()` — checks ALL permissions upfront, then calls the executor function

```typescript
publishWorkflow.permissions;
// → [
//   { action: "update", table: posts },
//   { action: "create", table: auditLogs },
// ]

await publishWorkflow.run();
// 1. Checks: can this user "update" posts AND "create" auditLogs?
// 2. If ANY check fails → throws ForbiddenError (no SQL executed)
// 3. If all pass → calls the executor function, which runs both operations
```

**Key properties of `compose`:**

1. **All-or-nothing permission checking.** Permissions for every sub-operation are checked before any SQL executes. If the user can update posts but can't create audit logs, neither operation runs.

2. **Permissions are deduplicated.** If two sub-operations both require `{ action: "update", table: posts }`, the composed permissions list it once.

3. **Executor functions bind params.** The executor receives `run` functions that take the same params as the original `.run()`:

```typescript
compose(
  [updatePost, insertAuditLog],
  (doUpdate, doAudit) => {
    // doUpdate has the same param type as updatePost.run
    doUpdate({ postId: "abc" });
    // doAudit has the same param type as insertAuditLog.run
    doAudit({ action: "publish", targetId: "abc" });
  },
);
```

4. **Composition is nestable.** Since `compose` returns an `Operation`, you can compose composed operations:

```typescript
const publishWorkflow = compose([updatePost, insertAuditLog], (doUpdate, doAudit) => {
  doUpdate({ postId: "abc" });
  doAudit({ action: "publish", targetId: "abc" });
});

const archiveWorkflow = compose([publishWorkflow, markArchived], (doPublish, doArchive) => {
  doPublish(); // publishWorkflow.run() params were already bound in its executor
  doArchive({ postId: "abc" });
});

archiveWorkflow.permissions;
// → [
//   { action: "update", table: posts },
//   { action: "create", table: auditLogs },
//   { action: "update", table: posts },  // deduplicated with the first
// ]
// After dedup: [{ action: "update", table: posts }, { action: "create", table: auditLogs }]
```

5. **Async executors are supported.** The executor function can be async:

```typescript
const workflow = compose(
  [updatePost, insertAuditLog, sendNotification],
  async (doUpdate, doAudit, doNotify) => {
    const updated = await doUpdate({ postId: "abc" });
    await doAudit({ action: "publish", targetId: "abc" });
    await doNotify({ userId: updated.authorId, message: "Your post was published" });
    return { published: true, notified: true };
  },
);
```

### `db.unsafe()`

Bypasses all permission checks. Returns a db instance whose operations have empty `.permissions` and whose `.run()` executes without checking.

```typescript
const op = db.unsafe().update(posts)
  .set({ featured: true })
  .where(eq(posts.id, sql.placeholder("postId")));

op.permissions;
// → [] (empty — no permissions required)

await op.run({ postId: "abc" });
// Executes immediately, no permission check
```

**Use `db.unsafe()` for:**
- System operations (scheduled tasks, migrations, seeding)
- Background jobs that run without a user context
- Admin operations that intentionally bypass the permission model

**`db.unsafe()` is designed to be greppable.** Search your codebase for `.unsafe()` to audit all permission bypasses.

### `db.batch(operations)`

Executes multiple operations in a single D1 batch call. All permissions are checked upfront before any SQL executes.

```typescript
const results = await db.batch([
  db.insert(posts).values({ title: sql.placeholder("t1"), authorId: sql.placeholder("a") }),
  db.insert(posts).values({ title: sql.placeholder("t2"), authorId: sql.placeholder("a") }),
  db.insert(auditLogs).values({ action: sql.placeholder("action") }),
]);

await results.run({
  t1: "Post 1",
  t2: "Post 2",
  a: "user-123",
  action: "bulk_create",
});
// 1. Checks all permissions: create posts (x2) + create auditLogs
// 2. Executes all three as a single D1 batch call
```

`db.batch()` returns a composed `Operation`, so it has `.permissions` and `.run()` like any other operation.

## Caching

### How It Works

Every read operation that goes through `db.query()` is a cache candidate. The cache key is derived from:

1. **The SQL query** (table, columns, where clause, order, limit)
2. **The applied permission filters** (which depend on the user's role)
3. **A table-level version counter** (incremented on mutations)

This means the same query produces different cache keys for different roles, so a cached anonymous result is never served to an editor.

```
cache key = hash(sql + permissionFilters + tableVersion)
```

### Cache Backends

**Cache API** (default) — Uses Cloudflare's [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/). Free, fast, edge-local. Best for most workloads. Cache entries live in the Cloudflare edge node that processed the request, so cache hit rates depend on traffic distribution.

**KV** — Uses a Cloudflare KV namespace. Eventually consistent (up to 60s), but globally shared. Better for low-traffic apps where edge-local caching would have poor hit rates.

```typescript
const db = createDb({
  // ...
  cache: {
    backend: "kv",
    kv: env.CACHE, // KV namespace binding
  },
});
```

**Disabled** — No caching. Every query hits D1 directly.

```typescript
const db = createDb({
  // ...
  cache: false,
});
```

### Automatic Invalidation

When a mutation operation's `.run()` executes, the cache entries for the affected table(s) are invalidated:

```typescript
const createOp = db.insert(posts).values({
  title: sql.placeholder("title"),
  authorId: sql.placeholder("authorId"),
});

await createOp.run({ title: "New Post", authorId: "user-123" });
// This invalidates all cached queries that touch the "posts" table

const freshPosts = await db.query(posts).findMany().run({});
// Cache miss — hits D1 directly
```

Invalidation is table-level by default. This is intentionally coarse-grained: it's simple, correct, and for D1 workloads the cost of a few extra cache misses is negligible compared to the complexity of row-level invalidation.

### Per-Query Cache Control

Override caching behavior on individual read operations:

```typescript
// Skip the cache for this query (always hit D1)
const freshPosts = db.query(posts).findMany({ cache: false });

// Custom TTL
const settings = db.query(appSettings).findFirst({ cache: { ttl: "5m" } });

// Stale-while-revalidate: serve stale data immediately, refresh in background
const posts = db.query(posts).findMany({
  cache: { ttl: "1m", staleWhileRevalidate: "5m" },
});
```

Cache options are part of the operation definition, not the `.run()` call. This means the same operation always has the same caching behavior regardless of when or where it's run.

### Global Defaults

```typescript
const db = createDb({
  // ...
  cache: {
    backend: "cache-api",
    ttl: "30s",                   // Default TTL for all queries
    staleWhileRevalidate: "5m",   // Default SWR window
    exclude: ["sessions", "auditLogs"], // Tables that should never be cached
  },
});
```

### Cache Tags

For more targeted invalidation when table-level is too broad:

```typescript
// Tag a query
const userPosts = db.query(posts).findMany({
  where: eq(posts.authorId, sql.placeholder("authorId")),
  cache: { tags: [`user-posts`] },
});

// Invalidate by tag
await db.cache.invalidate({ tags: [`user-posts`] });
```

### Observability

```typescript
const db = createDb({
  // ...
  cache: {
    backend: "cache-api",
    onHit: (key, table) => console.log(`cache hit: ${table}`),
    onMiss: (key, table) => console.log(`cache miss: ${table}`),
    onInvalidate: (tables) => console.log(`invalidated: ${tables.join(", ")}`),
  },
});
```

## Complete Example

Putting it all together — a blog post publishing workflow:

```typescript
// permissions.ts
import { definePermissions, grant } from "@cfast/permissions";
import { posts, auditLogs } from "./schema";

export const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  hierarchy: {
    user: ["anonymous"],
    editor: ["user"],
    admin: ["editor"],
  },
  grants: {
    anonymous: [
      grant("read", posts, { where: (post) => eq(post.published, true) }),
    ],
    user: [
      grant("create", posts),
      grant("update", posts, { where: (post, user) => eq(post.authorId, user.id) }),
    ],
    editor: [
      grant("read", posts),
      grant("update", posts),
      grant("create", auditLogs),
    ],
    admin: [
      grant("manage", "all"),
    ],
  },
});
```

```typescript
// operations.ts
import { createDb, compose } from "@cfast/db";
import { sql, eq } from "drizzle-orm";
import { posts, auditLogs } from "./schema";

export function createOperations(db: Db) {
  // Define reusable operations — like prepared statements with permissions
  const updatePost = db.update(posts)
    .set({ published: true, publishedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(posts.id, sql.placeholder("postId")));

  const insertAuditLog = db.insert(auditLogs).values({
    action: sql.placeholder("auditAction"),
    targetId: sql.placeholder("targetId"),
    userId: sql.placeholder("userId"),
  });

  // Compose into a workflow
  const publishPost = compose(
    [updatePost, insertAuditLog],
    async (doUpdate, doAudit) => {
      const updated = await doUpdate({ postId: "abc" });
      await doAudit({
        auditAction: "publish",
        targetId: "abc",
        userId: "user-123",
      });
      return { published: true };
    },
  );

  return { updatePost, insertAuditLog, publishPost };
}
```

```typescript
// worker.ts (in a loader or action)
import { createDb } from "@cfast/db";
import { permissions } from "./permissions";
import { createOperations } from "./operations";

const db = createDb({ d1: env.DB, schema, permissions, user: currentUser });
const ops = createOperations(db);

// Inspect permissions without executing
console.log(ops.publishPost.permissions);
// → [{ action: "update", table: posts }, { action: "create", table: auditLogs }]

// Execute — checks permissions first, throws ForbiddenError if denied
await ops.publishPost.run();
```

## Integration

- **`@cfast/permissions`** — Provides `definePermissions()` and permission checking logic. `@cfast/db` compiles grants into Drizzle where clauses and checks them at `.run()` time.
- **`@cfast/actions`** — Actions define operations using `@cfast/db`. The framework extracts `.permissions` for client-side introspection and calls `.run()` for server-side execution. See the `@cfast/actions` README.
- **`@cfast/admin`** — Admin CRUD operations go through the same `Operation` pipeline. An admin sees all rows. A moderator sees what the moderator role allows.
