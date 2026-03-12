import { createElement, useState, useCallback, type ReactElement } from "react";
import JoyTable from "@mui/joy/Table";
import JoySheet from "@mui/joy/Sheet";
import JoyCheckbox from "@mui/joy/Checkbox";

import type { DataTableProps, ColumnDef, ColumnShorthand } from "../types.js";

function normalizeColumns<T>(columns: ColumnShorthand<T>[] | undefined): ColumnDef<T>[] {
  if (!columns) return [];
  return columns.map((col) => {
    if (typeof col === "string") {
      return {
        key: col,
        label: col.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(),
        sortable: true,
      };
    }
    return col;
  });
}

/**
 * Joy UI styled DataTable.
 * Renders a MUI Joy Table with sorting, selection, and row actions.
 */
export function DataTable<T = unknown>({
  data,
  columns: columnsProp,
  selectable = false,
  selectedRows: externalSelectedRows,
  onSelectionChange,
  onRowClick,
  getRowId,
  emptyMessage = "No data",
}: DataTableProps<T>): ReactElement {
  const columns = normalizeColumns(columnsProp);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [internalSelected, setInternalSelected] = useState<Set<string | number>>(new Set());

  const getId = getRowId ?? defaultGetId;

  const selectedSet = externalSelectedRows
    ? new Set(externalSelectedRows.map((r) => getId(r)))
    : internalSelected;

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  const toggleRow = useCallback((id: string | number) => {
    if (onSelectionChange) {
      const row = data.items.find((r) => getId(r) === id);
      if (!row) return;
      const current = externalSelectedRows ?? [];
      const isSelected = current.some((r) => getId(r) === id);
      onSelectionChange(isSelected ? current.filter((r) => getId(r) !== id) : [...current, row]);
    } else {
      setInternalSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [data.items, externalSelectedRows, onSelectionChange, getId]);

  if (data.items.length === 0 && !data.isLoading) {
    return createElement(
      "div",
      { style: { textAlign: "center" as const, padding: "32px", color: "#666" } },
      emptyMessage,
    );
  }

  return createElement(
    JoySheet,
    { variant: "outlined", sx: { borderRadius: "sm", overflow: "auto" } },
    createElement(
      JoyTable,
      { hoverRow: true, sx: { "& th": { fontWeight: "lg" } } },
      createElement(
        "thead",
        null,
        createElement(
          "tr",
          null,
          selectable
            ? createElement("th", { style: { width: 40 } })
            : null,
          ...columns.map((col) =>
            createElement(
              "th",
              { key: col.key },
              col.sortable !== false
                ? createElement(
                    "button",
                    {
                      onClick: () => handleSort(col.key),
                      style: {
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        font: "inherit",
                        padding: 0,
                        color: "inherit",
                      },
                    },
                    col.label ?? col.key,
                    sortKey === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : null,
                  )
                : (col.label ?? col.key),
            ),
          ),
        ),
      ),
      createElement(
        "tbody",
        null,
        ...data.items.map((row) => {
          const id = getId(row);
          const isSelected = selectedSet.has(id);

          return createElement(
            "tr",
            {
              key: String(id),
              onClick: onRowClick ? () => onRowClick(row) : undefined,
              style: onRowClick ? { cursor: "pointer" } : undefined,
            },
            selectable
              ? createElement(
                  "td",
                  null,
                  createElement(JoyCheckbox, {
                    checked: isSelected,
                    onChange: () => toggleRow(id),
                    size: "sm" as const,
                  }),
                )
              : null,
            ...columns.map((col) => {
              const value = (row as Record<string, unknown>)[col.key];
              return createElement(
                "td",
                { key: col.key },
                col.render ? col.render(value, row) : String(value ?? ""),
              );
            }),
          );
        }),
      ),
    ),
  );
}

function defaultGetId<T>(row: T): string | number {
  return (row as Record<string, unknown>).id as string | number;
}
