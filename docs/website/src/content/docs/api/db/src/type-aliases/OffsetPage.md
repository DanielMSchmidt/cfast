---
editUrl: false
next: false
prev: false
title: "OffsetPage"
---

> **OffsetPage**\<`T`\> = `object`

Defined in: [packages/db/src/types.ts:137](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L137)

A page of results from offset-based pagination.

## Type Parameters

### T

`T`

The row type.

## Properties

### items

> **items**: `T`[]

Defined in: [packages/db/src/types.ts:139](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L139)

The items on this page.

***

### page

> **page**: `number`

Defined in: [packages/db/src/types.ts:143](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L143)

The current 1-based page number.

***

### total

> **total**: `number`

Defined in: [packages/db/src/types.ts:141](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L141)

Total number of matching rows across all pages.

***

### totalPages

> **totalPages**: `number`

Defined in: [packages/db/src/types.ts:145](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L145)

Total number of pages.
