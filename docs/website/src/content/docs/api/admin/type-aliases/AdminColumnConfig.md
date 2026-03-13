---
editUrl: false
next: false
prev: false
title: "AdminColumnConfig"
---

> **AdminColumnConfig** = `object`

Defined in: [packages/admin/src/types.ts:321](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L321)

Metadata for a single column, produced by [introspectSchema](/api/admin/functions/introspectschema/).

Contains the information needed to render list columns, form fields,
and detail views for a database column.

## Properties

### columnType

> **columnType**: `string`

Defined in: [packages/admin/src/types.ts:329](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L329)

The Drizzle column type (e.g., `"SQLiteText"`, `"SQLiteInteger"`, `"SQLiteBoolean"`).

***

### dataType

> **dataType**: `string`

Defined in: [packages/admin/src/types.ts:327](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L327)

The Drizzle data type (e.g., `"string"`, `"number"`, `"boolean"`).

***

### enumValues?

> `optional` **enumValues**: `string`[]

Defined in: [packages/admin/src/types.ts:337](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L337)

Allowed enum values, if the column is an enum/text with constrained values.

***

### hasDefault

> **hasDefault**: `boolean`

Defined in: [packages/admin/src/types.ts:333](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L333)

Whether this column has a default value defined in the schema.

***

### isPrimaryKey

> **isPrimaryKey**: `boolean`

Defined in: [packages/admin/src/types.ts:335](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L335)

Whether this column is the table's primary key.

***

### label

> **label**: `string`

Defined in: [packages/admin/src/types.ts:325](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L325)

Human-readable label auto-generated from the column name (e.g., `"Created At"`).

***

### name

> **name**: `string`

Defined in: [packages/admin/src/types.ts:323](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L323)

The column name as defined in the Drizzle schema (e.g., `"created_at"`).

***

### referencesColumn?

> `optional` **referencesColumn**: `string`

Defined in: [packages/admin/src/types.ts:341](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L341)

The name of the foreign column this column references, if it's a foreign key.

***

### referencesTable?

> `optional` **referencesTable**: `string`

Defined in: [packages/admin/src/types.ts:339](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L339)

The name of the foreign table this column references, if it's a foreign key.

***

### required

> **required**: `boolean`

Defined in: [packages/admin/src/types.ts:331](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L331)

Whether this column is required in create/edit forms (non-null and no default).
