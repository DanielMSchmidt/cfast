---
editUrl: false
next: false
prev: false
title: "useOffsetPagination"
---

> **useOffsetPagination**\<`T`\>(): [`UseOffsetPaginationResult`](/api/pagination/type-aliases/useoffsetpaginationresult/)\<`T`\>

Defined in: [packages/pagination/src/use-offset-pagination.ts:53](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-offset-pagination.ts#L53)

React hook for offset-based (page number) pagination with React Router loader data.

Reads the current page data from React Router's `useLoaderData()` and provides
a `goToPage` function that navigates by updating the `?page=` URL search parameter.

## Type Parameters

### T

`T` = `unknown`

The item type in the paginated list.

## Returns

[`UseOffsetPaginationResult`](/api/pagination/type-aliases/useoffsetpaginationresult/)\<`T`\>

A [UseOffsetPaginationResult](/api/pagination/type-aliases/useoffsetpaginationresult/) with items, page metadata, and a `goToPage` function.

## Example

```tsx
import { useOffsetPagination } from "@cfast/pagination";

function PostList() {
  const { items, currentPage, totalPages, goToPage } = useOffsetPagination<Post>();
  return (
    <>
      {items.map(post => <PostCard key={post.id} post={post} />)}
      <Pagination current={currentPage} total={totalPages} onChange={goToPage} />
    </>
  );
}
```
