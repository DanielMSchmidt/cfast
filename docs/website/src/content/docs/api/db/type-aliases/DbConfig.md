---
editUrl: false
next: false
prev: false
title: "DbConfig"
---

> **DbConfig** = `object`

Defined in: [packages/db/src/types.ts:135](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L135)

Configuration for [createDb](/api/db/functions/createdb/).

## Example

```ts
import { createDb } from "@cfast/db";
import * as schema from "./schema";

const db = createDb({
  d1: env.DB,
  schema,
  grants: resolvedGrants,
  user: { id: "user-123" },
  cache: { backend: "cache-api" },
});
```

## Properties

### cache?

> `optional` **cache**: [`CacheConfig`](/api/db/type-aliases/cacheconfig/) \| `false`

Defined in: [packages/db/src/types.ts:151](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L151)

Cache configuration, or `false` to disable caching entirely. Defaults to `{ backend: "cache-api" }`.

***

### d1

> **d1**: `D1Database`

Defined in: [packages/db/src/types.ts:137](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L137)

The Cloudflare D1 database binding from `env.DB`.

***

### grants

> **grants**: [`Grant`](/api/permissions/type-aliases/grant/)[]

Defined in: [packages/db/src/types.ts:144](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L144)

Resolved permission grants for the current user's role, from `resolveGrants()`.

***

### schema

> **schema**: `Record`\<`string`, [`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)\>

Defined in: [packages/db/src/types.ts:142](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L142)

Drizzle schema object. Must be `import * as schema` so that keys match
table variable names (required by Drizzle's relational query API).

***

### user

> **user**: \{ `id`: `string`; \} \| `null`

Defined in: [packages/db/src/types.ts:149](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L149)

The current user, or `null` for anonymous access.
When `null`, the `"anonymous"` role is used for permission checks.
