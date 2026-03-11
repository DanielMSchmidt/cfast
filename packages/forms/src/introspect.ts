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
