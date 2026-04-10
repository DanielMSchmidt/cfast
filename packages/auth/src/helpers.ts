import type { AuthInstance, AuthContext, AuthenticatedContext, AuthUser } from "./types";

/**
 * Options for {@link createAuthHelpers}.
 *
 * @typeParam TUser - The application-specific user type. Defaults to
 *   `AuthUser` when no `enrichUser` hook is provided.
 */
export type AuthHelpersOptions<TUser extends AuthUser = AuthUser> = {
  /**
   * Factory that returns an initialized `AuthInstance`.
   *
   * Called on every helper invocation to guarantee fresh env bindings on
   * Cloudflare Workers (where module-scope closures can survive across
   * requests inside the same isolate).
   */
  getAuth: () => AuthInstance;
  /**
   * Optional hook to extend the base `AuthUser` with app-specific fields
   * (e.g., `vendorId`, custom profile data).
   *
   * When provided, every helper that returns a user will pass the base user
   * through this function before returning. The enriched user type `TUser`
   * flows through to all return types.
   *
   * @example
   * ```ts
   * const helpers = createAuthHelpers({
   *   getAuth,
   *   enrichUser: async (user) => {
   *     const vendor = await lookupVendor(user.id);
   *     return { ...user, vendorId: vendor?.id ?? null };
   *   },
   * });
   * ```
   */
  enrichUser?: (user: AuthUser) => Promise<TUser> | TUser;
};

/**
 * The auth helper functions returned by {@link createAuthHelpers}.
 *
 * @typeParam TUser - The (potentially enriched) user type.
 */
export type AuthHelpers<TUser extends AuthUser = AuthUser> = {
  /** Returns the auth context for the request. User is `null` if unauthenticated. */
  getAuthContext: (request: Request) => Promise<{ user: TUser | null; grants: AuthContext["grants"] }>;
  /** Returns the auth context, throwing a 302 redirect if the user is not authenticated. */
  requireAuthContext: (request: Request) => Promise<{ user: TUser; grants: AuthenticatedContext["grants"] }>;
  /** Returns the user, or `null` if unauthenticated. */
  getUser: (request: Request) => Promise<TUser | null>;
  /** Returns the user, throwing a 302 redirect if not authenticated. */
  requireUser: (request: Request) => Promise<TUser>;
};

/**
 * Creates a set of auth helper functions that wrap an `AuthInstance`.
 *
 * Replaces the ~35 lines of identical `auth.helpers.server.ts` boilerplate
 * that every cfast app copy-pastes. Apps that need to extend the user object
 * (e.g., adding `vendorId` in the store app) pass an `enrichUser` hook.
 *
 * @param options - Configuration with `getAuth` factory and optional `enrichUser` hook.
 * @returns An object with `getAuthContext`, `requireAuthContext`, `getUser`, `requireUser`.
 *
 * @example
 * ```ts
 * // app/auth.helpers.server.ts
 * import { createAuthHelpers } from "@cfast/auth/helpers";
 * import { initAuth } from "./auth.setup.server";
 * import { env } from "./env";
 *
 * const { getAuthContext, requireAuthContext, getUser, requireUser } =
 *   createAuthHelpers({
 *     getAuth: () => initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL }),
 *   });
 *
 * export { getAuthContext, requireAuthContext, getUser, requireUser };
 * ```
 *
 * @example
 * ```ts
 * // With enrichUser hook (e.g., store app)
 * const helpers = createAuthHelpers({
 *   getAuth: () => initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL }),
 *   enrichUser: async (user) => {
 *     const vendor = await lookupVendor(user.id);
 *     return { ...user, vendorId: vendor?.id ?? null };
 *   },
 * });
 * ```
 */
export function createAuthHelpers<TUser extends AuthUser = AuthUser>(
  options: AuthHelpersOptions<TUser>,
): AuthHelpers<TUser> {
  const { getAuth, enrichUser } = options;

  async function applyEnrich(user: AuthUser): Promise<TUser> {
    if (enrichUser) {
      return enrichUser(user);
    }
    return user as TUser;
  }

  async function getAuthContext(
    request: Request,
  ): Promise<{ user: TUser | null; grants: AuthContext["grants"] }> {
    const ctx = await getAuth().createContext(request);
    if (!ctx.user) {
      return { user: null, grants: ctx.grants };
    }
    const user = await applyEnrich(ctx.user);
    return { user, grants: ctx.grants };
  }

  async function requireAuthContext(
    request: Request,
  ): Promise<{ user: TUser; grants: AuthenticatedContext["grants"] }> {
    const ctx = await getAuth().requireUser(request);
    const user = await applyEnrich(ctx.user);
    return { user, grants: ctx.grants };
  }

  async function getUser(request: Request): Promise<TUser | null> {
    const ctx = await getAuthContext(request);
    return ctx.user;
  }

  async function requireUser(request: Request): Promise<TUser> {
    const ctx = await requireAuthContext(request);
    return ctx.user;
  }

  return { getAuthContext, requireAuthContext, getUser, requireUser };
}
