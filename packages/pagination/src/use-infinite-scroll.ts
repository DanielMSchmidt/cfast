import { useRef, useEffect, type RefObject } from "react";
import { usePagination } from "./use-pagination";
import type { UsePaginationOptions } from "./use-pagination";

/**
 * Options for the {@link useInfiniteScroll} hook.
 *
 * Extends {@link UsePaginationOptions} with IntersectionObserver configuration.
 *
 * @typeParam T - The item type in the paginated list.
 */
export type UseInfiniteScrollOptions<T> = UsePaginationOptions<T> & {
  /** Margin around the root for the IntersectionObserver (e.g., `"200px"`). Defaults to `"200px"`. */
  rootMargin?: string;
};

/**
 * Return value of the {@link useInfiniteScroll} hook.
 *
 * @typeParam T - The item type in the paginated list.
 */
export type UseInfiniteScrollResult<T> = {
  /** Accumulated, deduplicated items from all loaded pages. */
  items: T[];
  /** Ref to attach to a sentinel DOM element. Loading triggers when it enters the viewport. */
  sentinelRef: RefObject<Element | null>;
  /** `true` if there are more pages to fetch. */
  hasMore: boolean;
  /** `true` while a page fetch is in flight. */
  isLoading: boolean;
};

/**
 * React hook for infinite scroll with automatic loading via IntersectionObserver.
 *
 * Wraps {@link usePagination} and triggers `loadMore` when a sentinel element enters
 * the viewport. Attach the returned `sentinelRef` to an empty `<div>` at the bottom
 * of your list to enable automatic page loading on scroll.
 *
 * @typeParam T - The item type in the paginated list.
 * @param options - Optional configuration including `rootMargin` for the IntersectionObserver and a custom key extractor.
 * @returns A {@link UseInfiniteScrollResult} with items, a sentinel ref, and loading state.
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
