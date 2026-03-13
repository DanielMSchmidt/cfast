# @cfast/db

**Lazy, permission-aware Drizzle operations for Cloudflare D1.**

`@cfast/db` wraps Drizzle ORM and returns lazy `Operation` objects instead of promises. An `Operation` knows which permissions it requires (`.permissions`) and can be inspected before execution (`.run()`). When you call `.run()`, permissions are checked first. If denied, a `ForbiddenError` is thrown before any SQL touches the database.

This is application-level Row-Level Security for D1 (which has no native RLS). It's not a separate middleware layer you have to remember to apply — it's the return type of every query.

## Why This Exists

D1 is SQLite. It has no `CREATE POLICY`, no `GRANT`, no row-level security. Every query runs with full access.

Most applications solve this by scattering permission checks across route handlers, loaders, and actions. This works until it doesn't — someone forgets a check, a new endpoint bypasses the middleware, or a refactor moves a query out of the handler that was guarding it.

`@cfast/db` makes the permission check structural. You cannot get a query result without going through `.run()`, and `.run()` always checks permissions. The only escape hatch is `.unsafe()`, which is explicit and greppable.

## Design Decisions and Their Rationale

### Why lazy Operations instead of direct queries?

The two-phase design (inspect `.permissions`, then `.run()`) exists because permissions are useful *before* execution:

1. **UI adaptation** — You can check `.permissions` on the client to decide whether to show an edit button, without making a round-trip. `@cfast/actions` extracts `.permissions` from operations and sends them to the client for this purpose.

2. **Upfront composition** — `compose()` merges permissions from multiple operations. If any sub-operation would be denied, you know before any SQL runs. This prevents partial writes (update succeeded, but audit log insert was denied).

3. **Introspection** — Logging, debugging, and admin dashboards can inspect what an operation requires without executing it.

The cost is one extra level of indirection (`.run({})` instead of `await db.query(...)`) and a slightly larger API surface. We think this is worth it because permission bugs are hard to detect and easy to ship.

### Why `Record<string, unknown>` for params instead of type-safe placeholders?

The README spec originally called for type-level inference of `sql.placeholder()` names into the `params` type of `.run()`. The current implementation uses `Record<string, unknown>`.

**Why:** Drizzle's `sql.placeholder()` returns `SQL.Placeholder<TName>`, and Drizzle's own `.prepare().execute()` can infer the params type. However, our builder pattern constructs Operations from Drizzle query options *before* the query is prepared, and the type information about which placeholders exist lives inside opaque `unknown` types (the `where`, `orderBy` fields). Propagating placeholder types through the builder chain would require either:
- Carrying generic type parameters through every builder method (massive API complexity), or
- Using Drizzle's internal type utilities which are not part of their public API

**The tradeoff:** Runtime behavior is correct — Drizzle validates placeholder params at execution time. You lose compile-time checking of param names. This is a known gap we plan to close, but we chose shipping correct runtime behavior over blocking on perfect types.

### Why table-level cache invalidation instead of row-level?

When a mutation runs (insert, update, delete), all cached queries touching that table are invalidated by bumping an in-memory version counter. This is intentionally coarse-grained.

**Why not row-level?** Row-level invalidation requires knowing which rows a cached query *would* return after the mutation. For a query like `SELECT * FROM posts WHERE category = 'tech' ORDER BY created_at LIMIT 10`, an insert into the `tech` category might push a row into the result set or not, depending on its `created_at`. Determining this correctly requires re-executing the query, which defeats the purpose of caching.

**The tradeoff:** More cache misses than necessary — updating one post invalidates cached queries for all posts. For D1 workloads (typically low-to-medium traffic, single-region primary), the extra D1 reads are cheap. The simplicity eliminates an entire class of stale-data bugs.

### Why in-memory version counters?

Table version counters live in a `Map<string, number>` inside the `CacheManager` instance. They are not persisted.

**What this means:** When a Cloudflare Worker cold-starts, all version counters reset to 0. Two Worker isolates handling concurrent requests each have their own counter state.

