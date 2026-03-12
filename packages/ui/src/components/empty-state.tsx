import { useActionStatus } from "../hooks/use-action-status.js";
import { useComponent } from "../plugin.js";
import type { EmptyStateProps } from "../types.js";

/**
 * Permission-aware empty state.
 *
 * - If createAction is permitted: shows title + description + CTA button
 * - If createAction is forbidden: shows title + description only
 * - If createAction is invisible: shows generic message
 * - If no createAction: shows title + description
 */
export function EmptyState({
  title,
  description,
  createAction,
  createLabel = "Create",
  icon: Icon,
}: EmptyStateProps) {
  const Button = useComponent("button");

  // If no create action, just show the message
  if (!createAction) {
    return (
      <div style={{ textAlign: "center" as const, padding: "48px 16px" }}>
        {Icon ? <Icon className="empty-state-icon" /> : null}
        <h3 style={{ margin: "16px 0 8px" }}>{title}</h3>
        {description ? <p style={{ color: "#666" }}>{description}</p> : null}
      </div>
    );
  }

  return (
    <EmptyStateWithAction
      title={title}
      description={description}
      createAction={createAction}
      createLabel={createLabel}
      icon={Icon}
      Button={Button}
    />
  );
}

function EmptyStateWithAction({
  title,
  description,
  createAction,
  createLabel,
  icon: Icon,
  Button,
}: EmptyStateProps & { Button: ReturnType<typeof useComponent<"button">> }) {
  const status = useActionStatus(createAction!);

  // If invisible, show generic message
  if (status.invisible) {
    return (
      <div style={{ textAlign: "center" as const, padding: "48px 16px" }}>
        <h3 style={{ margin: "16px 0 8px" }}>Nothing here yet</h3>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" as const, padding: "48px 16px" }}>
      {Icon ? <Icon className="empty-state-icon" /> : null}
      <h3 style={{ margin: "16px 0 8px" }}>{title}</h3>
      {description ? <p style={{ color: "#666" }}>{description}</p> : null}
      {status.permitted
        ? (
            <div style={{ marginTop: "16px" }}>
              <Button onClick={() => status.submit()} loading={status.pending}>
                {createLabel}
              </Button>
            </div>
          )
        : null}
    </div>
  );
}
