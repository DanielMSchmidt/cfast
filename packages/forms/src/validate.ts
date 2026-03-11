import type { Column } from "drizzle-orm";
import type { ColumnBuilderBase } from "drizzle-orm/column-builder";
import type { ValidationRules } from "./types";

export const VALIDATE_SYMBOL = Symbol.for("cfast:validate");

/**
 * Attach validation rules to a Drizzle column builder.
 * The rules are stored on the builder's internal config object via a Symbol,
 * which Drizzle passes through to the built Column instance.
 *
 * @example
 * ```ts
 * const posts = sqliteTable("posts", {
 *   title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
 *   views: v(integer("views"), { min: 0 }),
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
 * Read validation rules from a built Column instance.
 */
export function getValidationRules(
  column: Column,
): ValidationRules | undefined {
  return (column as unknown as { config: Record<symbol, unknown> }).config[
    VALIDATE_SYMBOL
  ] as ValidationRules | undefined;
}
