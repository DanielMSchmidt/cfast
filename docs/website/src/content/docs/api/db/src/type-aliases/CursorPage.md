---
editUrl: false
next: false
prev: false
title: "CursorPage"
---

> **CursorPage**\<`T`\> = `object`

Defined in: [packages/db/src/types.ts:125](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L125)

A page of results from cursor-based pagination.

## Type Parameters

### T

`T`

The row type.

## Properties

### items

> **items**: `T`[]

Defined in: [packages/db/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L127)

The items on this page.

***

### nextCursor

> **nextCursor**: `string` \| `null`

Defined in: [packages/db/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L129)

Opaque cursor for the next page, or `null` if this is the last page.
