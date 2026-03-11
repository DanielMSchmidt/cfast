import { createElement, type ReactElement } from "react";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { EmptyStateProps } from "../types.js";

/**
 * Joy UI EmptyState — centered layout with optional CTA.
 */
export function EmptyState({
  title,
  description,
  createAction,
  createLabel = "Create",
  icon: Icon,
}: EmptyStateProps): ReactElement {
  if (!createAction) {
    return createElement(
      Stack,
      { alignItems: "center", spacing: 2, sx: { py: 6, px: 2 } },
      Icon ? createElement(Icon, { className: "empty-state-icon" }) : null,
      createElement(Typography, { level: "h3", children: title }),
      description ? createElement(Typography, { level: "body-md", color: "neutral", children: description }) : null,
    );
  }

  return createElement(EmptyStateWithAction, {
    title,
    description,
    createAction,
    createLabel,
    icon: Icon,
  });
}

function EmptyStateWithAction({
  title,
  description,
  createAction,
  createLabel,
  icon: Icon,
}: EmptyStateProps): ReactElement {
  const status = useActionStatus(createAction!);

  if (status.invisible) {
    return createElement(
      Stack,
      { alignItems: "center", spacing: 2, sx: { py: 6, px: 2 } },
      createElement(Typography, { level: "h3", children: "Nothing here yet" }),
    );
  }

  return createElement(
    Stack,
    { alignItems: "center", spacing: 2, sx: { py: 6, px: 2 } },
    Icon ? createElement(Icon, { className: "empty-state-icon" }) : null,
    createElement(Typography, { level: "h3", children: title }),
    description ? createElement(Typography, { level: "body-md", color: "neutral", children: description }) : null,
    status.permitted
      ? createElement(Button, {
          onClick: () => status.submit(),
          loading: status.pending,
          children: createLabel,
        })
      : null,
  );
}
