---
editUrl: false
next: false
prev: false
title: "FindManyOptions"
---

> **FindManyOptions** = `object`

Defined in: [packages/db/src/types.ts:177](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L177)

Options for `db.query(table).findMany()`.

The `where` condition is AND'd with any permission-based WHERE clauses
resolved from the user's grants.

## Example

```ts
import { eq, desc } from "drizzle-orm";

db.query(posts).findMany({
  columns: { id: true, title: true },
  where: eq(posts.category, "tech"),
  orderBy: desc(posts.createdAt),
  limit: 10,
  offset: 20,
  with: { comments: true },
  cache: { ttl: "5m", tags: ["posts"] },
});
```

## Properties

### cache?

> `optional` **cache**: [`QueryCacheOptions`](/api/db/type-aliases/querycacheoptions/)

Defined in: [packages/db/src/types.ts:195](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L195)

Per-query cache control. Pass `false` to skip caching, or an object to customize.

***

### columns?

> `optional` **columns**: `Record`\<`string`, `boolean`\>

Defined in: [packages/db/src/types.ts:179](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L179)

Column selection (e.g., `{ id: true, title: true }`). Omit to select all columns.

***

### limit?

> `optional` **limit**: `number`

Defined in: [packages/db/src/types.ts:185](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L185)

Maximum number of rows to return.

***

### offset?

> `optional` **offset**: `number`

Defined in: [packages/db/src/types.ts:187](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L187)

Number of rows to skip (for offset-based pagination).

***

### orderBy?

> `optional` **orderBy**: `unknown`

Defined in: [packages/db/src/types.ts:183](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L183)

Ordering expression (e.g., `desc(posts.createdAt)`).

***

### where?

> `optional` **where**: `unknown`

Defined in: [packages/db/src/types.ts:181](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L181)

User-supplied filter condition (AND'd with permission filters at `.run()` time).

***

### with?

> `optional` **with**: `Record`\<`string`, `unknown`\>

Defined in: [packages/db/src/types.ts:193](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L193)

Drizzle relational query includes (e.g., `{ comments: true }`).

Note: Permission filters are only applied to the root table, not to joined relations.
