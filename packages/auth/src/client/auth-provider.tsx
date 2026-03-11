import { createContext, useContext } from "react";
import type { AuthUser } from "../types";
import type { AuthProviderProps } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  loginPath: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  user,
  loginPath = "/login",
  children,
}: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user, loginPath }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Access the current user from the nearest AuthProvider.
 * Returns `AuthUser | null` — null when not authenticated.
 *
 * Must be used within an `<AuthProvider>`.
 */
export function useCurrentUser(): AuthUser | null {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useCurrentUser must be used within an <AuthProvider>");
  }
  return ctx.user;
}

/**
 * Access the login path configured in the nearest AuthProvider.
 */
export function useLoginPath(): string {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useLoginPath must be used within an <AuthProvider>");
  }
  return ctx.loginPath;
}
