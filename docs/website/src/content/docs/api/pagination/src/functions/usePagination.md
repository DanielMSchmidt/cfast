---
editUrl: false
next: false
prev: false
title: "usePagination"
---

> **usePagination**\<`T`\>(`options?`): [`UsePaginationResult`](/api/pagination/src/type-aliases/usepaginationresult/)\<`T`\>

Defined in: [packages/pagination/src/use-pagination.ts:62](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/pagination/src/use-pagination.ts#L62)

React hook for cursor-based pagination with React Router loader data.
Accumulates pages as the user loads more and deduplicates items by key.

## Type Parameters

### T

`T` = `unknown`

## Parameters

### options?

[`UsePaginationOptions`](/api/pagination/src/type-aliases/usepaginationoptions/)\<`T`\>

Optional pagination configuration.

## Returns

[`UsePaginationResult`](/api/pagination/src/type-aliases/usepaginationresult/)\<`T`\>

Paginated items and controls to load more.

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
