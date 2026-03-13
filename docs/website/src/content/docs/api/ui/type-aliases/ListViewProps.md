---
editUrl: false
next: false
prev: false
title: "ListViewProps"
---

> **ListViewProps**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:574](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L574)

Props for the ListView composite component.

Composes [PageContainerSlotProps](/api/ui/type-aliases/pagecontainerslotprops/), [FilterBarProps](/api/ui/type-aliases/filterbarprops/), [DataTableProps](/api/ui/type-aliases/datatableprops/),
[EmptyStateProps](/api/ui/type-aliases/emptystateprops/), [BulkAction](/api/ui/type-aliases/bulkaction/), and pagination controls into a full page
layout. This is the primary component `@cfast/admin` uses for every table view.
Handles loading/empty/data state transitions automatically.

## See

 - [DataTableProps](/api/ui/type-aliases/datatableprops/) for the table configuration subset.
 - [DetailViewProps](/api/ui/type-aliases/detailviewprops/) for the single-record counterpart.

## Type Parameters

### T

`T` = `unknown`

The row object type, forwarded to column rendering and selection.

## Properties

### actions?

> `optional` **actions**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:601](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L601)

Action descriptor for row-level actions.

***

### breadcrumb?

> `optional` **breadcrumb**: [`BreadcrumbItem`](/api/ui/type-aliases/breadcrumbitem/)[]

Defined in: [packages/ui/src/types.ts:615](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L615)

Breadcrumb trail items.

***

### bulkActions?

> `optional` **bulkActions**: [`BulkAction`](/api/ui/type-aliases/bulkaction/)[]

Defined in: [packages/ui/src/types.ts:613](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L613)

Bulk actions shown when rows are selected.

***

### columns?

> `optional` **columns**: [`ColumnShorthand`](/api/ui/type-aliases/columnshorthand/)\<`T`\>[]

Defined in: [packages/ui/src/types.ts:599](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L599)

Column definitions or key strings for the data table.

***

### createAction?

> `optional` **createAction**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:607](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L607)

Action descriptor for the create button.

***

### createLabel?

> `optional` **createLabel**: `string`

Defined in: [packages/ui/src/types.ts:609](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L609)

Label for the create button. Defaults to "Create".

***

### data

> **data**: `object`

Defined in: [packages/ui/src/types.ts:578](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L578)

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

> `optional` **filters**: [`FilterDef`](/api/ui/type-aliases/filterdef/)[]

Defined in: [packages/ui/src/types.ts:603](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L603)

Filter definitions for the FilterBar.

***

### searchable?

> `optional` **searchable**: `string`[]

Defined in: [packages/ui/src/types.ts:605](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L605)

Column names that support full-text search.

***

### selectable?

> `optional` **selectable**: `boolean`

Defined in: [packages/ui/src/types.ts:611](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L611)

Whether to enable row selection.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:597](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L597)

Drizzle table for column and filter type inference.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:576](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L576)

Page title displayed in the header.
