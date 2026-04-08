import type { Column } from "drizzle-orm";
import type { ColumnBuilderBase } from "drizzle-orm/column-builder";
import { asBuilderInternal, asColumnInternal } from "./drizzle-internals";
import type { UploadFieldMetadata, ValidationRules } from "./types";

/**
 * Symbol key used to store {@link ValidationRules} on Drizzle column builder configs.
 *
 * @internal
 */
export const VALIDATE_SYMBOL = Symbol.for("cfast:validate");

/**
 * Symbol key used to store {@link UploadFieldMetadata} on Drizzle column builder
 * configs. Mirrors {@link VALIDATE_SYMBOL} but for the upload field path so
 * the two helpers can coexist on the same column without colliding.
 *
 * @internal
 */
export const UPLOAD_SYMBOL = Symbol.for("cfast:upload");

/**
 * Attach validation rules to a Drizzle column builder.
 *
 * The rules are stored on the builder's internal config object via a Symbol,
 * which Drizzle passes through to the built Column instance. {@link introspectTable}
 * reads these rules back alongside schema-derived constraints (NOT NULL, text length)
 * to produce complete {@link FieldDefinition} objects.
 *
 * @typeParam T - The Drizzle column builder type, preserved for chaining.
 * @param builder - A Drizzle column builder (e.g., `text("title").notNull()`).
 * @param rules - The {@link ValidationRules} to attach to the column.
 * @returns The same builder instance, so it can be used inline in a table definition.
 *
 * @example
 * ```ts
 * import { v } from "@cfast/forms";
 * import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
 *
 * export const posts = sqliteTable("posts", {
 *   title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
 *   views: v(integer("views"), { min: 0 }),
 *   slug: v(text("slug").notNull(), { pattern: /^[a-z0-9-]+$/ }),
 * });
 * ```
 */
export function v<T extends ColumnBuilderBase>(
  builder: T,
  rules: ValidationRules,
): T {
  // Access the protected config via the typed boundary helper.
  // See drizzle-internals.ts for documentation on why this is needed.
  asBuilderInternal(builder).config[VALIDATE_SYMBOL] = rules;
  return builder;
}

/**
 * Read validation rules previously attached via {@link v} from a built Column instance.
 *
 * Returns `undefined` if no rules were attached to this column.
 *
 * @param column - A built Drizzle Column to read validation rules from.
 * @returns The {@link ValidationRules} if present, or `undefined`.
 */
export function getValidationRules(
  column: Column,
): ValidationRules | undefined {
  // Access the protected config via the typed boundary helper.
  // See drizzle-internals.ts for documentation on why this is needed.
  const value = asColumnInternal(column).config[VALIDATE_SYMBOL];
  if (value === undefined) {
    return undefined;
  }
  return value as ValidationRules;
}

/**
 * Mark a Drizzle text column as an upload key, capturing the storage filetype
 * and per-field upload settings.
 *
 * The metadata is stored on the same protected `config` object that
 * {@link v} writes to, so the two helpers can be combined on a single
 * column without conflict. {@link introspectTable} reads it back and
 * promotes the column's `inputType` to `"upload"`.
 *
 * @typeParam T - The Drizzle column builder type, preserved for chaining.
 * @param builder - A Drizzle column builder (e.g., `text("image_key")`).
 * @param metadata - The upload field configuration (filetype + options).
 * @returns The same builder instance for inline chaining.
 *
 * @example
 * ```ts
 * import { upload } from "@cfast/forms";
 * import { sqliteTable, text } from "drizzle-orm/sqlite-core";
 *
 * export const products = sqliteTable("products", {
 *   imageKey: upload(text("image_key"), {
 *     filetype: "productImages",
 *     accept: "image/*",
 *     maxSize: 5 * 1024 * 1024,
 *   }),
 * });
 * ```
 */
export function upload<T extends ColumnBuilderBase>(
  builder: T,
  metadata: UploadFieldMetadata,
): T {
  asBuilderInternal(builder).config[UPLOAD_SYMBOL] = metadata;
  return builder;
}

/**
 * Read upload metadata previously attached via {@link upload} from a built
 * Column instance. Returns `undefined` if the column was not decorated.
 *
 * @param column - A built Drizzle Column.
 * @returns The {@link UploadFieldMetadata} if present, or `undefined`.
 */
export function getUploadMetadata(
  column: Column,
): UploadFieldMetadata | undefined {
  const value = asColumnInternal(column).config[UPLOAD_SYMBOL];
  if (value === undefined) {
    return undefined;
  }
  return value as UploadFieldMetadata;
}
