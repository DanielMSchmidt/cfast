import { useFetcher } from "react-router";
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
 * When `href` is provided, renders a permission-gated `<a>` link instead of
 * a form-submitting button. The link is only rendered when the action is
 * permitted (respects `whenForbidden`).
 *
 * When `input` is provided, submits a form with those values as hidden
 * fields via a fetcher, eliminating manual `<Form>` + `<input type="hidden">`.
 * This works with both `useActions()` results (where `action.submit()` is
 * already wired) and `useCfastLoader()` results (where `action.submit()`
 * is a no-op and the fetcher handles submission).
 *
 * @param props - See {@link ActionButtonProps}.
 *
 * @example Basic form submission
 * ```tsx
 * <ActionButton action={publishPost} confirmation="Publish this post?">
 *   Publish
 * </ActionButton>
 * ```
 *
 * @example Navigation link (permission-gated)
 * ```tsx
 * <ActionButton action={documents.canAdd()} href="/documents/new">
 *   New Document
 * </ActionButton>
 * ```
 *
 * @example Form data via input prop
 * ```tsx
 * <ActionButton
 *   action={recipe.canDelete()}
 *   input={{ _action: "deleteRecipe", id: recipe.id }}
 * >
 *   Delete
 * </ActionButton>
 * ```
 */
export function ActionButton({
  action,
  children,
  whenForbidden = "disable",
  confirmation: _confirmation,
  href,
  input,
  ...buttonProps
}: ActionButtonProps) {
  const Button = useComponent("button");
  const fetcher = useFetcher();

  if (action.invisible) {
    return null;
  }

  if (!action.permitted && whenForbidden === "hide") {
    return null;
  }

  const disabled = !action.permitted && whenForbidden === "disable";
  const pending = action.pending || fetcher.state !== "idle";

  // Navigation mode: render as a link
  if (href) {
    if (disabled) {
      return (
        <Button {...buttonProps} disabled loading={false}>
          {children}
        </Button>
      );
    }

    return (
      <a href={href} style={{ textDecoration: "none" }}>
        <Button {...buttonProps} disabled={false} loading={false}>
          {children}
        </Button>
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

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      disabled={disabled}
      loading={pending}
    >
      {children}
    </Button>
  );
}
