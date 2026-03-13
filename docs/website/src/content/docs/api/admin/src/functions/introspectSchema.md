---
editUrl: false
next: false
prev: false
title: "introspectSchema"
---

> **introspectSchema**(`schema`, `tableOverrides?`): [`AdminTableMeta`](/api/admin/src/type-aliases/admintablemeta/)[]

Defined in: [packages/admin/src/introspect.ts:110](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/introspect.ts#L110)

Introspect a Drizzle schema and produce AdminTableMeta for each visible table.

Auto-excludes auth-related tables (session, account, verification, passkey)
unless explicitly included via table overrides.

Applies user-provided overrides for labels, columns, sorting, etc.

## Parameters

### schema

`Record`\<`string`, `SQLiteTable`\>

### tableOverrides?

`Record`\<`string`, [`TableOverrides`](/api/admin/src/type-aliases/tableoverrides/)\>

## Returns

[`AdminTableMeta`](/api/admin/src/type-aliases/admintablemeta/)[]
