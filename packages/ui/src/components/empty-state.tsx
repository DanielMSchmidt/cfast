import { createElement } from "react";
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
    return createElement(
      "div",
      { style: { textAlign: "center" as const, padding: "48px 16px" } },
      Icon ? createElement(Icon, { className: "empty-state-icon" }) : null,
      createElement("h3", { style: { margin: "16px 0 8px" } }, title),
      description ? createElement("p", { style: { color: "#666" } }, description) : null,
    );
  }

  return createElement(EmptyStateWithAction, {
    title,
    description,
    createAction,
    createLabel,
    icon: Icon,
    Button,
  });
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
    return createElement(
      "div",
      { style: { textAlign: "center" as const, padding: "48px 16px" } },
      createElement("h3", { style: { margin: "16px 0 8px" } }, "Nothing here yet"),
    );
  }

  return createElement(
    "div",
    { style: { textAlign: "center" as const, padding: "48px 16px" } },
    Icon ? createElement(Icon, { className: "empty-state-icon" }) : null,
    createElement("h3", { style: { margin: "16px 0 8px" } }, title),
    description ? createElement("p", { style: { color: "#666" } }, description) : null,
    status.permitted
      ? createElement(
          "div",
          { style: { marginTop: "16px" } },
          createElement(Button, {
            children: createLabel,
            onClick: () => status.submit(),
            loading: status.pending,
          }),
        )
      : null,
  );
}
