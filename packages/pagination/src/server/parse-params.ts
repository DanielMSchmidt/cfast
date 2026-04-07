/**
 * Server-side helpers for parsing pagination parameters from a `Request` URL.
 *
 * These functions are designed to be called from React Router loaders to read
 * `cursor` / `page` / `limit` from the query string and produce typed objects
 * ready to feed into {@link applyCursorPagination} or {@link applyOffsetPagination}.
 *
 * @module
 */

/**
 * Options for controlling default and maximum pagination limits.
 *
 * Shared by {@link parseCursorParams} and {@link parseOffsetParams}.
 */
export type ParsePaginationOptions = {
  /** Default `limit` when not present in the URL. Defaults to `20`. */
  defaultLimit?: number;
  /** Maximum allowed `limit` (URL values are clamped to this). Defaults to `100`. */
  maxLimit?: number;
};

/**
 * Result of {@link parseCursorParams}.
 *
 * Designed to destructure cleanly: `const { cursor, limit } = parseCursorParams(request)`.
 */
export type CursorPageParams = {
  /** The opaque cursor from the URL, or `null` for the first page. */
  cursor: string | null;
  /** The clamped page size. */
  limit: number;
};

/**
 * Result of {@link parseOffsetParams}.
 */
export type OffsetPageParams = {
  /** The 1-based page number, clamped to `>= 1`. */
  page: number;
  /** The clamped page size. */
  limit: number;
};

function parseIntParam(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Parses cursor-based pagination parameters from a `Request` URL.
 *
 * Reads `?cursor=...&limit=...` from the URL query string and clamps `limit`
 * between `1` and `maxLimit`. The result is shaped to destructure directly
 * into the options for {@link applyCursorPagination}.
 *
 * @param request - The incoming HTTP request.
 * @param options - Optional defaults and bounds for the page size.
 * @returns A {@link CursorPageParams} object with `cursor` and `limit`.
 *
 * @example
 * ```ts
 * import { parseCursorParams, applyCursorPagination } from "@cfast/pagination/server";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const { cursor, limit } = parseCursorParams(request, { defaultLimit: 20 });
 *   const result = await applyCursorPagination(db.query(recipes).findMany(), {
 *     cursor,
 *     limit,
 *     cursorColumns: ["createdAt", "id"],
 *   });
 *   return result;
 * }
 * ```
 */
export function parseCursorParams(
  request: Request,
  options?: ParsePaginationOptions,
): CursorPageParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = clamp(
    parseIntParam(url.searchParams.get("limit"), defaultLimit),
    1,
    maxLimit,
  );

  return { cursor, limit };
}

/**
 * Parses offset-based pagination parameters from a `Request` URL.
 *
 * Reads `?page=...&limit=...` from the URL query string. `page` is clamped
 * to `>= 1` and `limit` is clamped between `1` and `maxLimit`.
 *
 * @param request - The incoming HTTP request.
 * @param options - Optional defaults and bounds for the page size.
 * @returns An {@link OffsetPageParams} object with `page` and `limit`.
 *
 * @example
 * ```ts
 * import { parseOffsetParams } from "@cfast/pagination/server";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const { page, limit } = parseOffsetParams(request, { defaultLimit: 20 });
 *   // ...
 * }
 * ```
 */
export function parseOffsetParams(
  request: Request,
  options?: ParsePaginationOptions,
): OffsetPageParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const page = Math.max(parseIntParam(url.searchParams.get("page"), 1), 1);
  const limit = clamp(
    parseIntParam(url.searchParams.get("limit"), defaultLimit),
    1,
    maxLimit,
  );

  return { page, limit };
}
