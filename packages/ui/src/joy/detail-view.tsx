import { createElement, type ReactElement } from "react";
import JoyGrid from "@mui/joy/Grid";
import JoyTypography from "@mui/joy/Typography";
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

  return createElement(
    PageContainer,
    {
      title,
      breadcrumb,
      children: createElement(
        JoyGrid,
        { container: true, spacing: 2 },
        ...displayFields.map((field) => {
          const value = (record as Record<string, unknown>)[field.key];
          const FieldComponent = field.render
            ? null
            : resolveFieldComponent(field.key, table);

          return createElement(
            JoyGrid,
            { key: field.key, xs: 12, md: 6 },
            createElement(
              JoyTypography,
              {
                level: "body-xs" as const,
                textTransform: "uppercase" as const,
                fontWeight: "lg" as const,
                mb: 0.5,
              },
              field.label ?? field.key,
            ),
            createElement(
              "div",
              null,
              field.render
                ? field.render(value, record)
                : FieldComponent
                  ? createElement(FieldComponent, { value })
                  : String(value ?? "—"),
            ),
          );
        }),
      ),
    },
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
