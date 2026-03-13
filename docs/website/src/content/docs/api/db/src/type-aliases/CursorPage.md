---
editUrl: false
next: false
prev: false
title: "CursorPage"
---

> **CursorPage**\<`T`\> = `object`

Defined in: [packages/db/src/types.ts:125](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L125)

A page of results from cursor-based pagination.

## Type Parameters

### T

`T`

The row type.

## Properties

### items

> **items**: `T`[]

Defined in: [packages/db/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L127)

The items on this page.

***

### nextCursor

> **nextCursor**: `string` \| `null`

Defined in: [packages/db/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L129)

Opaque cursor for the next page, or `null` if this is the last page.
