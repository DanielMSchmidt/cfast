# @cfast/db

**Permission-aware, cached Drizzle queries for Cloudflare D1. Your permissions become your where clauses. Your mutations invalidate the cache.**

`@cfast/db` wraps Drizzle ORM to automatically enforce the permissions you defined in `@cfast/permissions`. When a user with the "editor" role queries posts, they see all posts. When an anonymous user queries posts, they only see published ones. You write the query once. The permissions handle the rest.

This is application-level Row-Level Security for D1 (which has no native RLS). It's not a separate layer you have to remember to apply. It's the default behavior of every query.

On top of permissions, `@cfast/db` provides a transparent caching layer. D1 is fast, but it's not edge-fast for read-heavy workloads. The cache sits between your queries and D1, using Cloudflare's Cache API or KV as the backend. Cache keys are permission-aware: an anonymous user's cached result for `posts` (filtered to `published = true`) is never served to an editor (who sees all posts). Mutations automatically invalidate the relevant cache entries.

## Design Goals

- **Permissions are not optional.** You cannot accidentally query without permission checks. The escape hatch (`db.unsafe()`) is explicit and loud.
- **Drizzle-native.** This is Drizzle with permissions injected, not a wrapper that happens to use Drizzle. You still write Drizzle queries. You still use Drizzle's type system.
- **Cached by default, correct by construction.** Read queries are cached automatically. Cache keys incorporate the user's role and the applied permission filters, so cache poisoning across roles is structurally impossible.
- **Mutations invalidate.** When you write to a table, the cache entries that depend on that table are invalidated. No manual cache-busting.
- **D1-optimized.** Respects D1's SQLite dialect, batch API, and transaction semantics.
- **Auditable.** Every guarded query can log what permissions were applied and why.

## Planned API

### Setup

```typescript
import { createDb } from "@cfast/db";
import { permissions } from "./permissions";
import * as schema from "./schema";

// In your Worker/loader:
const db = createDb({
  d1: env.DB,
  schema,
  permissions,
  user: currentUser, // from @cfast/auth - determines which permissions apply
  cache: {
    backend: "cache-api",  // "cache-api" | "kv" | false
    // Optional: KV binding if using KV backend
    // kv: env.CACHE,
  },
});
```

### Guarded Queries

Every query automatically has permission filters applied:

```typescript
// For an anonymous user, this becomes:
// SELECT * FROM posts WHERE published = true
const posts = await db.query(posts).findMany();

// For an editor, no filter is added:
// SELECT * FROM posts
const posts = await db.query(posts).findMany();

// You can still add your own filters - they compose with permission filters:
// SELECT * FROM posts WHERE published = true AND category = 'tech'
const techPosts = await db.query(posts).findMany({
  where: eq(posts.category, "tech"),
});
```

### Guarded Mutations

Mutations check permissions before executing:

```typescript
// Checks: can this user update this specific post?
await db.guarded(posts)
  .update({ title: "Updated" })
  .where(eq(posts.id, postId));

// Checks: can this user create a post?
await db.guarded(posts)
  .insert({ title: "New Post", authorId: user.id });

// Checks: can this user delete this specific post?
await db.guarded(posts)
  .delete()
  .where(eq(posts.id, postId));

// All of these throw ForbiddenError if the permission check fails
```

### Batch Operations

D1's batch API is supported with permission checks on each operation:

```typescript
const results = await db.batch([
  db.guarded(posts).insert({ title: "Post 1", authorId: user.id }),
  db.guarded(posts).insert({ title: "Post 2", authorId: user.id }),
  db.guarded(auditLogs).insert({ action: "bulk_create" }),
]);
// All three are permission-checked, then executed in a single D1 batch
```

### The Escape Hatch

Sometimes you need to bypass permissions (system operations, migrations, seeding):

```typescript
// This is explicit and greppable
const allPosts = await db.unsafe().query(posts).findMany();
```

### Permission Introspection

For debugging and admin UIs, you can see what permissions were applied:

```typescript
const query = db.query(posts).findMany();
console.log(query.appliedPermissions);
// [{ action: "read", table: "posts", filter: "published = true", role: "anonymous" }]
```

## Caching

### How It Works

Every read query that goes through `db.query()` is a cache candidate. The cache key is derived from:

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

When a mutation goes through `db.guarded()`, the cache entries for the affected table(s) are invalidated:

```typescript
// This insert invalidates all cached queries that touch the "posts" table
await db.guarded(posts).insert({ title: "New Post", authorId: user.id });

// The next read will miss the cache and hit D1
const freshPosts = await db.query(posts).findMany();
```

Invalidation is table-level by default. This is intentionally coarse-grained: it's simple, correct, and for D1 workloads the cost of a few extra cache misses is negligible compared to the complexity of row-level invalidation.

### Per-Query Cache Control

Override caching behavior on individual queries:

```typescript
// Skip the cache for this query (always hit D1)
const posts = await db.query(posts).findMany({ cache: false });

// Custom TTL for this query
const settings = await db.query(appSettings).findFirst({ cache: { ttl: "5m" } });

// Stale-while-revalidate: serve stale data immediately, refresh in background
const posts = await db.query(posts).findMany({
  cache: { ttl: "1m", staleWhileRevalidate: "5m" },
});
```

### Global Defaults

```typescript
const db = createDb({
  // ...
  cache: {
    backend: "cache-api",
    ttl: "30s",                   // Default TTL for all queries
    staleWhileRevalidate: "5m",   // Default SWR window
    // Tables that should never be cached
    exclude: ["sessions", "auditLogs"],
  },
});
```

### Cache Tags

For more targeted invalidation when table-level is too broad:

```typescript
// Tag a query
const userPosts = await db.query(posts).findMany({
  where: eq(posts.authorId, userId),
  cache: { tags: [`user:${userId}:posts`] },
});

// Invalidate by tag (e.g., when this specific user's posts change)
await db.cache.invalidate({ tags: [`user:${userId}:posts`] });
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

## Integration with @cfast/admin

`@cfast/admin` uses `@cfast/db` under the hood. The admin UI's CRUD operations go through the same permission system and cache layer. An admin sees all rows. A moderator sees what the moderator role allows. The admin UI doesn't have its own permission logic. It uses yours.
