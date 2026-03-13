import { createContext, useContext, type ReactNode } from "react";
import type { ClientStorageConfig } from "../types.js";

const StorageContext = createContext<ClientStorageConfig | null>(null);

/**
 * React context provider that makes client-side storage configuration
 * available to the {@link useUpload} hook.
 *
 * @param props.config - Client-safe storage config from `storage.clientConfig()`.
 * @param props.children - Child components that may call `useUpload`.
 */
export function StorageProvider({
  config,
  children,
}: {
  config: ClientStorageConfig;
  children?: ReactNode;
}) {
  return <StorageContext.Provider value={config}>{children}</StorageContext.Provider>;
}

/**
 * Read the client-side storage configuration from the nearest `StorageProvider`.
 *
 * @returns The {@link ClientStorageConfig} for all uploadable file types.
 * @throws If called outside of a `StorageProvider`.
 */
export function useStorageConfig(): ClientStorageConfig {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useUpload must be used within a <StorageProvider>");
  }
  return ctx;
}
