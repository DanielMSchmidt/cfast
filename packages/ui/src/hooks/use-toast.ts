import { createContext, useContext, useCallback } from "react";
import type { ToastApi, ToastOptions } from "../types.js";

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Returns an imperative toast API.
 *
 * Must be used within a `ToastProvider`.
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
