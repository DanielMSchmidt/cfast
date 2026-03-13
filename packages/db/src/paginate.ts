import { and, or, lt, gt, eq } from "drizzle-orm";
import type { Column, SQL } from "drizzle-orm";
import type { CursorParams, OffsetParams } from "./types";

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

function parseIntParam(raw: string | null, fallback: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : n;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Parses cursor-based pagination parameters from a request URL's search params.
 *
 * Reads `cursor` and `limit` from the URL. Clamps `limit` between 1 and `maxLimit`.
 *
 * @param request - The incoming HTTP request whose URL contains pagination params.
 * @param options - Optional defaults and limits for pagination.
 * @returns Parsed `CursorParams` with `type`, `cursor`, and `limit`.
 *
 * @example
 * ```ts
 * const params = parseCursorParams(request, { defaultLimit: 20, maxLimit: 100 });
 * const page = await db.query(posts).paginate(params).run({});
 * ```
 */
export function parseCursorParams(
  request: Request,
  options?: PaginationOptions,
): CursorParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = clamp(parseIntParam(url.searchParams.get("limit"), defaultLimit), 1, maxLimit);

  return { type: "cursor", cursor, limit };
}

/**
 * Parses offset-based pagination parameters from a request URL's search params.
 *
 * Reads `page` and `limit` from the URL. Clamps `limit` between 1 and `maxLimit`, and
 * ensures `page` is at least 1.
 *
 * @param request - The incoming HTTP request whose URL contains pagination params.
 * @param options - Optional defaults and limits for pagination.
 * @returns Parsed `OffsetParams` with `type`, `page`, and `limit`.
 *
 * @example
 * ```ts
 * const params = parseOffsetParams(request, { defaultLimit: 20 });
 * const page = await db.query(posts).paginate(params).run({});
 * ```
 */
export function parseOffsetParams(
  request: Request,
  options?: PaginationOptions,
): OffsetParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const page = Math.max(parseIntParam(url.searchParams.get("page"), 1), 1);
  const limit = clamp(parseIntParam(url.searchParams.get("limit"), defaultLimit), 1, maxLimit);

  return { type: "offset", page, limit };
}

/**
 * Encodes cursor column values into an opaque base64 string for use in pagination URLs.
 *
 * @param values - The column values from the last row of the current page.
 * @returns A base64-encoded cursor string.
 */
export function encodeCursor(values: unknown[]): string {
  return btoa(JSON.stringify({ v: values }));
}

/**
 * Decodes an opaque cursor string back into the original column values.
 *
 * Returns `null` if the cursor is `null`, malformed, or cannot be parsed.
 *
 * @param cursor - The base64-encoded cursor string, or `null`.
 * @returns The decoded array of column values, or `null`.
 */
export function decodeCursor(cursor: string | null): unknown[] | null {
  if (cursor === null) return null;
  try {
    const parsed: unknown = JSON.parse(atob(cursor));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "v" in parsed
    ) {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record["v"])) {
        return record["v"] as unknown[];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Builds a Drizzle SQL WHERE clause for cursor-based pagination.
 *
 * For a single column, produces `col < value` (desc) or `col > value` (asc).
 * For multiple columns, produces a tuple comparison expansion using OR/AND.
 *
 * @param cursorColumns - The Drizzle column references used for cursor ordering.
 * @param cursorValues - The values from the decoded cursor, matching `cursorColumns` order.
 * @param direction - Sort direction: `"desc"` uses `<`, `"asc"` uses `>`. Defaults to `"desc"`.
 * @returns A Drizzle SQL expression for the WHERE clause, or `undefined` if no columns.
 */
export function buildCursorWhere(
  cursorColumns: Column[],
  cursorValues: unknown[],
  direction: "asc" | "desc" = "desc",
): SQL | undefined {
  const compare = direction === "desc" ? lt : gt;

  if (cursorColumns.length === 1) {
    return compare(cursorColumns[0], cursorValues[0]);
  }

  // Tuple comparison expansion:
  // desc: (col1 < v1) OR (col1 = v1 AND col2 < v2) ...
  // asc:  (col1 > v1) OR (col1 = v1 AND col2 > v2) ...
  const conditions: SQL[] = [];
  for (let i = 0; i < cursorColumns.length; i++) {
    const eqParts: SQL[] = [];
    for (let j = 0; j < i; j++) {
      eqParts.push(eq(cursorColumns[j], cursorValues[j]));
    }
    eqParts.push(compare(cursorColumns[i], cursorValues[i]));
    conditions.push(and(...eqParts)!);
  }

  return or(...conditions);
}
