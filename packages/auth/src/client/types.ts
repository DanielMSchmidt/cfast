import type { ComponentType, ReactNode } from "react";
import type { AuthUser } from "../types";

export type AuthProviderProps = {
  user: AuthUser | null;
  loginPath?: string;
  children: ReactNode;
};

export type AuthClientInstance = {
  signOut: () => Promise<unknown>;
  passkey?: {
    addPasskey: () => Promise<
      { error?: { message?: string } | null } | undefined
    >;
    deletePasskey: (opts: {
      id: string;
    }) => Promise<{ error?: { message?: string } | null } | undefined>;
  };
  admin?: {
    stopImpersonating: () => Promise<unknown>;
  };
};

export type AuthClientProviderProps = {
  authClient: AuthClientInstance;
  children: ReactNode;
};

export type UseAuthReturn = {
  signOut: () => Promise<void>;
  registerPasskey: () => Promise<
    { error?: { message?: string } | null } | undefined
  >;
  deletePasskey: (
    id: string,
  ) => Promise<{ error?: { message?: string } | null } | undefined>;
  stopImpersonating: () => Promise<void>;
  authClient: AuthClientInstance;
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
  PasskeySignUpButton?: ComponentType<{
    onClick: () => void;
    loading: boolean;
  }>;
};

export type LoginPageProps = {
  /** Pass `undefined` during SSR (e.g. from a `.client.ts` module). The
   *  component renders a static shell and hydrates with full interactivity. */
  authClient?: {
    signIn: {
      magicLink: (opts: {
        email: string;
      }) => Promise<{ error?: { message?: string } | null }>;
      passkey?: () => Promise<
        { error?: { message?: string } | null } | undefined
      >;
    };
    signUp?: {
      email: (opts: {
        email: string;
        password: string;
        name: string;
      }) => Promise<{ error?: { message?: string } | null }>;
    };
    passkey?: {
      addPasskey: () => Promise<
        { error?: { message?: string } | null } | undefined
      >;
    };
  };
  components?: LoginComponents;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
};
