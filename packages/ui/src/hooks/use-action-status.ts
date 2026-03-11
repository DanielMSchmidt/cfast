import { useActions } from "@cfast/actions/client";
import type { ClientDescriptor, Serializable } from "@cfast/actions";
import type { ActionStatusResult } from "../types.js";

/**
 * Returns the permission status and submit function for a single action
 * from a composed action descriptor.
 *
 * If `actionName` is omitted, uses the first (or only) action in the descriptor.
 */
export function useActionStatus(
  descriptor: ClientDescriptor,
  actionName?: string,
  input?: Record<string, Serializable>,
): ActionStatusResult {
  const actions = useActions(descriptor);
  const name = actionName ?? descriptor.actionNames[0];
  const actionFn = actions[name];

  if (!actionFn) {
    return {
      permitted: false,
      invisible: true,
      reason: `Action "${name}" not found in descriptor`,
      submit: () => {},
      pending: false,
      data: undefined,
      error: undefined,
    };
  }

  const result = actionFn(input as Serializable | undefined);

  return {
    permitted: result.permitted,
    invisible: result.invisible,
    reason: result.reason,
    submit: result.submit,
    pending: result.pending,
    data: result.data,
    error: result.error,
  };
}
