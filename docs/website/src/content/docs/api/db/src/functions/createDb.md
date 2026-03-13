---
editUrl: false
next: false
prev: false
title: "createDb"
---

> **createDb**(`config`): [`Db`](/api/db/src/type-aliases/db/)

Defined in: [packages/db/src/create-db.ts:32](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/create-db.ts#L32)

Creates a permission-aware database instance bound to the given user.

Call this once per request, passing the authenticated user. The returned `Db` instance
applies permission checks and WHERE clause injection on every operation.

## Parameters

### config

[`DbConfig`](/api/db/src/type-aliases/dbconfig/)

Database configuration including D1 binding, schema, grants, and user.

## Returns

[`Db`](/api/db/src/type-aliases/db/)

A `Db` instance with query, insert, update, delete, unsafe, batch, and cache methods.

## Example

```ts
import { createDb } from '@cfast/db';

const db = createDb({
  d1: env.DB,
  schema,
  grants: resolvedGrants,
  user: currentUser,
  cache: { backend: 'cache-api' },
});

const posts = await db.query(postsTable).findMany().run({});
```
