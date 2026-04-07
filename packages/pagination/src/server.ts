/**
 * Server-side pagination helpers for `@cfast/pagination`.
 *
 * Loader-side counterparts to the client hooks (`usePagination`,
 * `useInfiniteScroll`, `useOffsetPagination`). Import from
 * `@cfast/pagination/server` so the client bundle does not pull in
 * server-only code.
 *
 * @example
 * ```ts
 * import { applyCursorPagination, parseCursorParams } from "@cfast/pagination/server";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const { cursor, limit } = parseCursorParams(request, { defaultLimit: 20 });
 *   return applyCursorPagination(db.query(recipes).findMany(), {
 *     cursor,
 *     limit,
 *     cursorColumns: ["createdAt", "id"],
 *   });
 * }
 * ```
 *
 * @module
 */

export { applyCursorPagination } from "./server/apply-cursor-pagination";
export type {
  ApplyCursorPaginationOptions,
  CursorOrderDirection,
  CursorPage,
  CursorPaginationQuery,
} from "./server/apply-cursor-pagination";

export { parseCursorParams, parseOffsetParams } from "./server/parse-params";
export type {
  CursorPageParams,
  OffsetPageParams,
  ParsePaginationOptions,
} from "./server/parse-params";

export { encodeCursor, decodeCursor } from "./server/cursor";
