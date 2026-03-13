import { useComponent } from "../plugin.js";
import type { BulkAction } from "../types.js";

type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (action: BulkAction) => void;
  onClearSelection: () => void;
};

/**
 * Toolbar that appears when rows are selected in a {@link DataTable}.
 *
 * Displays the selected row count, action buttons for each {@link BulkAction},
 * and a "Clear" button to deselect all rows. Actions are rendered via the UI
 * plugin's `button` slot. Hidden automatically when `selectedCount` is zero.
 *
 * @param props - See {@link BulkActionBarProps}.
 *
 * @example
 * ```tsx
 * <BulkActionBar
 *   selectedCount={selectedRows.length}
 *   actions={[
 *     { label: "Delete", icon: TrashIcon },
 *     { label: "Publish" },
 *   ]}
 *   onAction={(action) => handleBulk(action, selectedRows)}
 *   onClearSelection={() => clearSelection()}
 * />
 * ```
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onAction,
  onClearSelection,
}: BulkActionBarProps) {
  const Button = useComponent("button");

  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        backgroundColor: "#f0f4ff",
        borderRadius: "4px",
        marginBottom: "8px",
      }}
    >
      <span>{`${selectedCount} selected`}</span>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            onClick={() => onAction(action)}
            variant={"soft" as const}
            size={"sm" as const}
            startDecorator={Icon
              ? <Icon className="bulk-action-icon" />
              : undefined}
          >
            {action.label}
          </Button>
        );
      })}
      <Button
        onClick={onClearSelection}
        variant={"plain" as const}
        size={"sm" as const}
      >
        Clear
      </Button>
    </div>
  );
}

export type { BulkActionBarProps };
