import type { ReactElement } from "react";
import JoyGrid from "@mui/joy/Grid";
import JoyTypography from "@mui/joy/Typography";
import { PageContainer } from "./page-container.js";
import { fieldForColumn } from "../fields/field-for-column.js";
import type { DetailViewProps, ColumnDef, ColumnShorthand } from "../types.js";
import { getField } from "../record-access.js";

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
 * Joy UI styled DetailView — two-column grid of record fields.
 */
export function DetailView<T = unknown>({
  title,
  table,
  record,
  fields: fieldsProp,
  exclude,
  breadcrumb,
}: DetailViewProps<T>): ReactElement {
  const fields = normalizeFields(fieldsProp);

  const displayFields =
    fields.length > 0
      ? fields
      : inferFieldsFromRecord(record, exclude);

  return (
    <PageContainer title={title} breadcrumb={breadcrumb}>
      <JoyGrid container spacing={2}>
        {displayFields.map((field) => {
          const value = getField(record, field.key);
          const FieldComponent = field.render
            ? null
            : resolveFieldComponent(field.key, table);

          return (
            <JoyGrid key={field.key} xs={12} md={6}>
              {/* MUI polymorphic component workaround — literal types required */}
              <JoyTypography
                level={"body-xs" as const}
                textTransform={"uppercase" as const}
                fontWeight={"lg" as const}
                mb={0.5}
              >
                {field.label ?? field.key}
              </JoyTypography>
              <div>
                {field.render
                  ? field.render(value, record)
                  : FieldComponent
                    ? <FieldComponent value={value} />
                    : String(value ?? "—")}
              </div>
            </JoyGrid>
          );
        })}
      </JoyGrid>
    </PageContainer>
  );
}

function inferFieldsFromRecord<T>(
  record: T,
  exclude?: string[],
): ColumnDef<T>[] {
  if (!record || typeof record !== "object") return [];

  return Object.keys(record)
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

  const col = getField(table, _key);
  if (
    !col ||
    typeof col !== "object" ||
    !("dataType" in col) ||
    typeof col.dataType !== "string" ||
    !("name" in col) ||
    typeof col.name !== "string"
  ) {
    return null;
  }

  return fieldForColumn({ dataType: col.dataType, name: col.name });
}
