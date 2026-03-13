---
editUrl: false
next: false
prev: false
title: "useOffsetPagination"
---

> **useOffsetPagination**\<`T`\>(): [`UseOffsetPaginationResult`](/api/pagination/src/type-aliases/useoffsetpaginationresult/)\<`T`\>

Defined in: [packages/pagination/src/use-offset-pagination.ts:40](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/pagination/src/use-offset-pagination.ts#L40)

React hook for offset-based (page number) pagination with React Router loader data.

## Type Parameters

### T

`T` = `unknown`

## Returns

[`UseOffsetPaginationResult`](/api/pagination/src/type-aliases/useoffsetpaginationresult/)\<`T`\>

Paginated items, page metadata, and a `goToPage` function.

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
