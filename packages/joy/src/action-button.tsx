import { type ReactElement } from "react";
import JoyButton from "@mui/joy/Button";
import type { ButtonProps as JoyButtonProps } from "@mui/joy/Button";
import JoyTooltip from "@mui/joy/Tooltip";
import type { ActionHookResult } from "@cfast/actions/client";
import type { WhenForbidden, ConfirmOptions } from "@cfast/ui";
import type { ReactNode } from "react";

type JoyActionButtonProps = {
  action: ActionHookResult;
  children: ReactNode;
  whenForbidden?: WhenForbidden;
  confirmation?: string | ConfirmOptions;
} & Omit<JoyButtonProps, "children" | "onClick" | "disabled" | "loading" | "action">;

/**
 * Joy UI styled ActionButton.
 *
 * Takes an `ActionHookResult` from `useActions()` — no hooks inside,
 * pure presentation component. All Joy Button props (sx, fullWidth, etc.)
 * are forwarded to the underlying Button.
 */
export function ActionButton({
  action,
  children,
  whenForbidden = "disable",
  confirmation: _confirmation,
  variant = "solid",
  color = "primary",
  size = "md",
  ...buttonProps
}: JoyActionButtonProps): ReactElement | null {
  if (action.invisible) {
    return null;
  }

  if (!action.permitted && whenForbidden === "hide") {
    return null;
  }

  const disabled = !action.permitted && whenForbidden === "disable";

  const button = (
    <JoyButton
      {...buttonProps}
      onClick={() => action.submit()}
      disabled={disabled}
      loading={action.pending}
      variant={variant}
      color={color}
      size={size}
    >
      {children}
    </JoyButton>
  );

  // Wrap in tooltip if disabled with a reason
  if (disabled && action.reason) {
    const wrapper = <span>{button}</span>;
    return (
      <JoyTooltip title={action.reason}>
        {wrapper}
      </JoyTooltip>
    );
  }

  return button;
}
