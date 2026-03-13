---
editUrl: false
next: false
prev: false
title: "DataTableProps"
---

> **DataTableProps**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:506](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L506)

Props for the DataTable component.

Renders a sortable, selectable data table with permission-aware row actions.
Integrates with `@cfast/pagination` for data, `@cfast/db` for column inference,
`@cfast/permissions` for action visibility, and `@cfast/actions` for row-level
operations.

## See

 - [ColumnShorthand](/api/ui/type-aliases/columnshorthand/) for column configuration options.
 - [ListViewProps](/api/ui/type-aliases/listviewprops/) which composes DataTable with filters and pagination.

## Type Parameters

### T

`T` = `unknown`

The row object type for type-safe column rendering and selection callbacks.

## Properties

### actions?

> `optional` **actions**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:519](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L519)

Action descriptor for row-level actions.

***

### columns?

> `optional` **columns**: [`ColumnShorthand`](/api/ui/type-aliases/columnshorthand/)\<`T`\>[]

Defined in: [packages/ui/src/types.ts:517](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L517)

Column definitions or key strings.

***

### data

> **data**: `object`

Defined in: [packages/ui/src/types.ts:508](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L508)

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

Defined in: [packages/ui/src/types.ts:531](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L531)

Message shown when there are no items.

***

### getRowId()?

> `optional` **getRowId**: (`row`) => `string` \| `number`

Defined in: [packages/ui/src/types.ts:529](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L529)

Function to extract a unique ID from a row. Defaults to `row.id`.

#### Parameters

##### row

`T`

#### Returns

`string` \| `number`

***

### onRowClick()?

> `optional` **onRowClick**: (`row`) => `void`

Defined in: [packages/ui/src/types.ts:527](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L527)

Callback when a row is clicked.

#### Parameters

##### row

`T`

#### Returns

`void`

***

### onSelectionChange()?

> `optional` **onSelectionChange**: (`rows`) => `void`

Defined in: [packages/ui/src/types.ts:525](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L525)

Callback when row selection changes.

#### Parameters

##### rows

`T`[]

#### Returns

`void`

***

### selectable?

> `optional` **selectable**: `boolean`

Defined in: [packages/ui/src/types.ts:521](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L521)

Whether to show row selection checkboxes.

***

### selectedRows?

> `optional` **selectedRows**: `T`[]

Defined in: [packages/ui/src/types.ts:523](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L523)

Externally controlled selected rows.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:515](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L515)

Drizzle table for column type inference.
