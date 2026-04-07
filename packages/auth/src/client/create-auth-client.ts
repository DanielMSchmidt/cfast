/**
 * Re-exports Better Auth's React client factory, the magic link plugin,
 * and the passkey client plugin — with a portable {@link AuthClient} type
 * that does not leak internal `better-auth` import paths.
 *
 * Usage:
 * ```ts
 * import { createAuthClient, magicLinkClient, passkeyClient, type AuthClient } from "@cfast/auth/client";
 *
 * export const authClient: AuthClient = createAuthClient({
 *   plugins: [magicLinkClient(), passkeyClient()],
 * });
 * ```
 *
 * The explicit `AuthClient` annotation is important for consumers using
 * `composite: true` in their tsconfig with pnpm — without it, TypeScript
 * inlines a type that references `.pnpm/...` paths and emits `TS2742`
 * because it can't find a portable name for the inferred type.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAuthClient as betterAuthCreateClient } from "better-auth/react";

/**
 * Shape of a Better Auth error object returned from plugin methods.
 *
 * All Better Auth plugin methods resolve with an object that has an
 * optional `error` field. We model this explicitly so the public
 * {@link AuthClient} type doesn't reference `better-auth` internals.
 */
export type AuthClientErrorResult = {
  error?: { message?: string; code?: string } | null;
};

/**
 * The session data returned by `authClient.useSession()`.
 *
 * Intentionally loose (`user: unknown`) because the concrete user shape
 * depends on the Better Auth configuration used when creating the
 * client. Downstream apps typically narrow to their own `AuthUser` type
 * after reading the session from the auth provider.
 */
export type AuthClientSession = {
  user: unknown;
  session: unknown;
};

/**
 * Return value of `authClient.useSession()`.
 */
export type AuthClientSessionHookResult = {
  data: AuthClientSession | null;
  isPending: boolean;
  error?: unknown;
};

/**
 * The portable public surface of a Better Auth client created via
 * {@link createAuthClient}.
 *
 * This type is intentionally independent of Better Auth's internal file
 * layout so that downstream apps using `composite: true` + pnpm don't
 * hit `TS2742: The inferred type of X cannot be named without a reference
 * to [...].pnpm/better-auth@.../...`.
 *
 * The shape covers the methods `@cfast/auth` components actually call,
 * plus the common `useSession` hook. All plugin methods are optional so
 * apps that don't install a given plugin (passkey, admin) still satisfy
 * the type.
 */
export type AuthClient = {
  signIn: {
    magicLink: (opts: {
      email: string;
      callbackURL?: string;
    }) => Promise<AuthClientErrorResult>;
    passkey?: (opts?: {
      email?: string;
    }) => Promise<AuthClientErrorResult | undefined>;
    email?: (opts: {
      email: string;
      password: string;
    }) => Promise<AuthClientErrorResult>;
  };
  signUp?: {
    email: (opts: {
      email: string;
      password: string;
      name: string;
    }) => Promise<AuthClientErrorResult>;
  };
  signOut: () => Promise<unknown>;
  useSession: () => AuthClientSessionHookResult;
  passkey?: {
    addPasskey: () => Promise<AuthClientErrorResult | undefined>;
    deletePasskey: (opts: {
      id: string;
    }) => Promise<AuthClientErrorResult | undefined>;
  };
  admin?: {
    stopImpersonating: () => Promise<unknown>;
  };
};

/**
 * Creates a Better Auth React client with a portable return type.
 *
 * Thin wrapper over `better-auth/react`'s `createAuthClient` that types
 * the return value as {@link AuthClient}. This eliminates `TS2742`
 * errors in downstream apps using `composite: true` with pnpm, which
 * otherwise can't name the inferred type because it references symlinked
 * `.pnpm/...` paths in the dependency graph.
 *
 * @param options - Passed through verbatim to `better-auth/react`'s
 *   `createAuthClient`. See Better Auth docs for plugin configuration.
 * @returns A typed {@link AuthClient} instance.
 */
export function createAuthClient(options?: Record<string, unknown>): AuthClient {
  // We cast through `unknown` because Better Auth's inferred return type
  // is a deeply conditional mapped type over the provided plugins; TS
  // cannot prove structural compatibility with our simpler `AuthClient`
  // shape, but the runtime shape matches exactly by construction.
  return betterAuthCreateClient(options as any) as unknown as AuthClient;
}

export { magicLinkClient } from "better-auth/client/plugins";
export { passkeyClient } from "@better-auth/passkey/client";
