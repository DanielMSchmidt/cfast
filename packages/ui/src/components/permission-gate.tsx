import type { PermissionGateProps } from "../types.js";

/**
 * Conditionally renders children based on action permission status.
 *
 * Accepts an `ActionHookResult` from `useActions()` and controls rendering
 * based on the user's permission level:
 *
 * - **Permitted**: renders `children`
 * - **Forbidden** (not permitted, not invisible): renders `fallback` if provided, otherwise nothing
 * - **Invisible**: renders nothing (the resource does not exist for this user)
 *
 * @param props - See {@link PermissionGateProps}.
 *
 * @example
 * ```tsx
 * <PermissionGate action={editPost} fallback={<ReadOnlyBanner />}>
 *   <EditToolbar />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  action,
  children,
  fallback,
}: PermissionGateProps) {
  if (action.invisible) {
    return null;
  }

  if (!action.permitted) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
