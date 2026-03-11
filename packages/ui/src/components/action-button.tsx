import { createElement } from "react";
import { useActionStatus } from "../hooks/use-action-status.js";
import { useComponent } from "../plugin.js";
import type { ActionButtonProps } from "../types.js";

/**
 * Permission-aware button that submits an action.
 *
 * - whenForbidden="hide": hidden when not permitted
 * - whenForbidden="disable": shown but disabled when not permitted
 * - whenForbidden="show": shown and clickable regardless of permission
 *
 * Supports a `confirmation` prop that, when set, will be used by
 * the confirm system (wired in the Feedback PR).
 */
export function ActionButton({
  action,
  actionName,
  input,
  children,
  whenForbidden = "disable",
  confirmation: _confirmation,
  variant,
  color,
  size,
  startDecorator,
}: ActionButtonProps) {
  const status = useActionStatus(action, actionName, input);
  const Button = useComponent("button");

  // Handle visibility
  if (status.invisible) {
    return null;
  }

  if (!status.permitted && whenForbidden === "hide") {
    return null;
  }

  const disabled = !status.permitted && whenForbidden === "disable";

  return createElement(Button, {
    children,
    onClick: () => status.submit(),
    disabled,
    loading: status.pending,
    variant,
    color,
    size,
    startDecorator,
  });
}
