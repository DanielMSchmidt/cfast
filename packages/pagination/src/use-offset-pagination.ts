import { useLoaderData, useNavigate, useLocation } from "react-router";
import { useCallback } from "react";

type OffsetPageData = {
  items: unknown[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Return value of the {@link useOffsetPagination} hook.
 *
 * @typeParam T - The item type in the paginated list.
 */
export type UseOffsetPaginationResult<T> = {
  /** Items for the current page. */
  items: T[];
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages available. */
  totalPages: number;
  /** The current 1-based page number. */
  currentPage: number;
  /** Navigates to the given 1-based page number by updating the URL search params. */
  goToPage: (page: number) => void;
};

/**
 * React hook for offset-based (page number) pagination with React Router loader data.
 *
 * Reads the current page data from React Router's `useLoaderData()` and provides
 * a `goToPage` function that navigates by updating the `?page=` URL search parameter.
 *
 * @typeParam T - The item type in the paginated list.
 * @returns A {@link UseOffsetPaginationResult} with items, page metadata, and a `goToPage` function.
 *
 * @example
 * ```tsx
 * import { useOffsetPagination } from "@cfast/pagination";
 *
 * function PostList() {
 *   const { items, currentPage, totalPages, goToPage } = useOffsetPagination<Post>();
 *   return (
 *     <>
 *       {items.map(post => <PostCard key={post.id} post={post} />)}
 *       <Pagination current={currentPage} total={totalPages} onChange={goToPage} />
 *     </>
 *   );
 * }
 * ```
 */
export function useOffsetPagination<T = unknown>(): UseOffsetPaginationResult<T> {
  const data = useLoaderData() as OffsetPageData;
  const navigate = useNavigate();
  const location = useLocation();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(location.search);
      params.set("page", String(page));
      navigate(`${location.pathname}?${params.toString()}`);
    },
    [navigate, location.pathname, location.search],
  );

  return {
    items: data.items as T[],
    total: data.total,
    totalPages: data.totalPages,
    currentPage: data.page,
    goToPage,
  };
}
