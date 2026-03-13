import { createContext, useContext, useCallback } from "react";
import type { ToastApi, ToastOptions } from "../types.js";

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Returns an imperative {@link ToastApi} for showing toast notifications.
 *
 * Provides convenience methods (`success`, `error`, `info`, `warning`) as well
 * as a generic `show` method that accepts full {@link ToastOptions}.
 *
 * Must be used within a `ToastProvider` -- typically supplied by the Joy UI
 * plugin (backed by Sonner) or a custom UI plugin implementation.
 *
 * @returns A {@link ToastApi} object with methods for each notification type.
 * @throws {Error} If called outside of a `ToastProvider`.
 *
 * @example
 * ```ts
 * function PublishButton() {
 *   const toast = useToast();
 *
 *   async function handlePublish() {
 *     try {
 *       await publishPost();
 *       toast.success("Post published");
 *     } catch (err) {
 *       toast.error("Failed to publish post");
 *     }
 *   }
 *
 *   return <button onClick={handlePublish}>Publish</button>;
 * }
 * ```
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }

  const show = useCallback(
    (options: ToastOptions) => ctx.show(options),
    [ctx],
  );

  const success = useCallback(
    (message: string, description?: string) =>
      ctx.show({ message, type: "success", description }),
    [ctx],
  );

  const error = useCallback(
    (message: string, description?: string) =>
      ctx.show({ message, type: "error", description }),
    [ctx],
  );

  const info = useCallback(
    (message: string, description?: string) =>
      ctx.show({ message, type: "info", description }),
    [ctx],
  );

  const warning = useCallback(
    (message: string, description?: string) =>
      ctx.show({ message, type: "warning", description }),
    [ctx],
  );

  return { show, success, error, info, warning };
}
