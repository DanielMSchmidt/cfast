import type { Column } from "drizzle-orm";
import type { ColumnBuilderBase } from "drizzle-orm/column-builder";
import type { ValidationRules } from "./types";

/**
 * Symbol key used to store {@link ValidationRules} on Drizzle column builder configs.
 *
 * @internal
 */
export const VALIDATE_SYMBOL = Symbol.for("cfast:validate");

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
  (
    (builder as unknown as { config: Record<symbol, unknown> }).config
  )[VALIDATE_SYMBOL] = rules;
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
  return (column as unknown as { config: Record<symbol, unknown> }).config[
    VALIDATE_SYMBOL
  ] as ValidationRules | undefined;
}
