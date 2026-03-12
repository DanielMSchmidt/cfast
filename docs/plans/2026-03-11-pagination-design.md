# Pagination Design

## Overview

Cursor-based, offset-based pagination and infinite scroll split across two packages:
- **Server-side** (param parsing + query building) in `@cfast/db`
- **Client-side** (React hooks for page accumulation, infinite scroll, offset navigation) in `@cfast/pagination`

## Server: `@cfast/db` Additions

### Param Parsers

```typescript
parseCursorParams(request: Request, opts?: {
  defaultLimit?: number;  // default: 20
  maxLimit?: number;      // default: 100
}): CursorParams

parseOffsetParams(request: Request, opts?: {
  defaultLimit?: number;  // default: 20
  maxLimit?: number;      // default: 100
}): OffsetParams
```

- `parseCursorParams` reads `?cursor=X&limit=Y` from the request URL
- `parseOffsetParams` reads `?page=X&limit=Y` from the request URL

### QueryBuilder.paginate()

New method on `QueryBuilder` alongside `findMany`/`findFirst`:

```typescript
db.query(posts).paginate(params, {
  orderBy: desc(posts.createdAt),
  cursorColumns: [posts.createdAt, posts.id],  // required for cursor
  where?: ...,
  columns?: ...,
  with?: ...,
  cache?: ...,
}): Operation<CursorPage<T>> | Operation<OffsetPage<T>>
```

- With `CursorParams`: fetches N+1 rows, encodes opaque base64 cursor from `cursorColumns` values, trims to N, returns `CursorPage`
- With `OffsetParams`: applies limit/offset, runs parallel count query for total, returns `OffsetPage`

### Cursor Encoding

Opaque base64 cursor: `btoa(JSON.stringify({ v: [col1Value, col2Value] }))`.

On decode, builds a `WHERE (col1, col2) < (?, ?)` clause (or `>` for ascending order) using the cursor column definitions. Requires `cursorColumns` to be explicitly specified — no runtime introspection of drizzle `orderBy` expressions.

### Types

```typescript
type CursorParams = { type: "cursor"; cursor: string | null; limit: number }
type OffsetParams = { type: "offset"; page: number; limit: number }

type CursorPage<T> = { items: T[]; nextCursor: string | null }
type OffsetPage<T> = { items: T[]; total: number; page: number; totalPages: number }
```

## Client: `@cfast/pagination`

### usePagination

Load-more button pattern. Accumulates pages via `useFetcher`.

```typescript
const { items, loadMore, hasMore, isLoading } = usePagination<T>({
  getKey?: (item: T) => string | number;  // default: (item) => item.id
});
```

- Reads initial page from `useLoaderData()`
- `loadMore()` fetches next page using cursor from last page
- Deduplicates accumulated items by key

### useInfiniteScroll

Same accumulation logic, triggered by intersection observer on sentinel element.

```typescript
const { items, sentinelRef, hasMore, isLoading } = useInfiniteScroll<T>({
  getKey?: (item: T) => string | number;
  rootMargin?: string;  // intersection observer margin
});
```

### useOffsetPagination

Traditional page navigation via search params. No accumulation — each page replaces.

```typescript
const { items, totalPages, currentPage, goToPage } = useOffsetPagination<T>();
```

- `goToPage(n)` navigates by updating `?page=N` search param

## Decisions

- **Opaque base64 cursors** over raw value cursors — prevents client tampering, supports composite sort keys
- **Explicit `cursorColumns`** over orderBy introspection — simpler, more predictable
- **Client-side deduplication by key** for cursor hooks — handles data changes during scrolling without server complexity
- **No `PageLinks` component** — users wire their own UI
- **No permission integration** — pagination is pure data fetching
- **`getKey` defaults to `item.id`** — covers the common case, overridable for exceptions
