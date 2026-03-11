import { useLoaderData, useFetcher, useLocation } from "react-router";
import { useState, useCallback, useEffect, useRef } from "react";

type CursorPageData = {
  items: unknown[];
  nextCursor: string | null;
};

export type UsePaginationOptions<T> = {
  getKey?: (item: T) => string | number;
};

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
    seen.set(getKey(item), item);
  }
  return Array.from(seen.values());
}

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
  const lastCursorRef = useRef<string | null>(loaderData.nextCursor);

  // Reset when route changes (new loader data)
  useEffect(() => {
    setPages([loaderData]);
    lastCursorRef.current = loaderData.nextCursor;
  }, [location.pathname, location.search]);

  // Append fetcher results
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      setPages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.nextCursor === fetcher.data?.nextCursor) return prev;
        return [...prev, fetcher.data!];
      });
      lastCursorRef.current = fetcher.data.nextCursor;
    }
  }, [fetcher.data, fetcher.state]);

  const allItems = deduplicateItems(
    pages.flatMap((p) => p.items) as T[],
    getKey,
  );

  const hasMore = lastCursorRef.current != null;
  const isLoading = fetcher.state !== "idle";

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const cursor = lastCursorRef.current;
    const params = new URLSearchParams(location.search);
    params.set("cursor", cursor!);
    fetcher.load(`${location.pathname}?${params.toString()}`);
  }, [isLoading, hasMore, location.pathname, location.search, fetcher]);

  return { items: allItems, loadMore, hasMore, isLoading };
}