**Why this is acceptable:**
- Cache keys include the version number, so a reset to 0 produces keys that may collide with *previous* version-0 keys. But those old cache entries have TTLs and will have expired (default 60s).
- Two isolates with different counters produce different cache keys, so they won't serve each other's stale data. They just won't share cache hits either.
- The alternative (storing versions in KV or D1) adds latency to every mutation and creates its own consistency problems.

**When this breaks:** If you set very long TTLs (hours) and have frequent cold starts, you could see stale data after a restart. Keep TTLs short (seconds to low minutes) and this is a non-issue.

### Why `db.unsafe()` instead of a "system" role?

A "system" role with `grant("manage", "all")` would work at the permission level, but it conflates application roles with infrastructure concerns. An admin user and a cron job are not the same thing — the admin should be auditable, the cron job should not require a user record in the database.

`db.unsafe()` returns a new `Db` instance where every operation has empty `.permissions` and `.run()` skips checking entirely. This is:
- **Greppable** — `git grep '.unsafe()'` finds every permission bypass in your codebase
- **Scoped** — `unsafe()` only affects the `Db` instance it returns, not the original
- **Honest** — it doesn't pretend to check permissions. There's no "system" role grant that could be accidentally inherited or misconfigured

### Why `compose()` takes an executor function?

`compose()` could have been simpler — just merge permissions and return a batch. Instead, it takes an executor function that receives `run` functions for each sub-operation:

```typescript
compose([opA, opB], async (runA, runB) => {
  const a = await runA({});
  await runB({ targetId: a.id });
  return { done: true };
});
```

**Why:** Operations often depend on each other's results. The audit log needs the ID of the post that was just updated. A notification needs the author's email from the updated row. The executor pattern lets you wire these data dependencies while still getting merged permissions and all-or-nothing checking.

The alternative (a simple batch that runs operations independently) can't express data dependencies between operations.

### Why does `batch()` run operations sequentially?

`db.batch()` iterates operations in order, awaiting each `.run()`. It does not use D1's native `d1.batch()` API.

**Why:** Each operation's `.run()` performs its own permission check and WHERE clause injection. D1's native batch takes raw prepared statements, which would bypass the permission layer. To use native batch, we'd need to separate "prepare the statement with permissions applied" from "execute it", which is a different internal architecture.

**The tradeoff:** You don't get D1's batch optimization (single round-trip for multiple statements). For most applications, the difference is negligible — D1 is colocated with the Worker, so per-query latency is sub-millisecond. If you need true batch performance for bulk operations, use `db.unsafe()` and call D1's batch API directly.

---

## API Reference

### `createDb(config)`

Creates a permission-aware database instance. Call this once per request, passing the authenticated user.

```typescript
import { createDb } from "@cfast/db";
import { permissions } from "./permissions";
import * as schema from "./schema";

const db = createDb({
  d1: env.DB,
  schema,
  permissions,
  user: currentUser,
  cache: { backend: "cache-api" },
});
```

| Field | Type | Required | Description |
|---|---|---|---|
| `d1` | `D1Database` | Yes | Your Cloudflare D1 binding. |
| `schema` | `Record<string, Table>` | Yes | Your Drizzle schema. Must be `import * as schema` — the keys must match your table variable names because Drizzle's relational query API uses them for lookup. |
| `permissions` | `Permissions` | Yes | The result of `definePermissions()` from `@cfast/permissions`. Contains resolved grants with role hierarchy already flattened. |
| `user` | `{ id: string; role: string } \| null` | Yes | The current user. `null` means anonymous — the role `"anonymous"` is used for permission checks. The `id` field is passed to `where` clause functions in grants for row-level filtering. |
| `cache` | `CacheConfig \| false` | No | Cache configuration. Defaults to `{ backend: "cache-api" }`. Pass `false` to disable the cache manager entirely. |

**Returns:** A `Db` instance. This instance is bound to the user you passed — create a new one per request.

