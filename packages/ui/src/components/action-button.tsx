import { createElement } from "react";
import { useComponent } from "../plugin.js";
import type { ActionButtonProps } from "../types.js";

/**
 * Permission-aware button that submits an action.
 *
 * Takes an `ActionHookResult` from `useActions()` — no hooks inside,
 * pure presentation component. Extra props are forwarded to the
 * underlying button slot.
 *
 * - whenForbidden="hide": hidden when not permitted
 * - whenForbidden="disable": shown but disabled when not permitted
 * - whenForbidden="show": shown and clickable regardless of permission
 */
export function ActionButton({
  action,
  children,
  whenForbidden = "disable",
  confirmation: _confirmation,
  ...buttonProps
}: ActionButtonProps) {
  const Button = useComponent("button");

  if (action.invisible) {
    return null;
  }

  if (!action.permitted && whenForbidden === "hide") {
    return null;
  }

  const disabled = !action.permitted && whenForbidden === "disable";

  return createElement(Button, {
    ...buttonProps,
    children,
    onClick: () => action.submit(),
    disabled,
    loading: action.pending,
  });
}
