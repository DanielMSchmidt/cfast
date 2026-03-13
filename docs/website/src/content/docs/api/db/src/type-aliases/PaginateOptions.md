---
editUrl: false
next: false
prev: false
title: "PaginateOptions"
---

> **PaginateOptions** = `object`

Defined in: [packages/db/src/types.ts:149](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L149)

Options for `db.query(table).paginate()`.

## Properties

### cache?

> `optional` **cache**: [`QueryCacheOptions`](/api/db/src/type-aliases/querycacheoptions/)

Defined in: [packages/db/src/types.ts:163](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L163)

Per-query cache control.

***

### columns?

> `optional` **columns**: `Record`\<`string`, `boolean`\>

Defined in: [packages/db/src/types.ts:151](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L151)

Column selection.

***

### cursorColumns?

> `optional` **cursorColumns**: `unknown`[]

Defined in: [packages/db/src/types.ts:157](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L157)

Columns used for cursor-based ordering and comparison.

***

### orderBy?

> `optional` **orderBy**: `unknown`

Defined in: [packages/db/src/types.ts:155](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L155)

Ordering expression.

***

### orderDirection?

> `optional` **orderDirection**: `"asc"` \| `"desc"`

Defined in: [packages/db/src/types.ts:159](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L159)

Sort direction for cursor pagination. Defaults to `"desc"`.

***

### where?

> `optional` **where**: `unknown`

Defined in: [packages/db/src/types.ts:153](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L153)

User-supplied filter condition (AND'd with permission filters).

***

### with?

> `optional` **with**: `Record`\<`string`, `unknown`\>

Defined in: [packages/db/src/types.ts:161](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L161)

Drizzle relational query includes.
