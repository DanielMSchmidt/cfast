import { useEffect, useRef } from "react";
import { useActions } from "@cfast/actions/client";
import type { ClientDescriptor } from "@cfast/actions/client";
import { useToast } from "./use-toast.js";

/**
 * Maps action names to their success/error toast messages.
 *
 * Each key is an action name from a {@link ClientDescriptor}, and the value
 * specifies the toast messages to show when that action succeeds or fails.
 */
type ActionToastConfig = Record<
  string,
  { success?: string; error?: string }
>;

/**
 * Automatically shows toast notifications when `@cfast/actions` results arrive.
 *
 * Watches all configured actions via their {@link ClientDescriptor} and triggers
 * success or error toasts when their result data changes. Internally uses
 * {@link useToast} and `useActions` from `@cfast/actions/client`.
 *
 * Must be used within both a `ToastProvider` and an actions context
 * (i.e., inside `app.Provider`).
 *
 * @param descriptor - Client-side action descriptor from `@cfast/actions`, typically
 *   `composed.client` from a `createActions()` call.
 * @param config - Map of action names to toast messages. Only actions listed here
 *   are watched; others are ignored.
 * @returns void
 *
 * @example
 * ```ts
 * // In a route component:
 * useActionToast(composed.client, {
 *   deletePost: { success: "Post deleted", error: "Failed to delete" },
 *   publishPost: { success: "Post published" },
 * });
 * ```
 */
export function useActionToast(
  descriptor: ClientDescriptor,
  config: ActionToastConfig,
): void {
  const actions = useActions(descriptor);
  const toast = useToast();
  const prevDataRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    for (const [name, cfg] of Object.entries(config)) {
      const actionFn = actions[name];
      if (!actionFn) continue;

      const result = actionFn();
      const prevData = prevDataRef.current[name];

      // Only toast when data changes (new result)
      if (result.data !== undefined && result.data !== prevData) {
        prevDataRef.current[name] = result.data;
        if (cfg.success) {
          toast.success(cfg.success);
        }
      }

      if (result.error !== undefined && result.error !== prevData) {
        prevDataRef.current[name] = result.error;
        if (cfg.error) {
          toast.error(cfg.error);
        }
      }
    }
  });
}
