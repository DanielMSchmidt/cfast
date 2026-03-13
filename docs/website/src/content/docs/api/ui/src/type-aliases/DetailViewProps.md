---
editUrl: false
next: false
prev: false
title: "DetailViewProps"
---

> **DetailViewProps**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:419](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L419)

Props for the DetailView composite component.
Displays a single record's fields in a two-column grid with an action toolbar.

## Type Parameters

### T

`T` = `unknown`

## Properties

### actions?

> `optional` **actions**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:431](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L431)

Action descriptor for the action toolbar.

***

### breadcrumb?

> `optional` **breadcrumb**: [`BreadcrumbItem`](/api/ui/src/type-aliases/breadcrumbitem/)[]

Defined in: [packages/ui/src/types.ts:433](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L433)

Breadcrumb trail items.

***

### exclude?

> `optional` **exclude**: `string`[]

Defined in: [packages/ui/src/types.ts:429](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L429)

Field keys to exclude from display.

***

### fields?

> `optional` **fields**: [`ColumnShorthand`](/api/ui/src/type-aliases/columnshorthand/)\<`T`\>[]

Defined in: [packages/ui/src/types.ts:427](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L427)

Field definitions or key strings. If omitted, fields are inferred from the record.

***

### record

> **record**: `T`

Defined in: [packages/ui/src/types.ts:425](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L425)

The record object to display.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:423](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L423)

Drizzle table for field type inference.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:421](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L421)

Page title, typically the record's display name.
