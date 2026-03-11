import { useActions } from "@cfast/actions/client";
import type { ActionHookResult } from "@cfast/actions/client";
import type { ClientDescriptor, Serializable } from "./types.js";

export type ActionStatus = ActionHookResult;

export function useActionStatus(
  descriptor: ClientDescriptor,
  actionName: string,
  input?: Serializable,
): ActionStatus {
  const actions = useActions(descriptor);
  const actionFn = actions[actionName];
  if (!actionFn) {
    throw new Error(
      `Action "${actionName}" not found in descriptor. Available: ${descriptor.actionNames.join(", ")}`,
    );
  }
  return actionFn(input);
}
