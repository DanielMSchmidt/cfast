import { createElement, type ReactElement } from "react";
import JoyButton from "@mui/joy/Button";
import JoyTooltip from "@mui/joy/Tooltip";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { ActionButtonProps } from "../types.js";

/**
 * Joy UI styled ActionButton.
 * Uses MUI Joy Button with tooltip for disabled state reason.
 */
export function ActionButton({
  action,
  actionName,
  input,
  children,
  whenForbidden = "disable",
  confirmation: _confirmation,
  variant = "solid",
  color = "primary",
  size = "md",
  startDecorator,
}: ActionButtonProps): ReactElement | null {
  const status = useActionStatus(action, actionName, input);

  if (status.invisible) {
    return null;
  }

  if (!status.permitted && whenForbidden === "hide") {
    return null;
  }

  const disabled = !status.permitted && whenForbidden === "disable";

  const button = createElement(JoyButton, {
    onClick: () => status.submit(),
    disabled,
    loading: status.pending,
    variant,
    color,
    size,
    startDecorator,
    children,
  });

  // Wrap in tooltip if disabled with a reason
  if (disabled && status.reason) {
    const wrapper = createElement("span", null, button);
    return createElement(JoyTooltip, {
      title: status.reason,
      children: wrapper,
    });
  }

  return button;
}
