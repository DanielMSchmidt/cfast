import { useLoaderData, useFetcher, useLocation } from "react-router";
import { useState, useCallback, useEffect, useMemo } from "react";

type CursorPageData = {
  items: unknown[];
  nextCursor: string | null;
};

/** Options for the {@link usePagination} hook. */
export type UsePaginationOptions<T> = {
  getKey?: (item: T) => string | number;
};

/** Return value of the {@link usePagination} hook. */
export type UsePaginationResult<T> = {
  items: T[];
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
};

function defaultGetKey(item: unknown): string | number {
  return (item as Record<string, unknown>).id as string | number;
}

function deduplicateItems<T>(
  items: T[],
  getKey: (item: T) => string | number,
): T[] {
  const seen = new Map<string | number, T>();
  for (const item of items) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

/**
 * React hook for cursor-based pagination with React Router loader data.
 * Accumulates pages as the user loads more and deduplicates items by key.
 *
 * @param options - Optional pagination configuration.
 * @returns Paginated items and controls to load more.
 *
 * @example
 * ```tsx
 * import { usePagination } from "@cfast/pagination";
 *
 * function PostList() {
 *   const { items, loadMore, hasMore, isLoading } = usePagination<Post>();
 *   return (
 *     <>
 *       {items.map(post => <PostCard key={post.id} post={post} />)}
 *       {hasMore && <button onClick={loadMore} disabled={isLoading}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function usePagination<T = unknown>(
  options?: UsePaginationOptions<T>,
): UsePaginationResult<T> {
  const loaderData = useLoaderData() as CursorPageData;
  const fetcher = useFetcher<CursorPageData>();
  const location = useLocation();
  const getKey = (options?.getKey ?? defaultGetKey) as (
    item: T,
  ) => string | number;

  const [pages, setPages] = useState<CursorPageData[]>(() => [loaderData]);

  // Reset when route changes (new loader data)
  useEffect(() => {
    setPages([loaderData]);
  }, [loaderData, location.pathname, location.search]);

  // Append fetcher results
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      setPages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.nextCursor === fetcher.data?.nextCursor) return prev;
        return [...prev, fetcher.data!];
      });
    }
  }, [fetcher.data, fetcher.state]);

  const allItems = useMemo(
    () => deduplicateItems(pages.flatMap((p) => p.items) as T[], getKey),
    [pages, getKey],
  );

  const lastCursor = pages[pages.length - 1]?.nextCursor ?? null;
  const hasMore = lastCursor != null;
  const isLoading = fetcher.state !== "idle";

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const params = new URLSearchParams(location.search);
    params.set("cursor", lastCursor!);
    fetcher.load(`${location.pathname}?${params.toString()}`);
  }, [isLoading, hasMore, lastCursor, location.pathname, location.search, fetcher]);

  return { items: allItems, loadMore, hasMore, isLoading };
}
