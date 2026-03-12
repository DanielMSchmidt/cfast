import { createElement, useState, useCallback, type ReactElement } from "react";
import JoyButton from "@mui/joy/Button";
import JoyStack from "@mui/joy/Stack";
import JoyTypography from "@mui/joy/Typography";
import { PageContainer } from "./page-container.js";
import { DataTable } from "./data-table.js";
import { FilterBar } from "./filter-bar.js";
import { BulkActionBar } from "./bulk-action-bar.js";
import { EmptyState } from "./empty-state.js";
import { ActionButton } from "./action-button.js";
import type { ListViewProps, BulkAction, ColumnShorthand } from "../types.js";

/**
 * Joy UI styled ListView — full page list with filters, table, and pagination.
 */
export function ListView<T = unknown>({
  title,
  data,
  table: _table,
  columns,
  actions: _actions,
  filters,
  searchable,
  createAction,
  createLabel = "Create",
  selectable = false,
  bulkActions,
  breadcrumb,
}: ListViewProps<T>): ReactElement {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const handleBulkAction = useCallback(
    (action: BulkAction) => {
      if (action.handler) {
        action.handler(selectedRows);
      }
    },
    [selectedRows],
  );

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const createButton = createAction
    ? createElement(ActionButton, {
        action: createAction,
        children: createLabel,
        variant: "solid",
        color: "primary",
      })
    : null;

  return createElement(
    PageContainer,
    {
      title,
      breadcrumb,
      actions: createButton,
      children: createElement(
        JoyStack,
        { spacing: 2 },
        // Filters
        filters && filters.length > 0
          ? createElement(FilterBar, { filters, searchable })
          : null,
        // Bulk actions
        selectable && bulkActions && bulkActions.length > 0
          ? createElement(BulkActionBar, {
              selectedCount: selectedRows.length,
              actions: bulkActions,
              onAction: handleBulkAction,
              onClearSelection: clearSelection,
            })
          : null,
        // Data table or empty state
        data.items.length === 0 && !data.isLoading
          ? createElement(EmptyState, {
              title: `No ${title.toLowerCase()} found`,
              description: filters ? "Try adjusting your filters" : undefined,
              createAction,
              createLabel,
            })
          : createElement(DataTable, {
              data,
              columns: columns as ColumnShorthand<unknown>[],
              selectable,
              selectedRows: selectable ? (selectedRows as unknown[]) : undefined,
              onSelectionChange: selectable
                ? (rows: unknown[]) => setSelectedRows(rows as T[])
                : undefined,
            }),
        // Offset pagination
        data.totalPages && data.totalPages > 1 && data.goToPage
          ? createElement(
              JoyStack,
              { direction: "row" as const, justifyContent: "center", alignItems: "center", spacing: 2 },
              createElement(JoyButton, {
                size: "sm" as const,
                variant: "outlined" as const,
                disabled: data.currentPage === 1,
                onClick: () => data.goToPage?.(Math.max(1, (data.currentPage ?? 1) - 1)),
                children: "Previous",
              }),
              createElement(
                JoyTypography,
                { level: "body-sm" as const },
                `Page ${data.currentPage ?? 1} of ${data.totalPages}`,
              ),
              createElement(JoyButton, {
                size: "sm" as const,
                variant: "outlined" as const,
                disabled: data.currentPage === data.totalPages,
                onClick: () =>
                  data.goToPage?.(Math.min(data.totalPages ?? 1, (data.currentPage ?? 1) + 1)),
                children: "Next",
              }),
            )
          : null,
        // Cursor-based load more
        data.hasMore && data.loadMore
          ? createElement(
              JoyStack,
              { alignItems: "center" },
              createElement(JoyButton, {
                variant: "soft" as const,
                onClick: data.loadMore,
                children: "Load more",
              }),
            )
          : null,
      ),
    },
  );
}
