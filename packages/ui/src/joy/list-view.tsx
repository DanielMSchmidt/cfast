import { useState, useCallback, type ReactElement } from "react";
import JoyButton from "@mui/joy/Button";
import JoyStack from "@mui/joy/Stack";
import JoyTypography from "@mui/joy/Typography";
import { PageContainer } from "./page-container.js";
import { DataTable } from "./data-table.js";
import { FilterBar } from "./filter-bar.js";
import { BulkActionBar } from "./bulk-action-bar.js";
import { EmptyState } from "./empty-state.js";
import { ActionButton } from "./action-button.js";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { ClientDescriptor } from "@cfast/actions";
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
    ? <CreateButton action={createAction} label={createLabel} />
    : null;

  return (
    <PageContainer title={title} breadcrumb={breadcrumb} actions={createButton}>
      <JoyStack spacing={2}>
        {/* Filters */}
        {filters && filters.length > 0
          ? <FilterBar filters={filters} searchable={searchable} />
          : null}
        {/* Bulk actions */}
        {selectable && bulkActions && bulkActions.length > 0
          ? <BulkActionBar
              selectedCount={selectedRows.length}
              actions={bulkActions}
              onAction={handleBulkAction}
              onClearSelection={clearSelection}
            />
          : null}
        {/* Data table or empty state */}
        {data.items.length === 0 && !data.isLoading
          ? <EmptyState
              title={`No ${title.toLowerCase()} found`}
              description={filters ? "Try adjusting your filters" : undefined}
              createAction={createAction}
              createLabel={createLabel}
            />
          : <DataTable
              data={data}
              columns={columns as ColumnShorthand<unknown>[]}
              selectable={selectable}
              selectedRows={selectable ? (selectedRows as unknown[]) : undefined}
              onSelectionChange={selectable
                ? (rows: unknown[]) => setSelectedRows(rows as T[])
                : undefined}
            />}
        {/* Offset pagination */}
        {data.totalPages && data.totalPages > 1 && data.goToPage
          ? <JoyStack direction={"row" as const} justifyContent="center" alignItems="center" spacing={2}>
              <JoyButton
                size={"sm" as const}
                variant={"outlined" as const}
                disabled={data.currentPage === 1}
                onClick={() => data.goToPage?.(Math.max(1, (data.currentPage ?? 1) - 1))}
              >
                Previous
              </JoyButton>
              <JoyTypography level={"body-sm" as const}>
                {`Page ${data.currentPage ?? 1} of ${data.totalPages}`}
              </JoyTypography>
              <JoyButton
                size={"sm" as const}
                variant={"outlined" as const}
                disabled={data.currentPage === data.totalPages}
                onClick={() =>
                  data.goToPage?.(Math.min(data.totalPages ?? 1, (data.currentPage ?? 1) + 1))}
              >
                Next
              </JoyButton>
            </JoyStack>
          : null}
        {/* Cursor-based load more */}
        {data.hasMore && data.loadMore
          ? <JoyStack alignItems="center">
              <JoyButton variant={"soft" as const} onClick={data.loadMore}>
                Load more
              </JoyButton>
            </JoyStack>
          : null}
      </JoyStack>
    </PageContainer>
  );
}

function CreateButton({ action, label }: { action: ClientDescriptor; label: string }) {
  const status = useActionStatus(action);
  return <ActionButton action={status} variant="solid" color="primary">{label}</ActionButton>;
}
