---
editUrl: false
next: false
prev: false
title: "CursorPage"
---

> **CursorPage**\<`T`\> = `object`

Defined in: [packages/db/src/types.ts:282](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L282)

A page of results from cursor-based pagination.

Use `nextCursor` to fetch the next page. When `nextCursor` is `null`, there are no more pages.

## Example

```ts
const page: CursorPage<Post> = await db.query(posts)
  .paginate({ type: "cursor", cursor: null, limit: 20 })
  .run({});

if (page.nextCursor) {
  // Fetch next page with page.nextCursor
}
```

## Type Parameters

### T

`T`

The row type.

## Properties

### items

> **items**: `T`[]

Defined in: [packages/db/src/types.ts:284](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L284)

The items on this page.

***

### nextCursor

> **nextCursor**: `string` \| `null`

Defined in: [packages/db/src/types.ts:286](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L286)

Opaque cursor for the next page, or `null` if this is the last page.
