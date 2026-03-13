---
editUrl: false
next: false
prev: false
title: "DbConfig"
---

> **DbConfig** = `object`

Defined in: [packages/db/src/types.ts:59](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L59)

Configuration for [createDb](/api/db/src/functions/createdb/).

## Properties

### cache?

> `optional` **cache**: [`CacheConfig`](/api/db/src/type-aliases/cacheconfig/) \| `false`

Defined in: [packages/db/src/types.ts:69](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L69)

Cache configuration, or `false` to disable caching entirely. Defaults to `{ backend: "cache-api" }`.

***

### d1

> **d1**: `D1Database`

Defined in: [packages/db/src/types.ts:61](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L61)

The Cloudflare D1 database binding.

***

### grants

> **grants**: [`Grant`](/api/permissions/src/type-aliases/grant/)[]

Defined in: [packages/db/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L65)

Resolved permission grants for the current user's role.

***

### schema

> **schema**: `Record`\<`string`, [`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)\>

Defined in: [packages/db/src/types.ts:63](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L63)

Drizzle schema (`import * as schema` -- keys must match table variable names).

***

### user

> **user**: \{ `id`: `string`; \} \| `null`

Defined in: [packages/db/src/types.ts:67](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L67)

The current user. `null` means anonymous (uses `"anonymous"` role for checks).
