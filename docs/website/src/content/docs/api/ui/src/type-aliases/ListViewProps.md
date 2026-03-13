---
editUrl: false
next: false
prev: false
title: "ListViewProps"
---

> **ListViewProps**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:369](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L369)

Props for the ListView composite component.
Composes PageContainer, FilterBar, DataTable, EmptyState, BulkActionBar, and pagination.

## Type Parameters

### T

`T` = `unknown`

## Properties

### actions?

> `optional` **actions**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:396](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L396)

Action descriptor for row-level actions.

***

### breadcrumb?

> `optional` **breadcrumb**: [`BreadcrumbItem`](/api/ui/src/type-aliases/breadcrumbitem/)[]

Defined in: [packages/ui/src/types.ts:410](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L410)

Breadcrumb trail items.

***

### bulkActions?

> `optional` **bulkActions**: [`BulkAction`](/api/ui/src/type-aliases/bulkaction/)[]

Defined in: [packages/ui/src/types.ts:408](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L408)

Bulk actions shown when rows are selected.

***

### columns?

> `optional` **columns**: [`ColumnShorthand`](/api/ui/src/type-aliases/columnshorthand/)\<`T`\>[]

Defined in: [packages/ui/src/types.ts:394](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L394)

Column definitions or key strings for the data table.

***

### createAction?

> `optional` **createAction**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:402](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L402)

Action descriptor for the create button.

***

### createLabel?

> `optional` **createLabel**: `string`

Defined in: [packages/ui/src/types.ts:404](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L404)

Label for the create button. Defaults to "Create".

***

### data

> **data**: `object`

Defined in: [packages/ui/src/types.ts:373](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L373)

Paginated data with optional pagination controls.

#### currentPage?

> `optional` **currentPage**: `number`

Current page number (offset pagination).

#### goToPage()?

> `optional` **goToPage**: (`page`) => `void`

Navigate to a specific page (offset pagination).

##### Parameters

###### page

`number`

##### Returns

`void`

#### hasMore?

> `optional` **hasMore**: `boolean`

Whether more items are available (cursor pagination).

#### isLoading?

> `optional` **isLoading**: `boolean`

Whether data is currently being fetched.

#### items

> **items**: `T`[]

Array of row objects to display.

#### loadMore()?

> `optional` **loadMore**: () => `void`

Load the next page of items (cursor pagination).

##### Returns

`void`

#### total?

> `optional` **total**: `number`

Total number of matching records.

#### totalPages?

> `optional` **totalPages**: `number`

Total number of pages (offset pagination).

***

### filters?

> `optional` **filters**: [`FilterDef`](/api/ui/src/type-aliases/filterdef/)[]

Defined in: [packages/ui/src/types.ts:398](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L398)

Filter definitions for the FilterBar.

***

### searchable?

> `optional` **searchable**: `string`[]

Defined in: [packages/ui/src/types.ts:400](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L400)

Column names that support full-text search.

***

### selectable?

> `optional` **selectable**: `boolean`

Defined in: [packages/ui/src/types.ts:406](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L406)

Whether to enable row selection.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:392](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L392)

Drizzle table for column and filter type inference.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:371](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L371)

Page title displayed in the header.
