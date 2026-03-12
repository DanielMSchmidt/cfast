import { type ReactElement } from "react";
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
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6, px: 2 }}>
        {Icon ? <Icon className="empty-state-icon" /> : null}
        <Typography level="h3">{title}</Typography>
        {description ? <Typography level="body-md" color="neutral">{description}</Typography> : null}
      </Stack>
    );
  }

  return (
    <EmptyStateWithAction
      title={title}
      description={description}
      createAction={createAction}
      createLabel={createLabel}
      icon={Icon}
    />
  );
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
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6, px: 2 }}>
        <Typography level="h3">Nothing here yet</Typography>
      </Stack>
    );
  }

  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 6, px: 2 }}>
      {Icon ? <Icon className="empty-state-icon" /> : null}
      <Typography level="h3">{title}</Typography>
      {description ? <Typography level="body-md" color="neutral">{description}</Typography> : null}
      {status.permitted
        ? (
            <Button onClick={() => status.submit()} loading={status.pending}>
              {createLabel}
            </Button>
          )
        : null}
    </Stack>
  );
}
