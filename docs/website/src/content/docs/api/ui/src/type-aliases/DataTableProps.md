---
editUrl: false
next: false
prev: false
title: "DataTableProps"
---

> **DataTableProps**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:316](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L316)

Props for the DataTable component.
Renders a sortable, selectable table with row actions.

## Type Parameters

### T

`T` = `unknown`

## Properties

### actions?

> `optional` **actions**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:329](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L329)

Action descriptor for row-level actions.

***

### columns?

> `optional` **columns**: [`ColumnShorthand`](/api/ui/src/type-aliases/columnshorthand/)\<`T`\>[]

Defined in: [packages/ui/src/types.ts:327](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L327)

Column definitions or key strings.

***

### data

> **data**: `object`

Defined in: [packages/ui/src/types.ts:318](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L318)

Paginated data including items and loading state.

#### isLoading?

> `optional` **isLoading**: `boolean`

Whether data is currently being fetched.

#### items

> **items**: `T`[]

Array of row objects to display.

***

### emptyMessage?

> `optional` **emptyMessage**: `string`

Defined in: [packages/ui/src/types.ts:341](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L341)

Message shown when there are no items.

***

### getRowId()?

> `optional` **getRowId**: (`row`) => `string` \| `number`

Defined in: [packages/ui/src/types.ts:339](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L339)

Function to extract a unique ID from a row. Defaults to `row.id`.

#### Parameters

##### row

`T`

#### Returns

`string` \| `number`

***

### onRowClick()?

> `optional` **onRowClick**: (`row`) => `void`

Defined in: [packages/ui/src/types.ts:337](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L337)

Callback when a row is clicked.

#### Parameters

##### row

`T`

#### Returns

`void`

***

### onSelectionChange()?

> `optional` **onSelectionChange**: (`rows`) => `void`

Defined in: [packages/ui/src/types.ts:335](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L335)

Callback when row selection changes.

#### Parameters

##### rows

`T`[]

#### Returns

`void`

***

### selectable?

> `optional` **selectable**: `boolean`

Defined in: [packages/ui/src/types.ts:331](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L331)

Whether to show row selection checkboxes.

***

### selectedRows?

> `optional` **selectedRows**: `T`[]

Defined in: [packages/ui/src/types.ts:333](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L333)

Externally controlled selected rows.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:325](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L325)

Drizzle table for column type inference.
