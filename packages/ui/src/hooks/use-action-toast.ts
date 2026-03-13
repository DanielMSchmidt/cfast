import { useEffect, useRef } from "react";
import { useActions } from "@cfast/actions/client";
import type { ClientDescriptor } from "@cfast/actions/client";
import { useToast } from "./use-toast.js";

/** Maps action names to their success/error toast messages. */
type ActionToastConfig = Record<
  string,
  { success?: string; error?: string }
>;

/**
 * Automatically shows toast notifications when action results arrive.
 *
 * Watches all configured actions and triggers success or error toasts when
 * their data changes. Must be used within both a `ToastProvider` and an
 * actions context.
 *
 * @param descriptor - Client-side action descriptor from `@cfast/actions`
 * @param config - Map of action names to toast messages
 *
 * @example
 * ```ts
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
