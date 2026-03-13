---
editUrl: false
next: false
prev: false
title: "useInfiniteScroll"
---

> **useInfiniteScroll**\<`T`\>(`options?`): [`UseInfiniteScrollResult`](/api/pagination/type-aliases/useinfinitescrollresult/)\<`T`\>

Defined in: [packages/pagination/src/use-infinite-scroll.ts:60](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-infinite-scroll.ts#L60)

React hook for infinite scroll with automatic loading via IntersectionObserver.

Wraps [usePagination](/api/pagination/functions/usepagination/) and triggers `loadMore` when a sentinel element enters
the viewport. Attach the returned `sentinelRef` to an empty `<div>` at the bottom
of your list to enable automatic page loading on scroll.

## Type Parameters

### T

`T` = `unknown`

The item type in the paginated list.

## Parameters

### options?

[`UseInfiniteScrollOptions`](/api/pagination/type-aliases/useinfinitescrolloptions/)\<`T`\>

Optional configuration including `rootMargin` for the IntersectionObserver and a custom key extractor.

## Returns

[`UseInfiniteScrollResult`](/api/pagination/type-aliases/useinfinitescrollresult/)\<`T`\>

A [UseInfiniteScrollResult](/api/pagination/type-aliases/useinfinitescrollresult/) with items, a sentinel ref, and loading state.

## Example

```tsx
import { useInfiniteScroll } from "@cfast/pagination";

function PostFeed() {
  const { items, sentinelRef, isLoading } = useInfiniteScroll<Post>();
  return (
    <>
      {items.map(post => <PostCard key={post.id} post={post} />)}
      <div ref={sentinelRef} />
      {isLoading && <Spinner />}
    </>
  );
}
```
