import { useMemo } from "react";
import { fieldForColumn } from "../fields/field-for-column.js";
import type { ColumnDef } from "../types.js";
import type { ComponentType } from "react";

/** Drizzle column metadata used for field type inference. */
type ColumnMeta = {
  dataType: string;
  name: string;
  notNull?: boolean;
};

/** A column definition extended with an inferred TypedField component. */
type InferredColumn = ColumnDef & {
  /** The field component that renders the appropriate display for this column type. */
  field: ComponentType<{ value: unknown }>;
};

/**
 * Inspects a Drizzle table's columns and returns inferred column definitions
 * with appropriate TypedField components.
 *
 * Memoized -- only recomputes when the table or columns array changes.
 *
 * @param table - A Drizzle table object (columns accessible via iteration)
 * @param columns - Optional subset of column names to include; preserves the given order
 * @returns Array of inferred column definitions with field components
 *
 * @example
 * ```ts
 * const cols = useColumnInference(posts, ["title", "createdAt", "published"]);
 * // cols[0].field === TextField
 * // cols[1].field === DateField
 * // cols[2].field === BooleanField
 * ```
 */
export function useColumnInference(
  table: Record<string, unknown> | undefined,
  columns?: string[],
): InferredColumn[] {
  return useMemo(() => {
    if (!table) return [];

    const result: InferredColumn[] = [];

    for (const [key, col] of Object.entries(table)) {
      if (columns && !columns.includes(key)) continue;
      if (!col || typeof col !== "object" || !("dataType" in col) || !("name" in col)) continue;

      const meta = col as ColumnMeta;
      const field = fieldForColumn(meta);
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();

      result.push({
        key,
        label,
        sortable: true,
        field,
      });
    }

    // Preserve the order from `columns` if provided
    if (columns) {
      result.sort((a, b) => columns.indexOf(a.key) - columns.indexOf(b.key));
    }

    return result;
  }, [table, columns]);
}
