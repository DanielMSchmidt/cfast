/**
 * Safely retrieves a property from an unknown record-like value by string key.
 *
 * Isolates the single unavoidable `Record<string, unknown>` assertion needed
 * when accessing dynamic keys on generic row/record objects (e.g., in DataTable
 * and DetailView). Using this helper keeps the rest of the codebase cast-free.
 *
 * Returns `undefined` for non-object or null values.
 *
 * @param obj - A value expected to be a record-like object.
 * @param key - The property name to look up.
 * @returns The property value, or `undefined` if the key does not exist or obj is not an object.
 *
 * @internal
 */
export function getField(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null) {
    return undefined;
  }
  // Single isolation point for dynamic key access on generic objects
  return (obj as Record<string, unknown>)[key];
}

/**
 * Extracts a string or number `id` from an unknown value.
 *
 * Returns the `id` property when it is a `string` or `number`, otherwise
 * falls back to `0`. Isolates the dynamic-key access so callers avoid casts.
 *
 * @param obj - A value expected to be a record-like object with an `id` property.
 * @returns The `id` value as a `string | number`, or `0` if missing/wrong type.
 *
 * @internal
 */
export function getRecordId(obj: unknown): string | number {
  const id = getField(obj, "id");
  if (typeof id === "string" || typeof id === "number") {
    return id;
  }
  return 0;
}
