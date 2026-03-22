import { useState, useCallback, type ReactElement } from "react";
import JoyTable from "@mui/joy/Table";
import JoySheet from "@mui/joy/Sheet";
import JoyCheckbox from "@mui/joy/Checkbox";

import type { DataTableProps, ColumnDef, ColumnShorthand } from "@cfast/ui";
import { getField, getRecordId } from "@cfast/ui";

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
    return (
      <div style={{ textAlign: "center" as const, padding: "32px", color: "#666" }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <JoySheet variant="outlined" sx={{ borderRadius: "sm", overflow: "auto" }}>
      <JoyTable hoverRow sx={{ "& th": { fontWeight: "lg" } }}>
        <thead>
          <tr>
            {selectable ? <th style={{ width: 40 }} /> : null}
            {columns.map((col) => (
              <th key={col.key}>
                {col.sortable !== false ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                      font: "inherit",
                      padding: 0,
                      color: "inherit",
                    }}
                  >
                    {col.label ?? col.key}
                    {sortKey === col.key ? (sortDir === "asc" ? " \u2191" : " \u2193") : null}
                  </button>
                ) : (col.label ?? col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.map((row) => {
            const id = getId(row);
            const isSelected = selectedSet.has(id);

            return (
              <tr
                key={String(id)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {selectable ? (
                  <td>
                    {/* MUI polymorphic component workaround — literal types required */}
                    <JoyCheckbox
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                      size={"sm" as const}
                    />
                  </td>
                ) : null}
                {columns.map((col) => {
                  const value = getField(row, col.key);
                  return (
                    <td key={col.key}>
                      {col.render ? col.render(value, row) : String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </JoyTable>
    </JoySheet>
  );
}

function defaultGetId<T>(row: T): string | number {
  return getRecordId(row);
}