**Why per-request?** The `Db` instance captures the user at creation time. Permission checks and WHERE clause injection use this captured user. Sharing a `Db` across requests would apply one user's permissions to another user's queries.

### `Operation<TResult>`

The core type. Every method on `db` returns an `Operation` instead of a promise.

```typescript
type Operation<TResult> = {
  permissions: PermissionDescriptor[];
  run: (params: Record<string, unknown>) => Promise<TResult>;
};
```

| Property | Type | Description |
|---|---|---|
| `.permissions` | `PermissionDescriptor[]` | Structural permission requirements. Available immediately — no execution needed. Each descriptor has `{ action, table }`. |
| `.run(params)` | `(params: Record<string, unknown>) => Promise<TResult>` | Checks permissions, applies permission WHERE clauses, executes via Drizzle, returns results. Throws `ForbiddenError` if the user's role lacks a required grant. |

**The `params` argument:** Pass `{}` when the operation has no placeholders. When using `sql.placeholder("name")`, pass the values here — Drizzle validates them at runtime. See [Known Limitations](#known-limitations) for why this isn't type-checked at compile time.

---

### Reads: `db.query(table)`

Returns a query builder with `findMany` and `findFirst`. Both return Operations.

```typescript
const allVisible = db.query(posts).findMany();

allVisible.permissions;
// → [{ action: "read", table: posts }]

await allVisible.run({});
// Anonymous user → SELECT * FROM posts WHERE published = 1
// Editor user   → SELECT * FROM posts  (no permission filter)
// Admin user    → SELECT * FROM posts  (manage grants have no filter)
```

**How permission WHERE clauses are applied:**

1. At `.run()` time, the library looks up the user's role in `permissions.resolvedGrants`
2. It finds all grants matching the action ("read") and the table
3. If **any** matching grant has no `where` clause, the user has unrestricted access — no filter is added. This is because an unrestricted grant is strictly more permissive than any filtered grant.
4. If **all** matching grants have `where` clauses, they're combined with `OR` (the user can see rows matching *any* of their grants)
5. The resulting permission filter is combined with the user's own `where` clause via `AND`

This means: `user_filter AND (perm_filter_1 OR perm_filter_2)`. The permission filter is always applied — you cannot accidentally bypass it.

**Query options:**

```typescript
db.query(posts).findMany({
  columns: { id: true, title: true },     // Column selection
  where: eq(posts.category, "tech"),       // User-supplied filter (AND'd with permission filter)
  orderBy: desc(posts.createdAt),          // Ordering
  limit: 10,                               // Pagination
  offset: 20,
  with: { comments: true },               // Drizzle relational queries
  cache: { ttl: "5m", tags: ["posts"] },   // Per-query cache control
});

db.query(posts).findFirst({
  where: eq(posts.id, "abc-123"),
});
// Returns: TResult | undefined
```

**Relational queries (`with`):** The `with` option passes through to Drizzle's relational query API. Note that permission filters are currently only applied to the root table, not to joined relations. This is a known limitation — see [Known Limitations](#known-limitations).

---

### Writes: `db.insert(table)`

```typescript
const createPost = db.insert(posts).values({
  title: "Hello World",
  authorId: currentUser.id,
});

createPost.permissions;
// → [{ action: "create", table: posts }]

await createPost.run({});
// Checks: does this user's role have a "create" grant on posts?
// If yes → INSERT INTO posts ...
// If no  → throws ForbiddenError
```

**With `.returning()`:**

```typescript
const createPost = db.insert(posts)
  .values({ title: "Hello", authorId: currentUser.id })
  .returning();

const inserted = await createPost.run({});
// inserted: the full inserted row
```

**No row-level WHERE injection for inserts.** Insert permissions are checked at the role level only — either the role can create rows in this table or it can't. Row-level `where` clauses on "create" grants are not applied (there's no existing row to filter against). If you need to enforce that users can only create posts with their own `authorId`, validate that in application code or use a `where` clause on update/delete to prevent tampering afterward.

---

### Writes: `db.update(table)`

