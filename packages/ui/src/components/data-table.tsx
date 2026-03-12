import { createElement, useState, useCallback } from "react";
import { useComponent } from "../plugin.js";
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
 * Headless DataTable — renders a table with sorting, selection, and row actions.
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
}: DataTableProps<T>) {
  const Table = useComponent("table");
  const TableHead = useComponent("tableHead");
  const TableBody = useComponent("tableBody");
  const TableRow = useComponent("tableRow");
  const TableCell = useComponent("tableCell");

  const columns = normalizeColumns(columnsProp);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [internalSelected, setInternalSelected] = useState<Set<string | number>>(new Set());

  const selectedSet = externalSelectedRows
    ? new Set(externalSelectedRows.map((r) => (getRowId ?? defaultGetId)(r)))
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
      const row = data.items.find((r) => (getRowId ?? defaultGetId)(r) === id);
      if (!row) return;
      const current = externalSelectedRows ?? [];
      const isSelected = current.some((r) => (getRowId ?? defaultGetId)(r) === id);
      onSelectionChange(isSelected ? current.filter((r) => (getRowId ?? defaultGetId)(r) !== id) : [...current, row]);
    } else {
      setInternalSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [data.items, externalSelectedRows, onSelectionChange, getRowId]);

  if (data.items.length === 0 && !data.isLoading) {
    return createElement("div", { style: { textAlign: "center" as const, padding: "32px", color: "#666" } }, emptyMessage);
  }

  return createElement(
    Table,
    { hoverRow: true, children: createElement("div") },
    createElement(
      TableHead,
      { children: createElement("div") },
      createElement(
        TableRow,
        { children: createElement("div") },
        selectable
          ? createElement(TableCell, { header: true, children: "" })
          : null,
        ...columns.map((col) =>
          createElement(TableCell, {
            key: col.key,
            header: true,
            sortable: col.sortable !== false,
            sortDirection: sortKey === col.key ? sortDir : null,
            onSort: () => handleSort(col.key),
            children: col.label ?? col.key,
          }),
        ),
      ),
    ),
    createElement(
      TableBody,
      { children: createElement("div") },
      ...data.items.map((row) => {
        const id = (getRowId ?? defaultGetId)(row);
        const isSelected = selectedSet.has(id);

        return createElement(
          TableRow,
          {
            key: String(id),
            selected: isSelected,
            onClick: onRowClick ? () => onRowClick(row) : undefined,
            children: createElement("div"),
          },
          selectable
            ? createElement(TableCell, {
                children: createElement("input", {
                  type: "checkbox",
                  checked: isSelected,
                  onChange: () => toggleRow(id),
                }),
              })
            : null,
          ...columns.map((col) => {
            const value = (row as Record<string, unknown>)[col.key];
            return createElement(TableCell, {
              key: col.key,
              children: col.render ? col.render(value, row) : String(value ?? ""),
            });
          }),
        );
      }),
    ),
  );
}

function defaultGetId<T>(row: T): string | number {
  return (row as Record<string, unknown>).id as string | number;
}
