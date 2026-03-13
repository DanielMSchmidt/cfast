---
editUrl: false
next: false
prev: false
title: "AdminTableMeta"
---

> **AdminTableMeta** = `object`

Defined in: [packages/admin/src/types.ts:350](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L350)

Complete metadata for a database table, produced by [introspectSchema](/api/admin/functions/introspectschema/).

Combines introspected column information with user-provided overrides.
Used by the admin loader, action, and component to render views.

## Properties

### columns

> **columns**: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]

Defined in: [packages/admin/src/types.ts:358](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L358)

Introspected column metadata for every column in this table.

***

### defaultSort

> **defaultSort**: `object`

Defined in: [packages/admin/src/types.ts:366](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L366)

Default sort order for the list view.

#### column

> **column**: `string`

#### direction

> **direction**: `"asc"` \| `"desc"`

***

### drizzleTable

> **drizzleTable**: `SQLiteTable`

Defined in: [packages/admin/src/types.ts:356](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L356)

The original Drizzle table object, used for queries and form generation.

***

### label

> **label**: `string`

Defined in: [packages/admin/src/types.ts:354](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L354)

Human-readable label for display in the sidebar and views (e.g., `"Blog Posts"`).

***

### listColumns

> **listColumns**: `string`[]

Defined in: [packages/admin/src/types.ts:364](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L364)

Column names shown in the list view.

***

### name

> **name**: `string`

Defined in: [packages/admin/src/types.ts:352](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L352)

The Drizzle table name (e.g., `"posts"`).

***

### overrides

> **overrides**: [`TableOverrides`](/api/admin/type-aliases/tableoverrides/)

Defined in: [packages/admin/src/types.ts:368](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L368)

User-provided overrides applied to this table. See [TableOverrides](/api/admin/type-aliases/tableoverrides/).

***

### primaryKey

> **primaryKey**: `string`

Defined in: [packages/admin/src/types.ts:360](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L360)

The name of the primary key column (e.g., `"id"`).

***

### searchableColumns

> **searchableColumns**: `string`[]

Defined in: [packages/admin/src/types.ts:362](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L362)

Column names that support text search in the list view.
