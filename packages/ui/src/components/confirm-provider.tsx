import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { ConfirmContext } from "../hooks/use-confirm.js";
import { useComponent } from "../plugin.js";
import type { ConfirmOptions } from "../types.js";

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

/**
 * Provides the {@link useConfirm} context and renders the confirmation dialog.
 *
 * Wrap your application (or a subtree) with `ConfirmProvider` to enable the
 * imperative `useConfirm()` hook. The dialog is rendered using the UI plugin's
 * `confirmDialog` slot, so it matches your chosen component library.
 *
 * @param props.children - The React tree that can call `useConfirm()`.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * <ConfirmProvider>
 *   <App />
 * </ConfirmProvider>
 *
 * // In any descendant component:
 * const confirm = useConfirm();
 * const ok = await confirm({ title: "Delete?", variant: "danger" });
 * ```
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const ConfirmDialog = useComponent("confirmDialog");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(null);
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state
        ? (
            <ConfirmDialog
              open
              onClose={handleClose}
              onConfirm={handleConfirm}
              title={state.title}
              description={state.description}
              confirmLabel={state.confirmLabel}
              cancelLabel={state.cancelLabel}
              variant={state.variant}
            />
          )
        : null}
    </ConfirmContext.Provider>
  );
}
