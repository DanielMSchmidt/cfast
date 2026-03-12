import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import type { AuthUser } from "../types";

export type AuthGuardProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AuthGuard({ user, children }: AuthGuardProps) {
  return <AuthProvider user={user}>{children}</AuthProvider>;
}
