import { createContext, useContext, useCallback } from "react";
import type { ConfirmOptions } from "../types.js";

/**
 * Function signature for the imperative confirmation dialog.
 *
 * Call with {@link ConfirmOptions} to show a dialog. Resolves to `true` if
 * the user confirms, or `false` if they cancel or dismiss.
 */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type ConfirmContextValue = {
  confirm: ConfirmFn;
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Returns an imperative {@link ConfirmFn} that opens a confirmation dialog
 * and resolves to `true` (confirmed) or `false` (cancelled/dismissed).
 *
 * Must be used within a `ConfirmProvider` -- typically supplied by the
 * Joy UI plugin or a custom UI plugin implementation.
 *
 * @returns A {@link ConfirmFn} that accepts {@link ConfirmOptions} and returns a `Promise<boolean>`.
 * @throws {Error} If called outside of a `ConfirmProvider`.
 *
 * @example
 * ```ts
 * function DangerZone() {
 *   const confirm = useConfirm();
 *
 *   async function handleDelete() {
 *     const ok = await confirm({
 *       title: "Delete account",
 *       description: "This action cannot be undone.",
 *       confirmLabel: "Delete",
 *       variant: "danger",
 *     });
 *     if (ok) { /* proceed *\/ }
 *   }
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
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
