---
editUrl: false
next: false
prev: false
title: "getTableName"
---

> **getTableName**(`table`): `string`

Defined in: [packages/permissions/src/types.ts:26](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L26)

Extracts the table name string from a Drizzle table reference.

## Parameters

### table

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

A Drizzle table object containing the `drizzle:Name` symbol.

## Returns

`string`

The table name, or `"unknown"` if the symbol is not present.
