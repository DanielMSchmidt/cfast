---
editUrl: false
next: false
prev: false
title: "OffsetPage"
---

> **OffsetPage**\<`T`\> = `object`

Defined in: [packages/db/src/types.ts:305](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L305)

A page of results from offset-based pagination.

Includes total counts for rendering page navigation controls.

## Example

```ts
const page: OffsetPage<Post> = await db.query(posts)
  .paginate({ type: "offset", page: 1, limit: 20 })
  .run({});

console.log(`Page ${page.page} of ${page.totalPages} (${page.total} total)`);
```

## Type Parameters

### T

`T`

The row type.

## Properties

### items

> **items**: `T`[]

Defined in: [packages/db/src/types.ts:307](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L307)

The items on this page.

***

### page

> **page**: `number`

Defined in: [packages/db/src/types.ts:311](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L311)

The current 1-based page number.

***

### total

> **total**: `number`

Defined in: [packages/db/src/types.ts:309](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L309)

Total number of matching rows across all pages.

***

### totalPages

> **totalPages**: `number`

Defined in: [packages/db/src/types.ts:313](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L313)

Total number of pages (computed as `Math.ceil(total / limit)`).
