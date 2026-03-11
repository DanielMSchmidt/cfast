import { useActionStatus } from "./use-action-status.js";
import type { PermissionGateProps } from "./types.js";

export function PermissionGate({
  action,
  actionName,
  input,
  fallback = null,
  children,
}: PermissionGateProps) {
  const status = useActionStatus(action, actionName, input);

  if (!status.permitted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
