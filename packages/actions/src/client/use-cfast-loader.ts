import { useLoaderData } from "react-router";
import type { ActionHookResult } from "./use-actions.js";

/**
 * The four CRUD actions used in `_can` annotations and `_tablePerms`.
 * Matches CrudAction from @cfast/permissions.
 */
type CrudAction = "read" | "create" | "update" | "delete";

/**
 * Creates an {@link ActionHookResult} from a boolean permission value.
 *
 * Since these are read-only permission checks (not tied to a fetcher),
 * `submit` is a no-op, `pending` is false, and `data`/`error` are undefined.
 */
function makeResult(permitted: boolean): ActionHookResult {
  return {
    permitted,
    invisible: false,
    reason: null,
    submit: () => {},
    pending: false,
    data: undefined,
    error: undefined,
  };
}

/**
 * Wraps a single row object that has `_can` with permission helper methods.
 *
 * The returned object spreads all original row properties AND adds
 * `canRead()`, `canCreate()`, `canEdit()`, `canDelete()` methods.
 * Row fields are directly accessible (no `.data` wrapper).
 *
 * Uses `Object.create` with property descriptors so the `can*()` methods
 * coexist with row properties without conflicts.
 */
function wrapItem<T extends Record<string, unknown>>(
  item: T,
): T & {
  canRead: () => ActionHookResult;
  canCreate: () => ActionHookResult;
  canEdit: () => ActionHookResult;
  canDelete: () => ActionHookResult;
} {
  const can = (item._can ?? {}) as Record<CrudAction, boolean>;

  // Create a new object with the item as prototype, then define methods
  const wrapped = Object.create(null);

  // Copy all enumerable properties from the item
  for (const [key, value] of Object.entries(item)) {
    if (key === "_can") continue; // keep _can but don't expose it as top-level
    Object.defineProperty(wrapped, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  // Preserve _can as non-enumerable for internal use
  Object.defineProperty(wrapped, "_can", {
    value: item._can,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  // Add permission methods as non-enumerable
  Object.defineProperty(wrapped, "canRead", {
    value: () => makeResult(can.read ?? false),
    enumerable: false,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(wrapped, "canCreate", {
    value: () => makeResult(can.create ?? false),
    enumerable: false,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(wrapped, "canEdit", {
    value: () => makeResult(can.update ?? false),
    enumerable: false,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(wrapped, "canDelete", {
    value: () => makeResult(can.delete ?? false),
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return wrapped;
}

/**
 * Wraps an array of items that have `_can` into a permission-aware collection.
 *
 * The returned value behaves like a normal array (indexing, `.map()`, etc.)
 * but also has a `canAdd()` method that checks table-level create permission.
 * Each item in the array is wrapped with `canEdit()`, `canDelete()`, etc.
 *
 * The `canAdd()` method reads from `_tablePerms` using the `_tableName`
 * annotation that `cfastJson()` attaches to arrays.
 */
function wrapCollection<T extends Record<string, unknown>>(
  arr: T[],
  tablePerms: Record<string, Record<CrudAction, boolean>>,
): T[] & {
  canAdd: () => ActionHookResult;
} {
  // Wrap each item
  const wrappedItems = arr.map((item) => {
    if (item && typeof item === "object" && "_can" in item) {
      return wrapItem(item);
    }
    return item;
  });

  // Determine table name from the non-enumerable _tableName annotation
  const tableName = (arr as unknown as { _tableName?: string })._tableName;
  const perms = tableName ? tablePerms[tableName] : undefined;

  // Create the result as a proper array
  const result = [...wrappedItems] as T[] & { canAdd: () => ActionHookResult };

  // Preserve _tableName
  if (tableName) {
    Object.defineProperty(result, "_tableName", {
      value: tableName,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  // Add canAdd method
  Object.defineProperty(result, "canAdd", {
    value: () => makeResult(perms?.create ?? false),
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return result;
}

/**
 * Client hook that replaces `useLoaderData()` for routes using `cfastJson()`.
 *
 * Returns the same data but wraps arrays and objects that have `_can` with
 * permission helper methods:
 *
 * - **Collections** (arrays with items that have `_can`): array works normally
 *   (indexing, `.map()`, etc.) AND has `canAdd()`. Each item has `canEdit()`,
 *   `canDelete()`, `canRead()`, `canCreate()`.
 * - **Items** (objects with `_can`): row properties directly accessible,
 *   plus `canEdit()`, `canDelete()`, `canRead()`, `canCreate()`.
 * - **Other fields**: passed through unchanged.
 *
 * Each `can*()` method returns an {@link ActionHookResult}.
 *
 * @example
 * ```tsx
 * const { documents } = useCfastLoader<typeof loader>();
 *
 * // Collection-level
 * documents.canAdd()          // -> ActionHookResult
 *
 * // Row fields accessible directly
 * documents[0].title          // "Hello World"
 *
 * // Row-level
 * documents[0].canEdit()      // -> ActionHookResult
 * documents[0].canDelete()    // -> ActionHookResult
 * ```
 */
export function useCfastLoader<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any = () => Record<string, unknown>,
>(): ReturnType<T> extends Promise<infer R> ? R : ReturnType<T> {
  const raw = useLoaderData() as Record<string, unknown>;
  const tablePerms = (raw._tablePerms ?? {}) as Record<
    string,
    Record<CrudAction, boolean>
  >;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (key === "_tablePerms") {
      // Don't expose _tablePerms to the consumer directly
      continue;
    }

    if (Array.isArray(value)) {
      // Check if items have _can — wrap as collection
      const hasCanItems =
        value.length > 0 &&
        value[0] !== null &&
        typeof value[0] === "object" &&
        "_can" in value[0];

      if (hasCanItems) {
        result[key] = wrapCollection(value as Record<string, unknown>[], tablePerms);
      } else {
        result[key] = value;
      }
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "_can" in value
    ) {
      // Single item with _can — wrap as item
      result[key] = wrapItem(value as Record<string, unknown>);
    } else {
      // Pass through
      result[key] = value;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result as any;
}
