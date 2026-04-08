# @cfast/pagination

**Cursor-based, offset-based pagination and infinite scroll for React Router.**

Ships both the client React hooks (`@cfast/pagination`) and matching loader-side helpers (`@cfast/pagination/server`). The two halves share an opaque cursor format so the full client/server loop works seamlessly. For Drizzle/D1-pushed pagination you can also use `@cfast/db`'s `db.query(table).paginate()`, which uses the same cursor format.

## Design Goals

- **Pagination that works with D1.** Cursor-based and offset-based pagination with type-safe helpers for both loader and component.
- **Infinite loading done right.** Accumulates pages on the client, triggers loading on scroll or button click, deduplicates items to handle data changes during scrolling.
- **Loader + hook pairs.** Server-side helpers in `@cfast/db`, client-side hooks here. Same loader, swap the hook to switch between "load more" and infinite scroll.
- **No opinion on permissions or actions.** This package is purely about data fetching patterns.

## Cursor-Based Pagination

### Loader (server) — `@cfast/pagination/server`

```typescript
import type { LoaderFunctionArgs } from "react-router";
import { applyCursorPagination, parseCursorParams } from "@cfast/pagination/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { cursor, limit } = parseCursorParams(request, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const result = await applyCursorPagination(
    db.query(posts).findMany({ orderBy: desc(posts.createdAt) }),
    { cursor, limit, cursorColumns: ["createdAt", "id"] },
  );

  return {
    items: result.items,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  };
}
```

`applyCursorPagination` accepts an array, a `Promise` of an array, or any thenable
query result. Sort the underlying query yourself so the order matches `cursorColumns`
and `direction` (default `"desc"`).

### Loader (server) — `@cfast/db` (SQL-pushed cursor)

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
    .run();

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
    .run();

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

### Server (`@cfast/pagination/server`)

- **`applyCursorPagination<T>(query, options)`** — Applies cursor pagination to an array, Promise, or thenable query. Returns `Promise<{ items, nextCursor, hasMore }>`. Options: `{ cursor, limit, cursorColumns, direction? }`.
- **`parseCursorParams(request, options?)`** — Parses `?cursor=X&limit=Y`. Returns `{ cursor, limit }`.
- **`parseOffsetParams(request, options?)`** — Parses `?page=X&limit=Y`. Returns `{ page, limit }`.
- **`encodeCursor(values)` / `decodeCursor(cursor)`** — Low-level opaque cursor encoding (base64-encoded JSON; compatible with `@cfast/db`).

Parser options: `{ defaultLimit?: number, maxLimit?: number }` (defaults: 20, 100).

### Server (`@cfast/db`)

- **`db.query(table).paginate(params, options)`** — Drizzle-aware pagination that pushes the cursor into a SQL `WHERE` clause. Cursors are interchangeable with `@cfast/pagination/server`.

### Client (`@cfast/pagination`)

- **`usePagination<T>(options?)`** — Load-more pattern. Returns `{ items, loadMore, hasMore, isLoading }`.
- **`useInfiniteScroll<T>(options?)`** — Intersection observer pattern. Returns `{ items, sentinelRef, hasMore, isLoading }`.
- **`useOffsetPagination<T>()`** — Page navigation. Returns `{ items, total, totalPages, currentPage, goToPage }`.

Hook options: `{ getKey?: (item: T) => string | number }` (defaults to `item.id`). `useInfiniteScroll` also accepts `rootMargin` (default: `"200px"`).

## Cursor Encoding

Cursors are opaque base64-encoded JSON containing the values of the `cursorColumns` for the last item. Clients cannot tamper with or depend on the cursor format.
