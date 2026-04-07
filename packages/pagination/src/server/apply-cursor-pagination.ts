/**
 * Server-side cursor pagination helper.
 *
 * Takes a query (or array, or Promise of an array) of already-sorted rows,
 * applies the current cursor, slices to the requested page size, and returns
 * a `{ items, nextCursor, hasMore }` shape that matches what `usePagination`
 * expects on the client.
 *
 * This helper is intentionally generic and has no dependency on Drizzle, D1,
 * or any specific query builder. For Drizzle-aware database-side pagination
 * (where the cursor is pushed into a SQL `WHERE` clause), use `@cfast/db`'s
 * `db.query(table).paginate()` instead.
 *
 * @module
 */

import { decodeCursor, encodeCursor, normalizeCursorValue } from "./cursor";

/**
 * A "query" accepted by {@link applyCursorPagination}.
 *
 * Can be:
 * - An array of items (already fetched).
 * - A `Promise` resolving to an array (e.g. `db.query(table).findMany()`).
 *
 * The helper awaits the value, applies the cursor, and returns a paginated page.
 */
export type CursorPaginationQuery<T> = readonly T[] | Promise<readonly T[]>;

/**
 * Sort direction used by the cursor comparator.
 *
 * - `"desc"` (default): rows are sorted high-to-low; the helper keeps rows
 *   strictly less than the cursor row.
 * - `"asc"`: rows are sorted low-to-high; the helper keeps rows strictly
 *   greater than the cursor row.
 */
export type CursorOrderDirection = "asc" | "desc";

/**
 * Options for {@link applyCursorPagination}.
 *
 * @typeParam T - The row type. `cursorColumns` are restricted to keys of `T`
 *   so typos are caught at compile time.
 */
export type ApplyCursorPaginationOptions<T> = {
  /** The opaque cursor from the URL, or `null` for the first page. */
  cursor: string | null;
  /** Maximum number of items to include in the page. */
  limit: number;
  /**
   * Property names on each row used to encode the cursor.
   *
   * Should match the columns the underlying query is sorted by, in the same
   * order. For multi-column sorts (e.g. `(createdAt, id)`), pass all of them
   * so the cursor uniquely identifies a row.
   */
  cursorColumns: readonly (keyof T & string)[];
  /**
   * Sort direction. Defaults to `"desc"` to match the convention in
   * `@cfast/db` and the typical "newest first" feed UX.
   */
  direction?: CursorOrderDirection;
};

/**
 * The result of {@link applyCursorPagination}.
 *
 * The shape matches the `CursorPageData` consumed by `usePagination`,
 * `useInfiniteScroll`, and friends on the client. Returning this directly
 * from a loader makes the full client/server loop work seamlessly.
 *
 * @typeParam T - The row type.
 */
export type CursorPage<T> = {
  /** The items in the current page (up to `limit`). */
  items: T[];
  /** The cursor for the next page, or `null` if there are no more pages. */
  nextCursor: string | null;
  /** `true` if there are more pages after this one. */
  hasMore: boolean;
};

/**
 * Compares two cursor column values.
 *
 * Returns a negative number if `a < b`, positive if `a > b`, `0` if equal.
 * Handles `Date`, `number`, `string`, `boolean`, and `null`/`undefined`.
 *
 * For unknown types, falls back to lexicographic comparison of `String(value)`
 * which preserves the contract that the comparator never throws.
 */
function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return b == null ? 0 : -1;
  if (b == null) return 1;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? 1 : -1;
  }

  const aStr = String(a);
  const bStr = String(b);
  if (aStr < bStr) return -1;
  if (aStr > bStr) return 1;
  return 0;
}

/**
 * Compares two row tuples by their cursor column values, in order.
 *
 * Returns a negative number if `aValues` sorts before `bValues`, positive
 * if after, `0` if equal. Stops at the first non-equal column (lexicographic
 * tuple comparison).
 */
