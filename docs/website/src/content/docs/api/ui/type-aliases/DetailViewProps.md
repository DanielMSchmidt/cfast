---
editUrl: false
next: false
prev: false
title: "DetailViewProps"
---

> **DetailViewProps**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:633](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L633)

Props for the DetailView composite component.

Displays a single record's fields in a two-column grid with a permission-aware
action toolbar. Fields render using the appropriate TypedField component
([DateFieldProps](/api/ui/type-aliases/datefieldprops/), [BooleanFieldProps](/api/ui/type-aliases/booleanfieldprops/), etc.) based on the Drizzle
column type. Override individual fields with custom `render` functions.

## See

 - [ColumnShorthand](/api/ui/type-aliases/columnshorthand/) for field configuration options.
 - [ListViewProps](/api/ui/type-aliases/listviewprops/) for the multi-record counterpart.

## Type Parameters

### T

`T` = `unknown`

The record object type for type-safe field rendering.

## Properties

### actions?

> `optional` **actions**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:645](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L645)

Action descriptor for the action toolbar.

***

### breadcrumb?

> `optional` **breadcrumb**: [`BreadcrumbItem`](/api/ui/type-aliases/breadcrumbitem/)[]

Defined in: [packages/ui/src/types.ts:647](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L647)

Breadcrumb trail items.

***

### exclude?

> `optional` **exclude**: `string`[]

Defined in: [packages/ui/src/types.ts:643](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L643)

Field keys to exclude from display.

***

### fields?

> `optional` **fields**: [`ColumnShorthand`](/api/ui/type-aliases/columnshorthand/)\<`T`\>[]

Defined in: [packages/ui/src/types.ts:641](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L641)

Field definitions or key strings. If omitted, fields are inferred from the record.

***

### record

> **record**: `T`

Defined in: [packages/ui/src/types.ts:639](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L639)

The record object to display.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:637](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L637)

Drizzle table for field type inference.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:635](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L635)

Page title, typically the record's display name.
