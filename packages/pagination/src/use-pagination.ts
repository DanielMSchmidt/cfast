import { useLoaderData, useFetcher, useLocation } from "react-router";
import { useState, useCallback, useEffect, useMemo } from "react";

type CursorPageData = {
  items: unknown[];
  nextCursor: string | null;
};

/**
 * Options for the {@link usePagination} hook.
 *
 * @typeParam T - The item type in the paginated list.
 */
export type UsePaginationOptions<T> = {
  /** Extracts a unique key from each item for deduplication. Defaults to `item.id`. */
  getKey?: (item: T) => string | number;
};

/**
 * Return value of the {@link usePagination} hook.
 *
 * @typeParam T - The item type in the paginated list.
 */
export type UsePaginationResult<T> = {
  /** Accumulated, deduplicated items from all loaded pages. */
  items: T[];
  /** Fetches the next page of results. No-op if already loading or no more pages. */
  loadMore: () => void;
  /** `true` if there are more pages to fetch (a `nextCursor` exists). */
  hasMore: boolean;
  /** `true` while a page fetch is in flight. */
  isLoading: boolean;
};

/**
 * Validates that a value conforms to the {@link CursorPageData} shape.
 * Returns a valid `CursorPageData` or a fallback with empty items.
 */
function asCursorPageData(value: unknown): CursorPageData {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return {
        items: obj.items,
        nextCursor:
          typeof obj.nextCursor === "string" ? obj.nextCursor : null,
      };
    }
  }
  return { items: [], nextCursor: null };
}

/**
 * Default key extractor that reads the `id` property from an item.
 * Uses an `in` check to safely narrow the type before accessing `id`.
 */
function defaultGetKey(item: unknown): string | number {
  if (item !== null && typeof item === "object" && "id" in item) {
    // After the `in` check, TS narrows to `Record<"id", unknown>`
    const { id } = item;
    if (typeof id === "string" || typeof id === "number") {
      return id;
    }
  }
  return "";
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
 *
 * Accumulates pages as the user loads more and deduplicates items by key
 * to handle data changes during scrolling. Reads initial data from React Router's
 * `useLoaderData()` and fetches subsequent pages via `useFetcher()`.
 *
 * @typeParam T - The item type in the paginated list.
 * @param options - Optional pagination configuration (e.g., custom key extractor).
 * @returns A {@link UsePaginationResult} with items, loading state, and a `loadMore` callback.
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
  const loaderData = asCursorPageData(useLoaderData());
  const fetcher = useFetcher<CursorPageData>();
  const location = useLocation();
  // defaultGetKey operates on `unknown` which is safe for any T,
  // so the fallback assignment is type-compatible.
  const getKey: (item: T) => string | number =
    options?.getKey ?? (defaultGetKey as (item: T) => string | number);

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
    () =>
      deduplicateItems(
        pages.flatMap((p) => p.items) as T[],
        getKey,
      ),
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
