import type { Column } from "drizzle-orm";
import { ColumnBuilder } from "drizzle-orm/column-builder";
import type { ValidationRules } from "./types";

export const VALIDATE_SYMBOL = Symbol.for("cfast:validate");

// Augment ColumnBuilder prototype with $validate
(ColumnBuilder.prototype as unknown as Record<string, unknown>)["$validate"] =
  function (this: ColumnBuilder, rules: ValidationRules) {
    (
      (this as unknown as { config: Record<symbol, unknown> }).config
    )[VALIDATE_SYMBOL] = rules;
    return this;
  };

// TypeScript declaration merge
declare module "drizzle-orm/column-builder" {
  interface ColumnBuilder {
    $validate(rules: ValidationRules): this;
  }
}

export function getValidationRules(
  column: Column,
): ValidationRules | undefined {
  return (column as unknown as { config: Record<symbol, unknown> }).config[
    VALIDATE_SYMBOL
  ] as ValidationRules | undefined;
}
