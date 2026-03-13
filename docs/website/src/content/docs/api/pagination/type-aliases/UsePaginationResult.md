---
editUrl: false
next: false
prev: false
title: "UsePaginationResult"
---

> **UsePaginationResult**\<`T`\> = `object`

Defined in: [packages/pagination/src/use-pagination.ts:24](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L24)

Return value of the [usePagination](/api/pagination/functions/usepagination/) hook.

## Type Parameters

### T

`T`

The item type in the paginated list.

## Properties

### hasMore

> **hasMore**: `boolean`

Defined in: [packages/pagination/src/use-pagination.ts:30](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L30)

`true` if there are more pages to fetch (a `nextCursor` exists).

***

### isLoading

> **isLoading**: `boolean`

Defined in: [packages/pagination/src/use-pagination.ts:32](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L32)

`true` while a page fetch is in flight.

***

### items

> **items**: `T`[]

Defined in: [packages/pagination/src/use-pagination.ts:26](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L26)

Accumulated, deduplicated items from all loaded pages.

***

### loadMore()

> **loadMore**: () => `void`

Defined in: [packages/pagination/src/use-pagination.ts:28](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L28)

Fetches the next page of results. No-op if already loading or no more pages.

#### Returns

`void`
