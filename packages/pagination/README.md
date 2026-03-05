# @cfast/pagination

**Cursor-based, offset-based pagination and infinite scroll for React Router.**

Cursor-based pagination, offset-based pagination, infinite scroll, "load more" buttons. Every app needs at least one of these. React Router gives you the primitives but not the patterns. You end up parsing search params, managing accumulated pages, wiring up intersection observers, and handling race conditions. Every time.

`@cfast/router` provides type-safe loader helpers and client hooks for all of these. Same loader, swap the hook to switch between "load more" button and infinite scroll.

## Design Goals

- **Pagination that works with D1.** Cursor-based and offset-based pagination with type-safe helpers for both loader and component.
- **Infinite loading done right.** Accumulates pages on the client, triggers loading on scroll or button click, handles race conditions and stale data.
- **Loader + hook pairs.** Each pattern has a server-side helper (parse params, apply to query) and a client-side hook (consume data, manage state). They're designed together.
- **No opinion on permissions or actions.** This package is purely about data fetching patterns. Use `@cfast/actions` for multi-action routes.

## Planned API

### Cursor-Based Pagination

```typescript
import { paginate } from "@cfast/router";

// In your loader:
export async function loader({ request }) {
  const page = paginate.parseParams(request, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const { items, nextCursor } = await paginate.query(
    db.query(posts).findMany({
      orderBy: desc(posts.createdAt),
    }),
    page,
  );

  return { items, nextCursor };
}
```

In the component with a "load more" button:

```typescript
import { usePagination } from "@cfast/router";

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

### Infinite Scroll

Same loader, different hook:

```typescript
import { useInfiniteScroll } from "@cfast/router";

function PostFeed() {
  const { items, sentinelRef, isLoading, hasMore } = useInfiniteScroll<Post>();

  return (
    <div>
      {items.map((post) => <PostCard key={post.id} post={post} />)}
      {/* When this element becomes visible, the next page loads */}
      <div ref={sentinelRef} />
      {isLoading && <Spinner />}
    </div>
  );
}
```

### Offset-Based Pagination

For traditional page-number navigation:

```typescript
// Loader:
export async function loader({ request }) {
  const page = paginate.parseParams(request, { type: "offset", defaultLimit: 20 });
  const { items, total } = await paginate.queryOffset(
    db.query(posts).findMany({ orderBy: desc(posts.createdAt) }),
    page,
  );
  return { items, total, ...page };
}

// Component:
function PostList() {
  const { items, totalPages, currentPage, PageLinks } = useOffsetPagination<Post>();

  return (
    <div>
      {items.map((post) => <PostCard key={post.id} post={post} />)}
      <PageLinks />
    </div>
  );
}
```
