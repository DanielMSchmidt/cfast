import { getTableColumns } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { FieldDefinition, InputType, ValidationRules } from "./types";
import { getValidationRules } from "./validate";

function columnNameToLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveInputType(column: {
  dataType: string;
  columnType: string;
  enumValues?: readonly string[] | string[];
}): InputType {
  if (column.enumValues && column.enumValues.length > 0) {
    return "select";
  }
  if (column.columnType === "SQLiteBoolean") {
    return "checkbox";
  }
  switch (column.dataType) {
    case "number":
      return "number";
    case "boolean":
      return "checkbox";
    default:
      return "text";
  }
}

/**
 * Introspect a Drizzle SQLite table and produce field definitions for form generation.
 *
 * Reads column metadata (type, nullability, defaults, enums) and merges it with any
 * {@link ValidationRules} attached via the {@link v} helper. The resulting
 * {@link FieldDefinition} array is used by {@link createResolver} for validation
 * and by the AutoForm component for rendering.
 *
 * @param table - A Drizzle `SQLiteTable` to introspect.
 * @returns An array of {@link FieldDefinition} objects, one per column in the table.
 *
 * @example
 * ```ts
 * import { introspectTable } from "@cfast/forms";
 * import { posts } from "./schema";
 *
 * const fields = introspectTable(posts);
 * // [{ name: "title", inputType: "text", label: "Title", required: true, ... }, ...]
 * ```
 */
export function introspectTable(table: SQLiteTable): FieldDefinition[] {
  const columns = getTableColumns(table);
  const fields: FieldDefinition[] = [];

  for (const [key, column] of Object.entries(columns)) {
    const customRules = getValidationRules(column) ?? {};
    const col = column as unknown as {
      dataType: string;
      columnType: string;
      notNull: boolean;
      hasDefault: boolean;
      primary: boolean;
      enumValues?: readonly string[] | string[];
      config: { length?: number };
    };

    const validation: ValidationRules = { ...customRules };

    // Derive maxLength from text column length if not explicitly set
    if (col.config.length && validation.maxLength === undefined) {
      validation.maxLength = col.config.length;
    }

    fields.push({
      name: key,
      inputType: resolveInputType(col),
      label: columnNameToLabel(column.name),
      required: col.notNull,
      hasDefault: col.hasDefault,
      isPrimaryKey: col.primary,
      enumValues: col.enumValues ? [...col.enumValues] : undefined,
      validation,
    });
  }

  return fields;
}
