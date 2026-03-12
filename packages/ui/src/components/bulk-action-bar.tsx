import { createElement } from "react";
import { useComponent } from "../plugin.js";
import type { BulkAction } from "../types.js";

type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (action: BulkAction) => void;
  onClearSelection: () => void;
};

/**
 * Headless BulkActionBar — shown when rows are selected.
 * Displays count + action buttons + clear selection.
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onAction,
  onClearSelection,
}: BulkActionBarProps) {
  const Button = useComponent("button");

  if (selectedCount === 0) return null;

  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        backgroundColor: "#f0f4ff",
        borderRadius: "4px",
        marginBottom: "8px",
      },
    },
    createElement(
      "span",
      null,
      `${selectedCount} selected`,
    ),
    ...actions.map((action) =>
      createElement(Button, {
        key: action.label,
        children: action.label,
        onClick: () => onAction(action),
        variant: "soft" as const,
        size: "sm" as const,
        startDecorator: action.icon
          ? createElement(action.icon, { className: "bulk-action-icon" })
          : undefined,
      }),
    ),
    createElement(Button, {
      children: "Clear",
      onClick: onClearSelection,
      variant: "plain" as const,
      size: "sm" as const,
    }),
  );
}

export type { BulkActionBarProps };
