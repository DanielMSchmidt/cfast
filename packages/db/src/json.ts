/**
 * Recursively converts Date fields in a value to ISO 8601 strings for
 * JSON serialization.
 *
 * React Router loaders must return JSON-serializable data. Date objects
 * are not JSON-serializable by default -- `JSON.stringify(new Date())`
 * calls `Date.prototype.toJSON()` which produces an ISO string, but the
 * resulting value on the client is a string, not a Date. This helper
 * makes the conversion explicit and type-safe so every loader doesn't
 * need to manually call `.toISOString()` on every date field.
 *
 * Works on:
 * - Plain objects (shallow and nested)
 * - Arrays of objects
 * - Single Date values
 * - Nested arrays and objects of arbitrary depth
 *
 * Non-Date primitives (string, number, boolean, null, undefined) pass
 * through unchanged. The function is a no-op for values that don't
 * contain Date instances.
 *
 * @param value - The value to convert. Typically a query result row or
 *   array of rows from `db.query(...).findMany().run()`.
 * @returns A new value with every Date replaced by its ISO string.
 *
 * @example
 * ```ts
 * import { toJSON } from "@cfast/db";
 *
 * export async function loader({ context }) {
 *   const db = createDb({ ... });
 *   const posts = await db.query(postsTable).findMany().run();
 *   return { posts: toJSON(posts) };
 * }
 * ```
 */
export function toJSON<T>(value: T): DateToString<T> {
  return convertDates(value) as DateToString<T>;
}

function convertDates(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(convertDates);
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertDates(val);
    }
    return result;
  }

  return value;
}

/**
 * Type-level utility that converts Date fields to string in a type.
 *
 * Maps `{ createdAt: Date; title: string }` to
 * `{ createdAt: string; title: string }` so the return type of
 * `toJSON(row)` accurately reflects the runtime shape.
 */
export type DateToString<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? DateToString<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: DateToString<T[K]> }
      : T;
