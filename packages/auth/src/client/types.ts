import type { ReactNode } from "react";
import type { AuthUser } from "../types";

export type AuthProviderProps = {
  user: AuthUser | null;
  loginPath?: string;
  children: ReactNode;
};
