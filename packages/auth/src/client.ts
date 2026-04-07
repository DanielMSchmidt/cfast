export { AuthProvider, useCurrentUser, useLoginPath } from "./client/auth-provider";
export { AuthGuard } from "./client/auth-guard";
export { AuthClientProvider, useAuth } from "./client/auth-client-provider";
export { LoginPage } from "./client/login-page";
export {
  createAuthClient,
  magicLinkClient,
  passkeyClient,
} from "./client/create-auth-client";
export type {
  AuthClient,
  AuthClientErrorResult,
  AuthClientSession,
  AuthClientSessionHookResult,
} from "./client/create-auth-client";
export type {
  AuthProviderProps,
  AuthClientProviderProps,
  UseAuthReturn,
  AuthClientInstance,
  LoginComponents,
  LoginPageProps,
} from "./client/types";
export type { AuthGuardProps } from "./client/auth-guard";
