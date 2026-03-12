import { useState, useCallback } from "react";
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
 * Composite ListView — composes PageContainer, FilterBar, DataTable,
 * EmptyState, BulkActionBar, and pagination controls.
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
}: ListViewProps<T>) {
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
      <div>
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
        {/* Pagination controls */}
        {data.totalPages && data.totalPages > 1 && data.goToPage
          ? <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <button
                disabled={data.currentPage === 1}
                onClick={() => data.goToPage?.(Math.max(1, (data.currentPage ?? 1) - 1))}
              >
                Previous
              </button>
              <span>
                {`Page ${data.currentPage ?? 1} of ${data.totalPages}`}
              </span>
              <button
                disabled={data.currentPage === data.totalPages}
                onClick={() =>
                  data.goToPage?.(
                    Math.min(data.totalPages ?? 1, (data.currentPage ?? 1) + 1),
                  )}
              >
                Next
              </button>
            </div>
          : null}
        {/* Load more (cursor-based) */}
        {data.hasMore && data.loadMore
          ? <div style={{ textAlign: "center" as const, marginTop: "16px" }}>
              <button onClick={data.loadMore}>
                Load more
              </button>
            </div>
          : null}
      </div>
    </PageContainer>
  );
}

function CreateButton({ action, label }: { action: ClientDescriptor; label: string }) {
  const status = useActionStatus(action);
  return <ActionButton action={status} variant="solid" color="primary">{label}</ActionButton>;
}
