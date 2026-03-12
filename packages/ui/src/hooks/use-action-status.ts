import { useActions } from "@cfast/actions/client";
import type { ClientDescriptor } from "@cfast/actions";
import type { ActionHookResult } from "@cfast/actions/client";

/**
 * Returns the status of the first action in a descriptor.
 *
 * Convenience wrapper around `useActions()` for single-action descriptors
 * (e.g. a create action passed to EmptyState).
 */
export function useActionStatus(descriptor: ClientDescriptor): ActionHookResult {
  const actions = useActions(descriptor);
  const name = descriptor.actionNames[0];
  return actions[name]();
}
