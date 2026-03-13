import { useLoaderData, useNavigate, useLocation } from "react-router";
import { useCallback } from "react";

type OffsetPageData = {
  items: unknown[];
  total: number;
  page: number;
  totalPages: number;
};

/** Return value of the {@link useOffsetPagination} hook. */
export type UseOffsetPaginationResult<T> = {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  goToPage: (page: number) => void;
};

/**
 * React hook for offset-based (page number) pagination with React Router loader data.
 *
 * @returns Paginated items, page metadata, and a `goToPage` function.
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
