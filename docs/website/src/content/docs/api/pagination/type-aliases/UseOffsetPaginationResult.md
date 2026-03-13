---
editUrl: false
next: false
prev: false
title: "UseOffsetPaginationResult"
---

> **UseOffsetPaginationResult**\<`T`\> = `object`

Defined in: [packages/pagination/src/use-offset-pagination.ts:16](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L16)

Return value of the [useOffsetPagination](/api/pagination/functions/useoffsetpagination/) hook.

## Type Parameters

### T

`T`

The item type in the paginated list.

## Properties

### currentPage

> **currentPage**: `number`

Defined in: [packages/pagination/src/use-offset-pagination.ts:24](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L24)

The current 1-based page number.

***

### goToPage()

> **goToPage**: (`page`) => `void`

Defined in: [packages/pagination/src/use-offset-pagination.ts:26](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L26)

Navigates to the given 1-based page number by updating the URL search params.

#### Parameters

##### page

`number`

#### Returns

`void`

***

### items

> **items**: `T`[]

Defined in: [packages/pagination/src/use-offset-pagination.ts:18](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L18)

Items for the current page.

***

### total

> **total**: `number`

Defined in: [packages/pagination/src/use-offset-pagination.ts:20](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L20)

Total number of items across all pages.

***

### totalPages

> **totalPages**: `number`

Defined in: [packages/pagination/src/use-offset-pagination.ts:22](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L22)

Total number of pages available.
