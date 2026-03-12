import type { ComponentType, ReactNode } from "react";
import type { AuthUser } from "../types";

export type AuthProviderProps = {
  user: AuthUser | null;
  loginPath?: string;
  children: ReactNode;
};

export type LoginComponents = {
  Layout?: ComponentType<{ children: ReactNode }>;
  EmailInput?: ComponentType<{
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }>;
  PasskeyButton?: ComponentType<{
    onClick: () => void;
    loading: boolean;
  }>;
  MagicLinkButton?: ComponentType<{
    onClick: () => void;
    loading: boolean;
  }>;
  SuccessMessage?: ComponentType<{ email: string }>;
  ErrorMessage?: ComponentType<{ error: string }>;
};

export type LoginPageProps = {
  authClient: {
    signIn: {
      magicLink: (opts: {
        email: string;
      }) => Promise<{ error?: { message?: string } | null }>;
      passkey: () => Promise<
        { error?: { message?: string } | null } | undefined
      >;
    };
  };
  components?: LoginComponents;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
};
