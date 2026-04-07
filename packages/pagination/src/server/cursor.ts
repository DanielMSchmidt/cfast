/**
 * Opaque cursor encoding/decoding for cursor-based pagination.
 *
 * Cursors are base64-encoded JSON arrays of column values from the last row of
 * a page. The format matches `@cfast/db`'s cursor encoding so cursors are
 * interchangeable when callers mix the two helpers.
 *
 * @module
 */

/**
 * Normalizes a single cursor value into a JSON-safe form.
 *
 * `Date` becomes its ISO 8601 string (which compares lexicographically and
 * survives `JSON.stringify`/`JSON.parse`). All other types pass through.
 * Exported for the comparator in `apply-cursor-pagination` so encode and
 * compare use the same normalization.
 */
export function normalizeCursorValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

/**
 * Encodes an array of cursor column values into an opaque base64 string.
 *
 * The cursor is opaque to clients and should not be parsed or constructed
 * by hand. Pass the values from the last row of the current page in the
 * same order as `cursorColumns`.
 *
 * `Date` values are normalized to ISO 8601 strings before encoding so the
 * cursor round-trips through JSON without losing precision.
 *
 * @param values - Column values from the last row of the current page.
 * @returns A base64-encoded cursor string.
 *
 * @example
 * ```ts
 * const cursor = encodeCursor([new Date("2024-01-01"), "abc123"]);
 * // => "eyJ2IjpbIjIwMjQtMDEtMDFUMDA6MDA6MDAuMDAwWiIsImFiYzEyMyJdfQ=="
 * ```
 */
export function encodeCursor(values: unknown[]): string {
  const normalized = values.map(normalizeCursorValue);
  return btoa(JSON.stringify({ v: normalized }));
}

/**
 * Decodes an opaque cursor string back into an array of column values.
 *
 * Returns `null` if the cursor is `null`, malformed, or fails to parse.
 * Callers should treat a `null` result as "no cursor", which is also the
 * intended fallback for invalid cursors (start from the beginning).
 *
 * @param cursor - The base64-encoded cursor string, or `null`.
 * @returns The decoded array of column values, or `null` if invalid.
 *
 * @example
 * ```ts
 * const values = decodeCursor("eyJ2IjpbImFiYzEyMyJdfQ==");
 * // => ["abc123"]
 * ```
 */
export function decodeCursor(cursor: string | null): unknown[] | null {
  if (cursor === null) return null;
  try {
    const parsed: unknown = JSON.parse(atob(cursor));
    if (typeof parsed === "object" && parsed !== null && "v" in parsed) {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record["v"])) {
        return record["v"];
      }
    }
    return null;
  } catch {
    return null;
  }
}
