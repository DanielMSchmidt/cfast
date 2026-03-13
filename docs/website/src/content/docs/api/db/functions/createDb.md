---
editUrl: false
next: false
prev: false
title: "createDb"
---

> **createDb**(`config`): [`Db`](/api/db/type-aliases/db/)

Defined in: [packages/db/src/create-db.ts:35](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/create-db.ts#L35)

Creates a permission-aware database instance bound to the given user.

Call this once per request, passing the authenticated user. The returned [Db](/api/db/type-aliases/db/) instance
applies permission checks and WHERE clause injection on every [Operation](/api/db/type-aliases/operation/).
Sharing a `Db` across requests would apply one user's permissions to another's queries.

## Parameters

### config

[`DbConfig`](/api/db/type-aliases/dbconfig/)

Database configuration including D1 binding, schema, grants, and user.

## Returns

[`Db`](/api/db/type-aliases/db/)

A [Db](/api/db/type-aliases/db/) instance with query, insert, update, delete, unsafe, batch, and cache methods.

## Example

```ts
import { createDb } from "@cfast/db";
import * as schema from "./schema";

const db = createDb({
  d1: env.DB,
  schema,
  grants: resolvedGrants,
  user: currentUser,
  cache: { backend: "cache-api" },
});

// All operations check permissions at .run() time
const posts = await db.query(postsTable).findMany().run({});
```
