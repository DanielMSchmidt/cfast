import { createElement, Fragment } from "react";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { PermissionGateProps } from "../types.js";

/**
 * Conditionally renders children based on action permission status.
 *
 * - When permitted: renders children
 * - When forbidden (not permitted, not invisible): renders fallback
 * - When invisible: renders nothing
 */
export function PermissionGate({
  action,
  actionName,
  input,
  children,
  fallback,
}: PermissionGateProps) {
  const status = useActionStatus(action, actionName, input);

  if (status.invisible) {
    return null;
  }

  if (!status.permitted) {
    return fallback ? createElement(Fragment, null, fallback) : null;
  }

  return createElement(Fragment, null, children);
}
