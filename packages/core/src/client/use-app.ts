import { useContext } from "react";
import { CoreContext } from "./provider";

/**
 * Accesses all plugins' client-side exports from the nearest `app.Provider`.
 *
 * The returned object is keyed by plugin name, containing each plugin's `client` values.
 * Throws if called outside of `<app.Provider>`.
 *
 * @typeParam T - The expected shape of the client context (defaults to `Record<string, unknown>`).
 * @returns The merged client-side plugin values.
 *
 * @example
 * ```tsx
 * import { useApp } from '@cfast/core/client';
 *
 * function MyComponent() {
 *   const { auth, storage } = useApp();
 *   const user = auth.useCurrentUser();
 * }
 * ```
 */
export function useApp<T = Record<string, unknown>>(): T {
  const ctx = useContext(CoreContext);
  if (ctx === null) {
    throw new Error(
      "@cfast/core: useApp() must be used inside <app.Provider>. " +
        "Wrap your app with the Provider from createApp().",
    );
  }
  // Type boundary: CoreContext stores Record<string, unknown> because React's
  // createContext cannot carry the full generic plugin type from createApp().
  // The caller narrows T to their app's actual client context type, which is
  // guaranteed to match at runtime because createCoreProvider populates the
  // context value from the registered plugins' client exports.
  return ctx as T;
}
