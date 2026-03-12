import { useRef, useEffect, type RefObject } from "react";
import { usePagination } from "./use-pagination";
import type { UsePaginationOptions } from "./use-pagination";

export type UseInfiniteScrollOptions<T> = UsePaginationOptions<T> & {
  rootMargin?: string;
};

export type UseInfiniteScrollResult<T> = {
  items: T[];
  sentinelRef: RefObject<Element | null>;
  hasMore: boolean;
  isLoading: boolean;
};

export function useInfiniteScroll<T = unknown>(
  options?: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollResult<T> {
  const { items, loadMore, hasMore, isLoading } = usePagination<T>(options);
  const sentinelRef = useRef<Element | null>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const rootMargin = options?.rootMargin ?? "200px";

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, rootMargin]);

  return { items, sentinelRef, hasMore, isLoading };
}
