---
editUrl: false
next: false
prev: false
title: "UseInfiniteScrollOptions"
---

> **UseInfiniteScrollOptions**\<`T`\> = [`UsePaginationOptions`](/api/pagination/type-aliases/usepaginationoptions/)\<`T`\> & `object`

Defined in: [packages/pagination/src/use-infinite-scroll.ts:12](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/pagination/src/use-infinite-scroll.ts#L12)

Options for the [useInfiniteScroll](/api/pagination/functions/useinfinitescroll/) hook.

Extends [UsePaginationOptions](/api/pagination/type-aliases/usepaginationoptions/) with IntersectionObserver configuration.

## Type Declaration

### rootMargin?

> `optional` **rootMargin**: `string`

Margin around the root for the IntersectionObserver (e.g., `"200px"`). Defaults to `"200px"`.

## Type Parameters

### T

`T`

The item type in the paginated list.
