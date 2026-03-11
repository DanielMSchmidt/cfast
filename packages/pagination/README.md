# @cfast/pagination

**Cursor-based, offset-based pagination and infinite scroll for React Router.**

Server-side helpers live in `@cfast/db` (param parsing, query building). This package provides the client-side React hooks that consume paginated loader data.

## Design Goals

- **Pagination that works with D1.** Cursor-based and offset-based pagination with type-safe helpers for both loader and component.
- **Infinite loading done right.** Accumulates pages on the client, triggers loading on scroll or button click, deduplicates items to handle data changes during scrolling.
- **Loader + hook pairs.** Server-side helpers in `@cfast/db`, client-side hooks here. Same loader, swap the hook to switch between "load more" and infinite scroll.
- **No opinion on permissions or actions.** This package is purely about data fetching patterns.

## Cursor-Based Pagination

### Loader (server)

```typescript
import { parseCursorParams } from "@cfast/db";

export async function loader({ request }) {
  const page = parseCursorParams(request, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const result = await db.query(posts)
    .paginate(page, {
      orderBy: desc(posts.createdAt),
      cursorColumns: [posts.createdAt, posts.id],
    })
    .run({});

  return result; // { items, nextCursor }
}
```

### Load More Button (client)

```typescript
import { usePagination } from "@cfast/pagination";

function PostList() {
  const { items, loadMore, hasMore, isLoading } = usePagination<Post>();

  return (
    <div>
      {items.map((post) => <PostCard key={post.id} post={post} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### Infinite Scroll (client)

Same loader, different hook:

```typescript
import { useInfiniteScroll } from "@cfast/pagination";

function PostFeed() {
  const { items, sentinelRef, isLoading, hasMore } = useInfiniteScroll<Post>();

  return (
    <div>
      {items.map((post) => <PostCard key={post.id} post={post} />)}
      <div ref={sentinelRef} />
      {isLoading && <Spinner />}
    </div>
  );
}
```

## Offset-Based Pagination

### Loader (server)

```typescript
import { parseOffsetParams } from "@cfast/db";

export async function loader({ request }) {
  const page = parseOffsetParams(request, { defaultLimit: 20 });

  const result = await db.query(posts)
    .paginate(page, {
      orderBy: desc(posts.createdAt),
    })
    .run({});

  return result; // { items, total, page, totalPages }
}
```

### Component (client)

```typescript
import { useOffsetPagination } from "@cfast/pagination";

function PostList() {
  const { items, totalPages, currentPage, goToPage } = useOffsetPagination<Post>();

  return (
    <div>
      {items.map((post) => <PostCard key={post.id} post={post} />)}
      <div>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i + 1} onClick={() => goToPage(i + 1)} disabled={currentPage === i + 1}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## API Reference

### Server (`@cfast/db`)

- **`parseCursorParams(request, options?)`** — Parses `?cursor=X&limit=Y`. Returns `CursorParams`.
- **`parseOffsetParams(request, options?)`** — Parses `?page=X&limit=Y`. Returns `OffsetParams`.
- **`db.query(table).paginate(params, options)`** — Returns `Operation<CursorPage>` or `Operation<OffsetPage>` depending on params type.

Options: `{ defaultLimit?: number, maxLimit?: number }` (defaults: 20, 100).

### Client (`@cfast/pagination`)

- **`usePagination<T>(options?)`** — Load-more pattern. Returns `{ items, loadMore, hasMore, isLoading }`.
- **`useInfiniteScroll<T>(options?)`** — Intersection observer pattern. Returns `{ items, sentinelRef, hasMore, isLoading }`.
- **`useOffsetPagination<T>()`** — Page navigation. Returns `{ items, total, totalPages, currentPage, goToPage }`.

Hook options: `{ getKey?: (item: T) => string | number }` (defaults to `item.id`). `useInfiniteScroll` also accepts `rootMargin` (default: `"200px"`).

## Cursor Encoding

Cursors are opaque base64-encoded JSON containing the values of the `cursorColumns` for the last item. Clients cannot tamper with or depend on the cursor format.
