import { getTableColumns } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { asDrizzleColumnMeta } from "./drizzle-internals";
import type { FieldDefinition, InputType, ValidationRules } from "./types";
import { getUploadMetadata, getValidationRules } from "./validate";

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
    const uploadMeta = getUploadMetadata(column);
    // Access Drizzle column internals via the typed boundary helper.
    // See drizzle-internals.ts for documentation on why this is needed.
    const col = asDrizzleColumnMeta(column);

    const validation: ValidationRules = { ...customRules };

    // Derive maxLength from text column length if not explicitly set
    if (col.config.length && validation.maxLength === undefined) {
      validation.maxLength = col.config.length;
    }

    // Upload columns get promoted to a dedicated input type so the AutoForm
    // renderer can pick the registered upload component instead of the
    // default text input. The underlying Drizzle column stays a `text`,
    // which is what we want — the database stores R2 keys as strings.
    const inputType: InputType = uploadMeta ? "upload" : resolveInputType(col);

    fields.push({
      name: key,
      inputType,
      label: columnNameToLabel(column.name),
      required: col.notNull,
      hasDefault: col.hasDefault,
      isPrimaryKey: col.primary,
      enumValues: col.enumValues ? [...col.enumValues] : undefined,
      validation,
      upload: uploadMeta,
    });
  }

  return fields;
}
