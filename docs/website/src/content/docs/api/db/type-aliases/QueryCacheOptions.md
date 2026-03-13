---
editUrl: false
next: false
prev: false
title: "QueryCacheOptions"
---

> **QueryCacheOptions** = `false` \| \{ `staleWhileRevalidate?`: `string`; `tags?`: `string`[]; `ttl?`: `string`; \}

Defined in: [packages/db/src/types.ts:105](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L105)

Per-query cache control options.

Pass `false` to skip caching for a specific query, or an options object to
override the default [CacheConfig](/api/db/type-aliases/cacheconfig/) for that query.

## Type Declaration

`false`

\{ `staleWhileRevalidate?`: `string`; `tags?`: `string`[]; `ttl?`: `string`; \}

### staleWhileRevalidate?

> `optional` **staleWhileRevalidate**: `string`

Override the default stale-while-revalidate window for this query.

### tags?

> `optional` **tags**: `string`[]

Tags for targeted manual invalidation via `db.cache.invalidate({ tags })`.

### ttl?

> `optional` **ttl**: `string`

Override the default TTL for this query (e.g., `"5m"`, `"1h"`).

## Example

```ts
// Skip cache entirely
db.query(posts).findMany({ cache: false });

// Custom TTL and tags
db.query(posts).findMany({ cache: { ttl: "5m", tags: ["user-posts"] } });
```
