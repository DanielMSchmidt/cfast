import { PageContainer } from "./page-container.js";
import { fieldForColumn } from "../fields/field-for-column.js";
import type { DetailViewProps, ColumnDef, ColumnShorthand } from "../types.js";

function normalizeFields<T>(
  fields: ColumnShorthand<T>[] | undefined,
): ColumnDef<T>[] {
  if (!fields) return [];
  return fields.map((col) => {
    if (typeof col === "string") {
      return {
        key: col,
        label: col
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim(),
      };
    }
    return col;
  });
}

/**
 * Composite DetailView — displays a single record's fields in a two-column grid.
 * Composes PageContainer + TypedField rendering.
 */
export function DetailView<T = unknown>({
  title,
  table,
  record,
  fields: fieldsProp,
  exclude,
  breadcrumb,
}: DetailViewProps<T>) {
  const fields = normalizeFields(fieldsProp);

  // If no fields specified but table is provided, infer from table
  const displayFields =
    fields.length > 0
      ? fields
      : inferFieldsFromRecord(record, exclude);

  return (
    <PageContainer title={title} breadcrumb={breadcrumb}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {displayFields.map((field) => {
          const value = (record as Record<string, unknown>)[field.key];
          const FieldComponent = field.render
            ? null
            : resolveFieldComponent(field.key, table);

          return (
            <div key={field.key}>
              <div
                style={{
                  fontSize: "0.85em",
                  color: "#666",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                {field.label ?? field.key}
              </div>
              <div>
                {field.render
                  ? field.render(value, record)
                  : FieldComponent
                    ? <FieldComponent value={value} />
                    : String(value ?? "—")}
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}

function inferFieldsFromRecord<T>(
  record: T,
  exclude?: string[],
): ColumnDef<T>[] {
  if (!record || typeof record !== "object") return [];

  return Object.keys(record as Record<string, unknown>)
    .filter((key) => !exclude || !exclude.includes(key))
    .map((key) => ({
      key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim(),
    }));
}

function resolveFieldComponent(
  _key: string,
  table: unknown,
): ReturnType<typeof fieldForColumn> | null {
  if (!table || typeof table !== "object") return null;

  const col = (table as Record<string, unknown>)[_key];
  if (!col || typeof col !== "object" || !("dataType" in col) || !("name" in col)) {
    return null;
  }

  const meta = col as { dataType: string; name: string };
  return fieldForColumn(meta);
}