```typescript
const publishPost = db.update(posts)
  .set({ published: true })
  .where(eq(posts.id, "abc-123"));

publishPost.permissions;
// → [{ action: "update", table: posts }]

await publishPost.run({});
```

**Row-level permission injection for updates:** If the user's "update" grant has a `where` clause (e.g., `where: (post, user) => eq(post.authorId, user.id)`), it's AND'd with the user-supplied condition:

```sql
-- User role with row-level grant:
UPDATE posts SET published = true
WHERE id = 'abc-123' AND author_id = 'user-123'

-- Editor role with unrestricted grant:
UPDATE posts SET published = true
WHERE id = 'abc-123'
```

If the permission WHERE clause causes zero rows to match, the UPDATE silently affects no rows. It does **not** throw `ForbiddenError` — the role-level check passed, but the row-level constraint narrowed the result to nothing. This matches how database-level RLS works: the query succeeds but the row is invisible to the user.

**With `.returning()`:**

```typescript
const updated = await db.update(posts)
  .set({ published: true })
  .where(eq(posts.id, "abc-123"))
  .returning()
  .run({});
```

---

### Writes: `db.delete(table)`

```typescript
const removePost = db.delete(posts)
  .where(eq(posts.id, "abc-123"));

removePost.permissions;
// → [{ action: "delete", table: posts }]

await removePost.run({});
```

Same row-level WHERE injection as `update()`. Same silent-no-match behavior.

---

### `db.unsafe()`

Returns a new `Db` instance that skips all permission checks.

```typescript
const op = db.unsafe().delete(posts).where(eq(posts.id, "abc-123"));

op.permissions;
// → []  (empty — no permissions required)

await op.run({});
// Executes immediately, no permission check, no permission WHERE injection
```

**When to use:**
- Scheduled tasks / cron handlers (no authenticated user)
- Database migrations and seeding
- Background jobs that run outside of a request context
- System operations that intentionally bypass user-level permissions

**When NOT to use:**
- Admin endpoints — use a role with appropriate grants instead, so admin actions are still auditable through the permission system
- "I don't want to set up permissions yet" — use `grant("manage", "all")` on a development role instead. `unsafe()` should be reserved for genuinely user-less contexts.

**Auditability:** `git grep '.unsafe()'` finds every permission bypass in your codebase. This is intentional — if you're reviewing a PR and see `.unsafe()`, it should prompt a conversation about whether that's appropriate.

---

### `compose(operations, executor)`

Merges multiple operations into a single operation with combined, deduplicated permissions.

```typescript
import { compose } from "@cfast/db";

const publishWorkflow = compose(
  [updatePost, insertAuditLog],
  async (doUpdate, doAudit) => {
    const updated = await doUpdate({});
    await doAudit({});
    return { published: true };
  },
);

publishWorkflow.permissions;
// → [{ action: "update", table: posts }, { action: "create", table: auditLogs }]

await publishWorkflow.run({});
```

| Parameter | Type | Description |
|---|---|---|
| `operations` | `Operation<unknown>[]` | Operations to compose. |
| `executor` | `(...runs) => R \| Promise<R>` | Receives a `run` function for each operation, in order. You control execution order, data flow between operations, and the return value. |

**Permission deduplication:** If multiple operations require `{ action: "update", table: posts }`, the composed permissions list it once. Deduplication uses `action:tableName` as the key.

**Nesting:** `compose()` returns an `Operation`, so composed operations can themselves be composed:

```typescript
const fullWorkflow = compose(
  [publishWorkflow, sendNotification],
  async (doPublish, doNotify) => {
    await doPublish({});
    await doNotify({});
  },
);
// fullWorkflow.permissions includes all permissions from publishWorkflow + sendNotification
```

**Important:** `compose()` itself does not check permissions — it only merges them. Each sub-operation's `.run()` still performs its own permission check when the executor calls it. This means compose is purely a grouping mechanism for inspecting combined permissions. If you need all-or-nothing checking before any SQL runs, check the composed `.permissions` yourself before calling `.run()`.

