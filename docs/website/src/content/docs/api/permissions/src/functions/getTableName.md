---
editUrl: false
next: false
prev: false
title: "getTableName"
---

> **getTableName**(`table`): `string`

Defined in: [packages/permissions/src/types.ts:21](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L21)

Extracts the table name string from a Drizzle table reference.

## Parameters

### table

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

A Drizzle table object containing the `drizzle:Name` symbol.

## Returns

`string`

The table name, or `"unknown"` if the symbol is not present.
