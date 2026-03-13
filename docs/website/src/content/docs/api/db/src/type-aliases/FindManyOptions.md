---
editUrl: false
next: false
prev: false
title: "FindManyOptions"
---

> **FindManyOptions** = `object`

Defined in: [packages/db/src/types.ts:75](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L75)

Options for `db.query(table).findMany()`.

## Properties

### cache?

> `optional` **cache**: [`QueryCacheOptions`](/api/db/src/type-aliases/querycacheoptions/)

Defined in: [packages/db/src/types.ts:89](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L89)

Per-query cache control.

***

### columns?

> `optional` **columns**: `Record`\<`string`, `boolean`\>

Defined in: [packages/db/src/types.ts:77](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L77)

Column selection (e.g., `{ id: true, title: true }`).

***

### limit?

> `optional` **limit**: `number`

Defined in: [packages/db/src/types.ts:83](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L83)

Maximum number of rows to return.

***

### offset?

> `optional` **offset**: `number`

Defined in: [packages/db/src/types.ts:85](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L85)

Number of rows to skip (for offset pagination).

***

### orderBy?

> `optional` **orderBy**: `unknown`

Defined in: [packages/db/src/types.ts:81](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L81)

Ordering expression (e.g., `desc(posts.createdAt)`).

***

### where?

> `optional` **where**: `unknown`

Defined in: [packages/db/src/types.ts:79](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L79)

User-supplied filter condition (AND'd with permission filters).

***

### with?

> `optional` **with**: `Record`\<`string`, `unknown`\>

Defined in: [packages/db/src/types.ts:87](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L87)

Drizzle relational query includes (e.g., `{ comments: true }`).