function compareTuples(aValues: unknown[], bValues: unknown[]): number {
  const len = Math.min(aValues.length, bValues.length);
  for (let i = 0; i < len; i++) {
    const cmp = compareValues(aValues[i], bValues[i]);
    if (cmp !== 0) return cmp;
  }
  return aValues.length - bValues.length;
}

/**
 * Reads the cursor column values from a row, normalized into a form that
 * round-trips through `encodeCursor`/`decodeCursor`.
 *
 * Without normalization a `Date` row value would compare against the
 * ISO-string form stored in the decoded cursor and never match.
 */
function readCursorValues<T>(
  row: T,
  cursorColumns: readonly (keyof T & string)[],
): unknown[] {
  const values: unknown[] = [];
  for (const col of cursorColumns) {
    values.push(normalizeCursorValue((row as Record<string, unknown>)[col]));
  }
  return values;
}

/**
 * Applies cursor-based pagination to a query result.
 *
 * Awaits the query (if it is a `Promise`), filters out rows up to and
 * including the cursor row, takes up to `limit` items, and computes a
 * `nextCursor` from the last item if more pages remain.
 *
 * The returned shape matches `CursorPageData` consumed by `usePagination`
 * on the client, so loaders can return the result directly.
 *
 * **Sort the underlying query yourself.** This helper does not sort —
 * it assumes the rows arrive in the order specified by `direction` and
 * the `cursorColumns`. For Drizzle-backed queries, use `orderBy` on the
 * query and pass the same columns to `cursorColumns`. For in-memory
 * arrays, sort the array before calling.
 *
 * @typeParam T - The row type.
 * @param query - An array, a `Promise` of an array, or a thenable
 *   resolving to an array of rows.
 * @param options - Cursor, limit, and column configuration.
 * @returns A {@link CursorPage} ready to return from a loader.
 *
 * @example In-memory array (cfast-meals pattern)
 * ```ts
 * import { applyCursorPagination, parseCursorParams } from "@cfast/pagination/server";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const { cursor, limit } = parseCursorParams(request, { defaultLimit: 20 });
 *   const allRecipes = filterRecipes(getAllRecipes(), filters);
 *   return applyCursorPagination(allRecipes, {
 *     cursor,
 *     limit,
 *     cursorColumns: ["id"],
 *     direction: "asc",
 *   });
 * }
 * ```
 *
 * @example Drizzle query (Promise)
 * ```ts
 * const result = await applyCursorPagination(
 *   db.select().from(recipes).orderBy(desc(recipes.createdAt), desc(recipes.id)),
 *   { cursor, limit, cursorColumns: ["createdAt", "id"] },
 * );
 * ```
 */
export async function applyCursorPagination<T>(
  query: CursorPaginationQuery<T>,
  options: ApplyCursorPaginationOptions<T>,
): Promise<CursorPage<T>> {
  const { cursor, limit, cursorColumns, direction = "desc" } = options;

  if (cursorColumns.length === 0) {
    throw new Error(
      "applyCursorPagination: `cursorColumns` must contain at least one column",
    );
  }
  if (limit < 1) {
    throw new Error("applyCursorPagination: `limit` must be >= 1");
  }

  const allRows = (await query) as readonly T[];
  const cursorValues = decodeCursor(cursor);

  // Filter past the cursor row. With direction "desc" rows are sorted
  // high-to-low so we keep rows strictly less than the cursor; with "asc"
  // we keep rows strictly greater than the cursor.
  let filtered: readonly T[] = allRows;
  if (cursorValues) {
    filtered = allRows.filter((row) => {
      const rowValues = readCursorValues(row, cursorColumns);
      const cmp = compareTuples(rowValues, cursorValues);
      return direction === "desc" ? cmp < 0 : cmp > 0;
    });
  }

  const items = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(readCursorValues(lastItem, cursorColumns));
  }

  return { items, nextCursor, hasMore };
}
