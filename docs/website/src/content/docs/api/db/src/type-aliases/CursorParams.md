---
editUrl: false
next: false
prev: false
title: "CursorParams"
---

> **CursorParams** = `object`

Defined in: [packages/db/src/types.ts:98](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L98)

Parsed cursor-based pagination parameters from a request URL.

## Properties

### cursor

> **cursor**: `string` \| `null`

Defined in: [packages/db/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L102)

The opaque cursor string, or `null` for the first page.

***

### limit

> **limit**: `number`

Defined in: [packages/db/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L104)

Maximum items per page.

***

### type

> **type**: `"cursor"`

Defined in: [packages/db/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L100)

Discriminant for cursor pagination.
