/**
 * Typed boundary types for accessing Drizzle ORM internal properties.
 *
 * Drizzle's `Column` and `ColumnBuilder` classes expose some metadata as public
 * properties (`dataType`, `columnType`, `notNull`, etc.) but mark the `config`
 * object as `protected`. We need to read `config` in two places:
 *
 * 1. To read `config.length` on text columns (set by `text("col", { length: N })`),
 *    so we can derive `maxLength` validation rules.
 * 2. To read/write `config[VALIDATE_SYMBOL]` for storing custom validation rules
 *    via the `v()` helper.
 *
 * These types document the internal structure we depend on and provide a single
 * place to update if Drizzle's internals change. They replace scattered
 * `as unknown as X` double-casts with a named, documented boundary.
 *
 * @internal
 * @module
 */

/**
 * Describes the protected `config` object on a Drizzle `Column` instance.
 *
 * Drizzle stores runtime column metadata in `config` (typed as
 * `ColumnBuilderRuntimeConfig<TData, TRuntimeConfig>` internally). The
 * properties we access are:
 *
 * - `length` (optional): Set by `text("col", { length: N })` on SQLite text columns.
 * - `[symbol]` entries: Used by `v()` for custom validation rules via VALIDATE_SYMBOL.
 *
 * @internal
 */
type DrizzleColumnConfig = {
  readonly length?: number;
  [key: symbol]: unknown;
};

/**
 * Minimal shape of the protected `config` on a `ColumnBuilder`, used by `v()`
 * to write validation rules before the column is built.
 *
 * @internal
 */
type DrizzleBuilderConfig = {
  [key: symbol]: unknown;
};

/**
 * The internal properties of a Drizzle `Column` that we access for form
 * introspection. Combines public properties (which Drizzle exposes but
 * TypeScript's `Column` type parameterises away) with the protected `config`.
 *
 * Used in `introspectTable` to read column metadata without repeated inline casts.
 *
 * @internal
 */
export type DrizzleColumnMeta = {
  readonly dataType: string;
  readonly columnType: string;
  readonly notNull: boolean;
  readonly hasDefault: boolean;
  readonly primary: boolean;
  readonly enumValues?: readonly string[] | string[];
  readonly config: DrizzleColumnConfig;
};

/**
 * The internal shape of a Drizzle `ColumnBuilder`, providing access to the
 * protected `config` property. Used by `v()` to attach validation rules.
 *
 * @internal
 */
export type ColumnBuilderInternal = {
  config: DrizzleBuilderConfig;
};

/**
 * The internal shape of a built Drizzle `Column` for reading validation rules.
 * Used by `getValidationRules()` to retrieve rules attached via `v()`.
 *
 * @internal
 */
export type ColumnInternal = {
  readonly config: DrizzleColumnConfig;
};

/**
 * Cast a Drizzle `Column` (from `getTableColumns`) to our typed boundary type.
 *
 * Drizzle's public `Column` type hides concrete property types behind generics.
 * At runtime the properties exist; this function provides typed access while
 * keeping the cast in one auditable location.
 *
 * Why this is needed: `getTableColumns()` returns `Record<string, Column>`, where
 * `Column` is generic. The concrete properties (`dataType`, `notNull`, `config`,
 * etc.) are present at runtime but not directly accessible through the generic
 * type. Additionally, `config` is `protected` and cannot be accessed without
 * crossing the type boundary.
 *
 * @param column - A Drizzle column instance from `getTableColumns`.
 * @returns The same object typed as {@link DrizzleColumnMeta}.
 *
 * @internal
 */
export function asDrizzleColumnMeta(column: unknown): DrizzleColumnMeta {
  // Single cast at the documented Drizzle internal access boundary.
  // The runtime shape is guaranteed by Drizzle's Column class implementation.
  return column as DrizzleColumnMeta;
}

/**
 * Cast a Drizzle `ColumnBuilder` to our typed boundary type for writing config.
 *
 * Drizzle marks `config` as `protected`, so external code cannot write to it
 * without a cast. This function provides typed access at a single boundary point.
 *
 * Why this is needed: The `v()` helper stores validation rules on the builder's
 * `config` object using a Symbol key. This survives into the built Column instance
 * because Drizzle passes `config` through during construction.
 *
 * @param builder - A Drizzle column builder instance.
 * @returns The same object typed as {@link ColumnBuilderInternal}.
 *
 * @internal
 */
export function asBuilderInternal(builder: unknown): ColumnBuilderInternal {
  // Single cast at the documented Drizzle internal access boundary.
  // The runtime shape is guaranteed by Drizzle's ColumnBuilder class implementation.
  return builder as ColumnBuilderInternal;
}

/**
 * Cast a built Drizzle `Column` to our typed boundary type for reading config.
 *
 * Why this is needed: The `getValidationRules()` function reads validation rules
 * from the Column's protected `config` object that were previously written by `v()`.
 *
 * @param column - A built Drizzle Column instance.
 * @returns The same object typed as {@link ColumnInternal}.
 *
 * @internal
 */
export function asColumnInternal(column: unknown): ColumnInternal {
  // Single cast at the documented Drizzle internal access boundary.
  // The runtime shape is guaranteed by Drizzle's Column class implementation.
  return column as ColumnInternal;
}
