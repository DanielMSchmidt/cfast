import { createElement, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { ConfirmContext } from "../hooks/use-confirm.js";
import { useComponent } from "../plugin.js";
import type { ConfirmOptions } from "../types.js";

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

/**
 * Provides the `useConfirm()` context and renders the confirm dialog.
 * Uses the plugin's `confirmDialog` slot for rendering.
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

  return createElement(
    ConfirmContext.Provider,
    { value: { confirm } },
    children,
    state
      ? createElement(ConfirmDialog, {
          open: true,
          onClose: handleClose,
          onConfirm: handleConfirm,
          title: state.title,
          description: state.description,
          confirmLabel: state.confirmLabel,
          cancelLabel: state.cancelLabel,
          variant: state.variant,
        })
      : null,
  );
}
