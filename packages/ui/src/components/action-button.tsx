import { useComponent } from "../plugin.js";
import type { ActionButtonProps } from "../types.js";

/**
 * Permission-aware button that submits a `@cfast/actions` action.
 *
 * Accepts an `ActionHookResult` from `useActions()` and renders a button
 * via the UI plugin's `button` slot. The button's visibility and disabled
 * state are controlled by the action's permission status. Extra props are
 * forwarded to the underlying button component.
 *
 * - `whenForbidden="hide"` -- hidden when not permitted
 * - `whenForbidden="disable"` -- shown but disabled when not permitted (default)
 * - `whenForbidden="show"` -- shown and clickable regardless of permission
 *
 * @param props - See {@link ActionButtonProps}.
 *
 * @example
 * ```tsx
 * <ActionButton
 *   action={publishPost}
 *   whenForbidden="disable"
 *   confirmation="Publish this post?"
 * >
 *   Publish
 * </ActionButton>
 * ```
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

  return (
    <Button
      {...buttonProps}
      onClick={() => action.submit()}
      disabled={disabled}
      loading={action.pending}
    >
      {children}
    </Button>
  );
}
