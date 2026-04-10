import { type ReactElement } from "react";
import { useFetcher } from "react-router";
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
  /**
   * When provided, renders a permission-gated Link instead of a form button.
   */
  href?: string;
  /**
   * When provided, submits a form with these values as hidden fields via
   * a fetcher. Eliminates manual `<Form>` + `<input type="hidden">`.
   */
  input?: Record<string, string | number | boolean | null | undefined>;
} & Omit<JoyButtonProps, "children" | "onClick" | "disabled" | "loading" | "action">;

/**
 * Joy UI styled ActionButton.
 *
 * Takes an `ActionHookResult` from `useActions()` or `useCfastLoader()`.
 * All Joy Button props (sx, fullWidth, etc.) are forwarded to the underlying
 * Button.
 *
 * When `href` is provided, renders as a Link (permission-gated).
 * When `input` is provided, submits form data via a fetcher.
 */
export function ActionButton({
  action,
  children,
  whenForbidden = "disable",
  confirmation: _confirmation,
  href,
  input,
  variant = "solid",
  color = "primary",
  size = "md",
  ...buttonProps
}: JoyActionButtonProps): ReactElement | null {
  const fetcher = useFetcher();

  if (action.invisible) {
    return null;
  }

  if (!action.permitted && whenForbidden === "hide") {
    return null;
  }

  const disabled = !action.permitted && whenForbidden === "disable";
  const pending = action.pending || fetcher.state !== "idle";

  // Navigation mode: render as a Link
  if (href) {
    if (disabled) {
      const disabledButton = (
        <JoyButton
          {...buttonProps}
          disabled
          variant={variant}
          color={color}
          size={size}
        >
          {children}
        </JoyButton>
      );

      if (action.reason) {
        return (
          <JoyTooltip title={action.reason}>
            <span>{disabledButton}</span>
          </JoyTooltip>
        );
      }

      return disabledButton;
    }

    return (
      <a href={href} style={{ textDecoration: "none" }}>
        <JoyButton
          {...buttonProps}
          variant={variant}
          color={color}
          size={size}
        >
          {children}
        </JoyButton>
      </a>
    );
  }

  // Form data mode: submit with input values via fetcher
  const handleClick = () => {
    if (input) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(input)) {
        if (value !== null && value !== undefined) {
          formData.set(key, String(value));
        }
      }
      fetcher.submit(formData, { method: "POST" });
    } else {
      action.submit();
    }
  };

  const button = (
    <JoyButton
      {...buttonProps}
      onClick={handleClick}
      disabled={disabled}
      loading={pending}
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
