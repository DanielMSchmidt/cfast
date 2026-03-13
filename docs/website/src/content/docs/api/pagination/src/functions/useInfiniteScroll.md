---
editUrl: false
next: false
prev: false
title: "useInfiniteScroll"
---

> **useInfiniteScroll**\<`T`\>(`options?`): [`UseInfiniteScrollResult`](/api/pagination/src/type-aliases/useinfinitescrollresult/)\<`T`\>

Defined in: [packages/pagination/src/use-infinite-scroll.ts:41](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/pagination/src/use-infinite-scroll.ts#L41)

React hook for infinite scroll with automatic loading via IntersectionObserver.
Wraps [usePagination](/api/pagination/src/functions/usepagination/) and triggers `loadMore` when a sentinel element enters the viewport.

## Type Parameters

### T

`T` = `unknown`

## Parameters

### options?

[`UseInfiniteScrollOptions`](/api/pagination/src/type-aliases/useinfinitescrolloptions/)\<`T`\>

Optional configuration including `rootMargin` for the IntersectionObserver.

## Returns

[`UseInfiniteScrollResult`](/api/pagination/src/type-aliases/useinfinitescrollresult/)\<`T`\>

Items, a sentinel ref to attach to a DOM element, and loading state.

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
