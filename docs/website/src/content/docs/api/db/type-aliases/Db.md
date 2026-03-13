---
editUrl: false
next: false
prev: false
title: "Db"
---

> **Db** = `object`

Defined in: [packages/db/src/types.ts:375](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L375)

A permission-aware database instance bound to a specific user.

Created by [createDb](/api/db/functions/createdb/). All query and mutation methods return lazy [Operation](/api/db/type-aliases/operation/)
objects that check permissions at `.run()` time. Create a new instance per request --
sharing across requests would apply one user's permissions to another's queries.

## Example

```ts
// Read
const posts = await db.query(postsTable).findMany().run({});

// Write
await db.insert(postsTable).values({ title: "Hello" }).run({});

// Bypass permissions for system tasks
await db.unsafe().delete(sessionsTable).where(expired).run({});
```

## Properties

### batch()

> **batch**: (`operations`) => [`Operation`](/api/db/type-aliases/operation/)\<`unknown`[]\>

Defined in: [packages/db/src/types.ts:395](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L395)

Groups multiple operations into a single [Operation](/api/db/type-aliases/operation/) with merged, deduplicated permissions.
Operations are executed sequentially (not via D1 native batch).

#### Parameters

##### operations

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>[]

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`[]\>

***

### cache

> **cache**: `object`

Defined in: [packages/db/src/types.ts:397](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L397)

Cache control methods for manual invalidation.

#### invalidate()

> **invalidate**: (`options`) => `Promise`\<`void`\>

Invalidate cached queries by tag names and/or table names.

##### Parameters

###### options

###### tables?

`string`[]

Table names to invalidate (bumps their version counters).

###### tags?

`string`[]

Tag names to invalidate (from [QueryCacheOptions](/api/db/type-aliases/querycacheoptions/) `tags`).

##### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**: (`table`) => [`DeleteBuilder`](/api/db/type-aliases/deletebuilder/)

Defined in: [packages/db/src/types.ts:383](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L383)

Creates a [DeleteBuilder](/api/db/type-aliases/deletebuilder/) for deleting rows from the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

#### Returns

[`DeleteBuilder`](/api/db/type-aliases/deletebuilder/)

***

### insert()

> **insert**: (`table`) => [`InsertBuilder`](/api/db/type-aliases/insertbuilder/)

Defined in: [packages/db/src/types.ts:379](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L379)

Creates an [InsertBuilder](/api/db/type-aliases/insertbuilder/) for inserting rows into the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

#### Returns

[`InsertBuilder`](/api/db/type-aliases/insertbuilder/)

***

### query()

> **query**: (`table`) => [`QueryBuilder`](/api/db/type-aliases/querybuilder/)

Defined in: [packages/db/src/types.ts:377](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L377)

Creates a [QueryBuilder](/api/db/type-aliases/querybuilder/) for reading rows from the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

#### Returns

[`QueryBuilder`](/api/db/type-aliases/querybuilder/)

***

### unsafe()

> **unsafe**: () => `Db`

Defined in: [packages/db/src/types.ts:390](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L390)

Returns a new `Db` instance that skips all permission checks.

Use for cron jobs, migrations, and system operations without an authenticated user.
Every call site is greppable via `git grep '.unsafe()'`.

#### Returns

`Db`

***

### update()

> **update**: (`table`) => [`UpdateBuilder`](/api/db/type-aliases/updatebuilder/)

Defined in: [packages/db/src/types.ts:381](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L381)

Creates an [UpdateBuilder](/api/db/type-aliases/updatebuilder/) for updating rows in the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

#### Returns

[`UpdateBuilder`](/api/db/type-aliases/updatebuilder/)
