import { createContext, useContext, useCallback } from "react";
import type { ConfirmOptions } from "../types.js";

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type ConfirmContextValue = {
  confirm: ConfirmFn;
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Returns an imperative `confirm(options)` function that resolves to
 * `true` (confirmed) or `false` (cancelled).
 *
 * Must be used within a `ConfirmProvider`.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>");
  }
  return useCallback(
    (options: ConfirmOptions) => ctx.confirm(options),
    [ctx],
  );
}
