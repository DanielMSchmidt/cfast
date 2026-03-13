import { useActions } from "@cfast/actions/client";
import type { ClientDescriptor, ActionHookResult } from "@cfast/actions/client";

/**
 * Returns the permission status and submit function for the first action in a descriptor.
 *
 * Convenience wrapper around `useActions()` for single-action descriptors
 * (e.g. a create action passed to EmptyState or a navigation item guard).
 *
 * @param descriptor - Client-side action descriptor from `@cfast/actions`
 * @returns The ActionHookResult with `permitted`, `invisible`, `pending`, and `submit`
 *
 * @example
 * ```ts
 * const status = useActionStatus(createPost.client);
 * if (status.permitted) {
 *   status.submit({ title: "New Post" });
 * }
 * ```
 */
export function useActionStatus(descriptor: ClientDescriptor): ActionHookResult {
  const actions = useActions(descriptor);
  const name = descriptor.actionNames[0];
  return actions[name]();
}
