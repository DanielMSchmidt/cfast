import { useRef, useEffect, type RefObject } from "react";
import { usePagination } from "./use-pagination";
import type { UsePaginationOptions } from "./use-pagination";

/** Options for the {@link useInfiniteScroll} hook. */
export type UseInfiniteScrollOptions<T> = UsePaginationOptions<T> & {
  rootMargin?: string;
};

/** Return value of the {@link useInfiniteScroll} hook. */
export type UseInfiniteScrollResult<T> = {
  items: T[];
  sentinelRef: RefObject<Element | null>;
  hasMore: boolean;
  isLoading: boolean;
};

/**
 * React hook for infinite scroll with automatic loading via IntersectionObserver.
 * Wraps {@link usePagination} and triggers `loadMore` when a sentinel element enters the viewport.
 *
 * @param options - Optional configuration including `rootMargin` for the IntersectionObserver.
 * @returns Items, a sentinel ref to attach to a DOM element, and loading state.
 *
 * @example
 * ```tsx
 * import { useInfiniteScroll } from "@cfast/pagination";
 *
 * function PostFeed() {
 *   const { items, sentinelRef, isLoading } = useInfiniteScroll<Post>();
 *   return (
 *     <>
 *       {items.map(post => <PostCard key={post.id} post={post} />)}
 *       <div ref={sentinelRef} />
 *       {isLoading && <Spinner />}
 *     </>
 *   );
 * }
 * ```
 */
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
