import { createContext, useContext } from "react";
import type {
  AuthClientInstance,
  AuthClientProviderProps,
  UseAuthReturn,
} from "./types";

const AuthClientContext = createContext<AuthClientInstance | null>(null);

export function AuthClientProvider({
  authClient,
  children,
}: AuthClientProviderProps) {
  return (
    <AuthClientContext.Provider value={authClient}>
      {children}
    </AuthClientContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const authClient = useContext(AuthClientContext);
  if (authClient === null) {
    throw new Error("useAuth must be used within an <AuthClientProvider>");
  }

  return {
    signOut: async () => {
      await authClient.signOut();
    },
    registerPasskey: async () => {
      if (!authClient.passkey) {
        throw new Error("Passkey plugin not configured on auth client");
      }
      return authClient.passkey.addPasskey();
    },
    deletePasskey: async (id: string) => {
      if (!authClient.passkey) {
        throw new Error("Passkey plugin not configured on auth client");
      }
      return authClient.passkey.deletePasskey({ id });
    },
    stopImpersonating: async () => {
      if (!authClient.admin) {
        throw new Error("Admin plugin not configured on auth client");
      }
      await authClient.admin.stopImpersonating();
    },
    authClient,
  };
}
