import { useActions } from "@cfast/actions/client";
import type { ActionHookResult } from "@cfast/actions/client";
import type { ClientDescriptor, Serializable } from "@cfast/actions";

export function useActionStatus<TDescriptor extends ClientDescriptor>(
  descriptor: TDescriptor,
  actionName: TDescriptor["actionNames"][number],
  input?: Serializable,
): ActionHookResult {
  const actions = useActions(descriptor);
  const actionFn = actions[actionName];
  if (!actionFn) {
    throw new Error(
      `Action "${actionName}" not found in descriptor. Available: ${descriptor.actionNames.join(", ")}`,
    );
  }
  return actionFn(input);
}