---

### `db.batch(operations)`

Groups multiple operations into a single operation with merged permissions.

```typescript
const batchOp = db.batch([
  db.insert(posts).values({ title: "Post 1" }),
  db.insert(posts).values({ title: "Post 2" }),
  db.insert(auditLogs).values({ action: "bulk_create" }),
]);

batchOp.permissions;
// → [{ action: "create", table: posts }, { action: "create", table: auditLogs }]

await batchOp.run({});
```

**Implementation detail:** `batch()` runs operations sequentially via their individual `.run()` methods, not via D1's native batch API. See [Design Decisions](#why-does-batch-run-operations-sequentially) for why.

---

## Caching

The cache layer manages table-level version counters and provides Cache API / KV backends. Mutations automatically invalidate affected tables.

### Cache Configuration

```typescript
const db = createDb({
  // ...
  cache: {
    backend: "cache-api",           // "cache-api" | "kv"
    ttl: "30s",                     // Default TTL (supports "Ns", "Nm", "Nh")
    staleWhileRevalidate: "5m",     // SWR window
    exclude: ["sessions"],          // Tables that should never be cached
    onHit: (key, table) => {},      // Observability hook
    onMiss: (key, table) => {},
    onInvalidate: (tables) => {},
  },
});
```

For KV backend, also pass the namespace binding:

```typescript
cache: {
  backend: "kv",
  kv: env.CACHE,
}
```

### How Cache Keys Work

```
cache key = cfast:{role}:v{tableVersion}:{hash(sql)}
```

The role is embedded in the key, so an anonymous user's cached result can never be served to an editor. The table version is incremented on every mutation, so stale entries are never read (they have different keys).

The hash uses a fast 32-bit string hash (djb2 variant). This is not cryptographic — it's for cache bucketing, not security. Collisions are possible but harmless (worst case: a cache miss).

### Automatic Invalidation

Every mutation builder receives an `onMutate` callback. After a successful insert/update/delete, it bumps the table's version counter. Any subsequent read generates a cache key with the new version, causing a cache miss.

```typescript
await db.insert(posts).values({ title: "New" }).run({});
// → table version for "posts" incremented
// → all cached "posts" queries will miss on next read
```

### Per-Query Cache Control

```typescript
db.query(posts).findMany({ cache: false });                           // Skip cache
db.query(posts).findMany({ cache: { ttl: "5m" } });                  // Custom TTL
db.query(posts).findMany({ cache: { ttl: "1m", staleWhileRevalidate: "5m" } });
db.query(posts).findMany({ cache: { tags: ["user-posts"] } });       // Tag for targeted invalidation
```

### Manual Invalidation

```typescript
await db.cache.invalidate({ tags: ["user-posts"] });     // By tag
await db.cache.invalidate({ tables: ["posts"] });         // By table
```

### Cache Backend Tradeoffs

| | Cache API | KV |
|---|---|---|
| **Latency** | ~0ms (edge-local) | 10-50ms (global) |
| **Consistency** | Per-edge-node | Eventually consistent (up to 60s) |
| **Hit rate** | Depends on traffic distribution | Global sharing, better for low-traffic |
| **Cost** | Free | KV pricing applies |
| **Best for** | High-traffic, multi-region | Low-traffic, global consistency |

**Cache API** stores entries in the Cloudflare edge node that processed the request. If your traffic is concentrated in one region, hit rates are excellent. If traffic is spread across many edges, each edge maintains its own cache — you pay the miss cost once per edge.

**KV** stores entries globally. Every edge reads from the same store. Better hit rates for low-traffic apps, but reads have higher latency and writes are eventually consistent (a mutation on one edge may take up to 60s to propagate).

---

## Complete Example

```typescript
// schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id").notNull(),
  published: integer("published", { mode: "boolean" }).default(false),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  userId: text("user_id").notNull(),
});
```

