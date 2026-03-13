---
editUrl: false
next: false
prev: false
title: "getTableName"
---

> **getTableName**(`table`): `string`

Defined in: [packages/permissions/src/types.ts:21](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/permissions/src/types.ts#L21)

Extracts the table name string from a Drizzle table reference.

## Parameters

### table

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

A Drizzle table object containing the `drizzle:Name` symbol.

## Returns

`string`

The table name, or `"unknown"` if the symbol is not present.
