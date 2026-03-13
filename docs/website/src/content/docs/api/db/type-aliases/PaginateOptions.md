---
editUrl: false
next: false
prev: false
title: "PaginateOptions"
---

> **PaginateOptions** = `object`

Defined in: [packages/db/src/types.ts:333](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L333)

Options for `db.query(table).paginate()`.

Combines query filtering with pagination-specific settings. The actual pagination
strategy (cursor vs. offset) is determined by the [PaginateParams](/api/db/type-aliases/paginateparams/) passed
alongside these options.

## Example

```ts
db.query(posts).paginate(params, {
  where: eq(posts.published, true),
  orderBy: desc(posts.createdAt),
  cursorColumns: [posts.createdAt, posts.id],
  orderDirection: "desc",
});
```

## Properties

### cache?

> `optional` **cache**: [`QueryCacheOptions`](/api/db/type-aliases/querycacheoptions/)

Defined in: [packages/db/src/types.ts:351](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L351)

Per-query cache control. Pass `false` to skip caching, or an object to customize.

***

### columns?

> `optional` **columns**: `Record`\<`string`, `boolean`\>

Defined in: [packages/db/src/types.ts:335](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L335)

Column selection (e.g., `{ id: true, title: true }`). Omit to select all columns.

***

### cursorColumns?

> `optional` **cursorColumns**: `unknown`[]

Defined in: [packages/db/src/types.ts:341](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L341)

Drizzle column references used for cursor-based ordering and comparison.

***

### orderBy?

> `optional` **orderBy**: `unknown`

Defined in: [packages/db/src/types.ts:339](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L339)

Ordering expression for offset pagination. Ignored for cursor pagination (uses `cursorColumns` instead).

***

### orderDirection?

> `optional` **orderDirection**: `"asc"` \| `"desc"`

Defined in: [packages/db/src/types.ts:343](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L343)

Sort direction for cursor pagination. Defaults to `"desc"`.

***

### where?

> `optional` **where**: `unknown`

Defined in: [packages/db/src/types.ts:337](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L337)

User-supplied filter condition (AND'd with permission filters at `.run()` time).

***

### with?

> `optional` **with**: `Record`\<`string`, `unknown`\>

Defined in: [packages/db/src/types.ts:349](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L349)

Drizzle relational query includes (e.g., `{ comments: true }`).

Note: Permission filters are only applied to the root table, not to joined relations.
