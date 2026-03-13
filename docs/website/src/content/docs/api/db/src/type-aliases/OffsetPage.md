---
editUrl: false
next: false
prev: false
title: "OffsetPage"
---

> **OffsetPage**\<`T`\> = `object`

Defined in: [packages/db/src/types.ts:137](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L137)

A page of results from offset-based pagination.

## Type Parameters

### T

`T`

The row type.

## Properties

### items

> **items**: `T`[]

Defined in: [packages/db/src/types.ts:139](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L139)

The items on this page.

***

### page

> **page**: `number`

Defined in: [packages/db/src/types.ts:143](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L143)

The current 1-based page number.

***

### total

> **total**: `number`

Defined in: [packages/db/src/types.ts:141](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L141)

Total number of matching rows across all pages.

***

### totalPages

> **totalPages**: `number`

Defined in: [packages/db/src/types.ts:145](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L145)

Total number of pages.
