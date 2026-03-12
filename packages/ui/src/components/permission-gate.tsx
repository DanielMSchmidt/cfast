import { createElement, Fragment } from "react";
import type { PermissionGateProps } from "../types.js";

/**
 * Conditionally renders children based on action permission status.
 *
 * Takes an `ActionHookResult` from `useActions()`.
 *
 * - When permitted: renders children
 * - When forbidden (not permitted, not invisible): renders fallback
 * - When invisible: renders nothing
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
    return fallback ? createElement(Fragment, null, fallback) : null;
  }

  return createElement(Fragment, null, children);
}
