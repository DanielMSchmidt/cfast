import { useState, useCallback } from "react";
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
 * Data table with column sorting, row selection, and pluggable cell rendering.
 *
 * Renders via the UI plugin's table slots (`table`, `tableHead`, `tableBody`,
 * `tableRow`, `tableCell`). Accepts column definitions as strings (auto-labeled)
 * or full {@link ColumnDef} objects for custom labels, sorting, and renderers.
 *
 * Integrates with `@cfast/pagination` hook results for paginated data and with
 * `@cfast/actions` for row-level actions.
 *
 * @typeParam T - The row data type.
 * @param props - See {@link DataTableProps}.
 *
 * @example
 * ```tsx
 * const pagination = usePagination<Post>();
 *
 * <DataTable
 *   data={pagination}
 *   columns={["title", "author", { key: "createdAt", sortable: false }]}
 *   selectable
 *   onRowClick={(row) => navigate(`/posts/${row.id}`)}
 * />
 * ```
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
    return <div style={{ textAlign: "center" as const, padding: "32px", color: "#666" }}>{emptyMessage}</div>;
  }

  return (
    <Table hoverRow>
      <TableHead>
        <TableRow>
          {selectable ? <TableCell header>{""}</TableCell> : null}
          {columns.map((col) => (
            <TableCell
              key={col.key}
              header
              sortable={col.sortable !== false}
              sortDirection={sortKey === col.key ? sortDir : null}
              onSort={() => handleSort(col.key)}
            >
              {col.label ?? col.key}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.items.map((row) => {
          const id = (getRowId ?? defaultGetId)(row);
          const isSelected = selectedSet.has(id);

          return (
            <TableRow
              key={String(id)}
              selected={isSelected}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {selectable ? (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(id)}
                  />
                </TableCell>
              ) : null}
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.key];
                return (
                  <TableCell key={col.key}>
                    {col.render ? col.render(value, row) : String(value ?? "")}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function defaultGetId<T>(row: T): string | number {
  return (row as Record<string, unknown>).id as string | number;
}
