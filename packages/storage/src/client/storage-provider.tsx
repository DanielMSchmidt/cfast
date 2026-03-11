import { createContext, useContext, type ReactNode } from "react";
import type { ClientStorageConfig } from "../types.js";

const StorageContext = createContext<ClientStorageConfig | null>(null);

export function StorageProvider({
  config,
  children,
}: {
  config: ClientStorageConfig;
  children?: ReactNode;
}) {
  return <StorageContext.Provider value={config}>{children}</StorageContext.Provider>;
}

export function useStorageConfig(): ClientStorageConfig {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useUpload must be used within a <StorageProvider>");
  }
  return ctx;
}