```typescript
// permissions.ts
import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
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
      grant("read", posts, { where: (cols: any) => sql`${cols.published} = 1` }),
    ],
    user: [
      grant("create", posts),
      grant("update", posts, {
        where: (cols: any, user: any) => sql`${cols.authorId} = ${user.id}`,
      }),
    ],
    editor: [
      grant("read", posts),     // unrestricted — overrides anonymous's filtered read
      grant("update", posts),   // unrestricted — overrides user's filtered update
      grant("delete", posts),
      grant("create", auditLogs),
    ],
    admin: [
      grant("manage", "all"),
    ],
  },
});
```

```typescript
// worker.ts (in a React Router loader or action)
import { createDb, compose } from "@cfast/db";
import { eq } from "drizzle-orm";
import { permissions } from "./permissions";
import * as schema from "./schema";
import { posts, auditLogs } from "./schema";

export async function loader({ context }) {
  const db = createDb({
    d1: context.env.DB,
    schema,
    permissions,
    user: context.user,  // from @cfast/auth
    cache: false,
  });

  // Read — permission filter applied automatically
  const visiblePosts = await db.query(posts).findMany().run({});

  // Inspect permissions without executing
  const deleteOp = db.delete(posts).where(eq(posts.id, "abc"));
  console.log(deleteOp.permissions);
  // → [{ action: "delete", table: posts }]

  return { posts: visiblePosts };
}

export async function action({ context, request }) {
  const db = createDb({
    d1: context.env.DB,
    schema,
    permissions,
    user: context.user,
    cache: false,
  });

  // Compose a workflow: update post + audit log
  const publishWorkflow = compose(
    [
      db.update(posts).set({ published: true }).where(eq(posts.id, "abc")),
      db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: "publish",
        targetId: "abc",
        userId: context.user.id,
      }),
    ],
    async (doUpdate, doAudit) => {
      await doUpdate({});
      await doAudit({});
      return { published: true };
    },
  );

  // Check combined permissions
  console.log(publishWorkflow.permissions);
  // → [{ action: "update", table: posts }, { action: "create", table: auditLogs }]

  // Execute — each sub-operation checks its own permissions
  await publishWorkflow.run({});

  return { ok: true };
}
```

---

## Known Limitations

### 1. `run()` params are not type-safe

`Operation.run()` accepts `Record<string, unknown>`. If you use `sql.placeholder("postId")` in a where clause, TypeScript does not enforce that you pass `{ postId: string }` to `.run()`. Drizzle validates at runtime, so incorrect params will throw — but you won't catch the error at compile time.

**Planned fix:** Extract placeholder types from the Drizzle query builder's generic parameters and propagate them through to `Operation<TResult>`.

### 2. Relational query permissions are root-table only

When using `with` for Drizzle relational queries, permission filters are only applied to the root table. Joined relations (e.g., `with: { comments: true }`) use Drizzle's default behavior without permission filtering.

**Why:** Drizzle's relational query API applies `with` as a separate nested query. Injecting permission filters into nested relations would require intercepting Drizzle's internal query building, which couples us to undocumented internals.

**Workaround:** Query relations separately and apply permissions explicitly, or add `where` clauses directly in the `with` options.

### 3. Cache reads are not wired into query builder

The `CacheManager` is fully implemented (key generation, table versioning, get/set with Cache API and KV, tag invalidation, TTL parsing, observability hooks) and mutation-side invalidation works (table versions are bumped after insert/update/delete). However, query builder's `.run()` does not currently check/populate the cache before/after hitting D1.

**What works now:** Table version tracking, manual invalidation via `db.cache.invalidate()`, observability hooks, cache configuration.

**What doesn't work yet:** Automatic read-through caching in `db.query().findMany().run()`.

### 4. `batch()` doesn't use D1's native batch API

