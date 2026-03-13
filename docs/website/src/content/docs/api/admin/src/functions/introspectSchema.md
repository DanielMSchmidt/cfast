---
editUrl: false
next: false
prev: false
title: "introspectSchema"
---

> **introspectSchema**(`schema`, `tableOverrides?`): [`AdminTableMeta`](/api/admin/src/type-aliases/admintablemeta/)[]

Defined in: [packages/admin/src/introspect.ts:110](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/introspect.ts#L110)

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
