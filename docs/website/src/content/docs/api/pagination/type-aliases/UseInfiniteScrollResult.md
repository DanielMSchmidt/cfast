---
editUrl: false
next: false
prev: false
title: "UseInfiniteScrollResult"
---

> **UseInfiniteScrollResult**\<`T`\> = `object`

Defined in: [packages/pagination/src/use-infinite-scroll.ts:22](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-infinite-scroll.ts#L22)

Return value of the [useInfiniteScroll](/api/pagination/functions/useinfinitescroll/) hook.

## Type Parameters

### T

`T`

The item type in the paginated list.

## Properties

### hasMore

> **hasMore**: `boolean`

Defined in: [packages/pagination/src/use-infinite-scroll.ts:28](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-infinite-scroll.ts#L28)

`true` if there are more pages to fetch.

***

### isLoading

> **isLoading**: `boolean`

Defined in: [packages/pagination/src/use-infinite-scroll.ts:30](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-infinite-scroll.ts#L30)

`true` while a page fetch is in flight.

***

### items

> **items**: `T`[]

Defined in: [packages/pagination/src/use-infinite-scroll.ts:24](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-infinite-scroll.ts#L24)

Accumulated, deduplicated items from all loaded pages.

***

### sentinelRef

> **sentinelRef**: `RefObject`\<`Element` \| `null`\>

Defined in: [packages/pagination/src/use-infinite-scroll.ts:26](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-infinite-scroll.ts#L26)

Ref to attach to a sentinel DOM element. Loading triggers when it enters the viewport.