Operations are executed sequentially. See [Design Decisions](#why-does-batch-run-operations-sequentially) for the rationale. True D1 batch can be used via `db.unsafe()` if you need the performance.

### 5. Table identity relies on reference equality

`db.query(posts)` finds the table in the schema object using `===` (reference equality). If you import your table from a different path that results in a different object (e.g., re-exporting from a barrel file that re-creates the table), the lookup will fail with "Table not found in schema". Always import tables from the same module you pass as `schema`.

---

## Integration with Other @cfast Packages

- **`@cfast/permissions`** — Provides `definePermissions()`, `grant()`, `checkPermissions()`, and `ForbiddenError`. This package compiles the resulting grants into Drizzle WHERE clauses at `.run()` time.
- **`@cfast/actions`** — Actions define operations using `@cfast/db`. The framework extracts `.permissions` for client-side introspection (UI adaptation) and calls `.run()` for server-side execution.
- **`@cfast/admin`** — Admin CRUD operations go through the same `Operation` pipeline. An admin sees all rows. A moderator sees what the moderator role allows.

## Internals

For contributors and the detail-curious. Not part of the public API.

### File Structure

| File | Responsibility |
|---|---|
| `types.ts` | All public types. No runtime code. |
| `permissions.ts` | `resolvePermissionFilters()` — finds matching grants and extracts WHERE clause functions. `checkOperationPermissions()` — delegates to `@cfast/permissions`'s `checkPermissions()`, throws `ForbiddenError`. |
| `query-builder.ts` | `createQueryBuilder()` — builds `findMany`/`findFirst` Operations. Handles WHERE injection (permission filter AND user filter). Uses Drizzle's relational query API (`db.query[key].findMany`). |
| `mutate-builder.ts` | `createInsertBuilder()`, `createUpdateBuilder()`, `createDeleteBuilder()`. Handles permission checking and WHERE injection for mutations. Calls `onMutate` after success for cache invalidation. |
| `compose.ts` | `compose()` — merges operations, deduplicates permissions, wraps executor. |
| `cache.ts` | `createCacheManager()` — in-memory table versioning, key generation, Cache API and KV get/set, tag tracking, TTL parsing. |
| `create-db.ts` | `createDb()` — wires all the above into a `Db` instance. `buildDb()` is the internal factory that accepts the `isUnsafe` flag. |

### Permission Resolution Flow

```
.run(params) called
  │
  ├─ unsafe? → skip everything, execute query directly
  │
  ├─ checkOperationPermissions(permissions, user, descriptors)
  │   └─ calls @cfast/permissions checkPermissions(role, permissions, descriptors)
  │   └─ if denied → throw ForbiddenError (no SQL executed)
  │
  ├─ resolvePermissionFilters(permissions, user, action, table)
  │   ├─ find grants matching action + table in resolvedGrants[role]
  │   ├─ "manage" action matches any action, "all" subject matches any table
  │   ├─ if ANY matching grant has no where clause → return [] (unrestricted)
  │   └─ otherwise → return all where clause functions
  │
  ├─ execute where clause functions: fn(tableColumns, user) → SQL expression
  │   └─ multiple clauses combined with OR
  │
  ├─ combine: AND(userWhere, OR(permFilter1, permFilter2))
  │
  └─ execute via Drizzle
```

### Drizzle Table Identity

Drizzle stores table names using Symbols (`Symbol.for("drizzle:Name")`), not on a plain `._` property. The `@cfast/permissions` package provides `getTableName(table)` which reads from this Symbol. Both `@cfast/permissions` and `@cfast/db` use **name-based comparison** (not reference equality) when matching grant subjects against operation tables. This means two different imports of the same logical table will match correctly as long as they share the same Drizzle name.

### Using `db.unsafe()` for System Tables

Use `db.unsafe()` when inserting into system tables (like `audit_logs`) that no user role should have direct grants for. This is intentional: audit logs are a side effect of user actions, not something users should need permission to create.

```typescript
// Good: audit log bypasses permission checks
await db.unsafe().insert(auditLogs).values({ ... }).run({});

// Bad: requires a "create" grant on audit_logs for the current user's role
await db.insert(auditLogs).values({ ... }).run({});
```

`git grep '.unsafe()'` finds every permission bypass in your codebase.
