---
editUrl: false
next: false
prev: false
title: "CacheConfig"
---

> **CacheConfig** = `object`

Defined in: [packages/db/src/types.ts:71](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L71)

Configuration for the database cache layer.

Controls how query results are cached and invalidated. Mutations automatically
bump table version counters, causing subsequent reads to miss the cache.

## Example

```ts
const db = createDb({
  d1: env.DB,
  schema,
  grants: resolvedGrants,
  user: currentUser,
  cache: {
    backend: "cache-api",
    ttl: "30s",
    staleWhileRevalidate: "5m",
    exclude: ["sessions"],
  },
});
```

## Properties

### backend

> **backend**: [`CacheBackend`](/api/db/type-aliases/cachebackend/)

Defined in: [packages/db/src/types.ts:73](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L73)

Which cache backend to use: edge-local Cache API or global KV.

***

### exclude?

> `optional` **exclude**: `string`[]

Defined in: [packages/db/src/types.ts:81](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L81)

Table names that should never be cached (e.g., `["sessions", "tokens"]`).

***

### kv?

> `optional` **kv**: `KVNamespace`

Defined in: [packages/db/src/types.ts:75](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L75)

KV namespace binding. Required when [backend](/api/db/type-aliases/cacheconfig/#backend) is `"kv"`.

***

### onHit()?

> `optional` **onHit**: (`key`, `table`) => `void`

Defined in: [packages/db/src/types.ts:83](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L83)

Observability hook called on cache hits.

#### Parameters

##### key

`string`

##### table

`string`

#### Returns

`void`

***

### onInvalidate()?

> `optional` **onInvalidate**: (`tables`) => `void`

Defined in: [packages/db/src/types.ts:87](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L87)

Observability hook called when tables are invalidated by mutations.

#### Parameters

##### tables

`string`[]

#### Returns

`void`

***

### onMiss()?

> `optional` **onMiss**: (`key`, `table`) => `void`

Defined in: [packages/db/src/types.ts:85](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L85)

Observability hook called on cache misses.

#### Parameters

##### key

`string`

##### table

`string`

#### Returns

`void`

***

### staleWhileRevalidate?

> `optional` **staleWhileRevalidate**: `string`

Defined in: [packages/db/src/types.ts:79](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L79)

Stale-while-revalidate window (e.g., `"5m"`). Serves stale data while revalidating in the background.

***

### ttl?

> `optional` **ttl**: `string`

Defined in: [packages/db/src/types.ts:77](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L77)

Default TTL for cached queries (e.g., `"30s"`, `"5m"`, `"1h"`). Defaults to `"60s"`.
