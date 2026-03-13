---
editUrl: false
next: false
prev: false
title: "CacheConfig"
---

> **CacheConfig** = `object`

Defined in: [packages/db/src/types.ts:28](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L28)

Configuration for the database cache layer.

## Properties

### backend

> **backend**: [`CacheBackend`](/api/db/src/type-aliases/cachebackend/)

Defined in: [packages/db/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L30)

Which cache backend to use: edge-local Cache API or global KV.

***

### exclude?

> `optional` **exclude**: `string`[]

Defined in: [packages/db/src/types.ts:38](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L38)

Table names that should never be cached.

***

### kv?

> `optional` **kv**: `KVNamespace`

Defined in: [packages/db/src/types.ts:32](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L32)

KV namespace binding (required when `backend` is `"kv"`).

***

### onHit()?

> `optional` **onHit**: (`key`, `table`) => `void`

Defined in: [packages/db/src/types.ts:40](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L40)

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

Defined in: [packages/db/src/types.ts:44](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L44)

Observability hook called when tables are invalidated.

#### Parameters

##### tables

`string`[]

#### Returns

`void`

***

### onMiss()?

> `optional` **onMiss**: (`key`, `table`) => `void`

Defined in: [packages/db/src/types.ts:42](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L42)

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

Defined in: [packages/db/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L36)

Stale-while-revalidate window (e.g., `"5m"`).

***

### ttl?

> `optional` **ttl**: `string`

Defined in: [packages/db/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L34)

Default TTL for cached queries (e.g., `"30s"`, `"5m"`, `"1h"`). Defaults to `"60s"`.
