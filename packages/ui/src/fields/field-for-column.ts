import type { ComponentType } from "react";
import type { BaseFieldProps } from "../types.js";
import { DateField } from "./date-field.js";
import { BooleanField } from "./boolean-field.js";
import { NumberField } from "./number-field.js";
import { TextField } from "./text-field.js";
import { EmailField } from "./email-field.js";
import { JsonField } from "./json-field.js";

type ColumnMeta = {
  dataType: string;
  name: string;
};

/**
 * Maps a Drizzle column's metadata to the appropriate TypedField component.
 *
 * Uses `getTableColumns(table)` from drizzle-orm to get column metadata,
 * then maps the `dataType` to a field component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fieldForColumn(column: ColumnMeta): ComponentType<any> {
  const { dataType, name } = column;
  const dt = dataType.toLowerCase();

  // Boolean types
  if (dt === "boolean" || dt === "integer" && name.startsWith("is")) {
    return BooleanField;
  }

  // Date/timestamp types
  if (dt.includes("timestamp") || dt.includes("date") || dt.includes("datetime")) {
    return DateField;
  }

  // Numeric types
  if (dt === "integer" || dt === "real" || dt === "numeric" || dt.includes("int") || dt.includes("float") || dt.includes("double") || dt.includes("decimal")) {
    return NumberField;
  }

  // Email heuristic
  if (name === "email" || name.endsWith("Email")) {
    return EmailField;
  }

  // JSON types
  if (dt === "json" || dt === "jsonb" || dt === "blob") {
    return JsonField;
  }

  // Default to text
  return TextField;
}

/**
 * Given a Drizzle table, returns a map of column names to field components.
 */
export function fieldsForTable(
  table: { [Symbol.iterator]?: never } & Record<string, unknown>,
): Record<string, ComponentType<BaseFieldProps & { value: unknown }>> {
  // Use drizzle-orm's getTableColumns if available
  // For now, we do a duck-type check for the column structure
  const result: Record<string, ComponentType<BaseFieldProps & { value: unknown }>> = {};

  for (const [key, col] of Object.entries(table)) {
    if (col && typeof col === "object" && "dataType" in col && "name" in col) {
      result[key] = fieldForColumn(col as ColumnMeta);
    }
  }

  return result;
}
