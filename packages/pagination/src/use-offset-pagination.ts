import { useLoaderData, useNavigate, useLocation } from "react-router";
import { useCallback } from "react";

type OffsetPageData = {
  items: unknown[];
  total: number;
  page: number;
  totalPages: number;
};

export type UseOffsetPaginationResult<T> = {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  goToPage: (page: number) => void;
};

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
