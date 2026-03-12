import { useContext } from "react";
import { CoreContext } from "./provider";

export function useApp<T = Record<string, unknown>>(): T {
  const ctx = useContext(CoreContext);
  if (ctx === null) {
    throw new Error(
      "@cfast/core: useApp() must be used inside <app.Provider>. " +
        "Wrap your app with the Provider from createApp().",
    );
  }
  return ctx as T;
}
