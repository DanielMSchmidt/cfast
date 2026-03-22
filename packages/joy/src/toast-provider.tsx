import { useCallback, type ReactElement } from "react";
import type { ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { ToastContext } from "@cfast/ui";
import type { ToastOptions } from "@cfast/ui";

/**
 * Joy UI ToastProvider backed by Sonner.
 */
export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const show = useCallback((options: ToastOptions) => {
    const method = options.type ?? "info";
    switch (method) {
      case "success":
        toast.success(options.message, { description: options.description, duration: options.duration });
        break;
      case "error":
        toast.error(options.message, { description: options.description, duration: options.duration });
        break;
      case "warning":
        toast.warning(options.message, { description: options.description, duration: options.duration });
        break;
      default:
        toast.info(options.message, { description: options.description, duration: options.duration });
        break;
    }
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toaster richColors position="bottom-right" />
    </ToastContext.Provider>
  );
}
