import { createElement, type ReactElement } from "react";
import JoySheet from "@mui/joy/Sheet";
import JoyStack from "@mui/joy/Stack";
import JoyButton from "@mui/joy/Button";
import JoyTypography from "@mui/joy/Typography";
import type { BulkAction } from "../types.js";

type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (action: BulkAction) => void;
  onClearSelection: () => void;
};

/**
 * Joy UI styled BulkActionBar.
 * Shown when rows are selected in a DataTable.
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onAction,
  onClearSelection,
}: BulkActionBarProps): ReactElement | null {
  if (selectedCount === 0) return null;

  return createElement(
    JoySheet,
    {
      variant: "soft" as const,
      color: "primary" as const,
      sx: {
        p: 1,
        px: 2,
        borderRadius: "sm",
        mb: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
      },
    },
    createElement(
      JoyTypography,
      { level: "body-sm" as const, fontWeight: "lg" as const },
      `${selectedCount} selected`,
    ),
    createElement(
      JoyStack,
      { direction: "row" as const, spacing: 1, sx: { ml: "auto" } },
      ...actions.map((action) =>
        createElement(JoyButton, {
          key: action.label,
          size: "sm" as const,
          variant: "soft" as const,
          onClick: () => onAction(action),
          startDecorator: action.icon
            ? createElement(action.icon, { className: "bulk-action-icon" })
            : undefined,
          children: action.label,
        }),
      ),
      createElement(JoyButton, {
        size: "sm" as const,
        variant: "plain" as const,
        color: "neutral" as const,
        onClick: onClearSelection,
        children: "Clear selection",
      }),
    ),
  );
}
