---
editUrl: false
next: false
prev: false
title: "usePagination"
---

> **usePagination**\<`T`\>(`options?`): [`UsePaginationResult`](/api/pagination/type-aliases/usepaginationresult/)\<`T`\>

Defined in: [packages/pagination/src/use-pagination.ts:79](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/pagination/src/use-pagination.ts#L79)

React hook for cursor-based pagination with React Router loader data.

Accumulates pages as the user loads more and deduplicates items by key
to handle data changes during scrolling. Reads initial data from React Router's
`useLoaderData()` and fetches subsequent pages via `useFetcher()`.

## Type Parameters

### T

`T` = `unknown`

The item type in the paginated list.

## Parameters

### options?

[`UsePaginationOptions`](/api/pagination/type-aliases/usepaginationoptions/)\<`T`\>

Optional pagination configuration (e.g., custom key extractor).

## Returns

[`UsePaginationResult`](/api/pagination/type-aliases/usepaginationresult/)\<`T`\>

A [UsePaginationResult](/api/pagination/type-aliases/usepaginationresult/) with items, loading state, and a `loadMore` callback.

## Example

```tsx
import { usePagination } from "@cfast/pagination";

function PostList() {
  const { items, loadMore, hasMore, isLoading } = usePagination<Post>();
  return (
    <>
      {items.map(post => <PostCard key={post.id} post={post} />)}
      {hasMore && <button onClick={loadMore} disabled={isLoading}>Load more</button>}
    </>
  );
}
```
