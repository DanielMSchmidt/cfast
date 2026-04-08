import { initAuth } from "./auth.setup.server";
import { env } from "./env";
import type { Grant } from "@cfast/permissions";
import type { AuthInstance } from "@cfast/auth";
import type { AuthUser } from "./permissions";

export { hasRole, hasAnyRole } from "./permissions";
export type { UserRole } from "./permissions";

export type AuthContext = { user: AuthUser | null; grants: Grant[] };
export type AuthenticatedContext = { user: AuthUser; grants: Grant[] };

// Request-scoped cache: every helper that takes a `Request` reuses the same
// `AuthInstance` for the lifetime of that request. Without this, each call
// to `getUser` / `requireUser` / `getAuthContext` would re-run `initAuth()`,
// which instantiates Better Auth, the Drizzle adapter, the role manager,
// and the impersonation manager from scratch — 3+ times per request in
// typical loaders.
//
// A `WeakMap` is the right shape: entries drop automatically once the
// request is garbage-collected, so there is nothing to clean up between
// requests and no cross-request leakage.
const authByRequest = new WeakMap<Request, AuthInstance>();

/**
 * Returns the auth instance for the current request, constructing it on
 * first access and reusing it for every subsequent helper call that shares
 * the same `Request` object.
 */
export function getAuth(request: Request): AuthInstance {
  const cached = authByRequest.get(request);
  if (cached) return cached;
  const e = env.get();
  const instance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
  authByRequest.set(request, instance);
  return instance;
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const ctx = await getAuth(request).createContext(request);
  return ctx as AuthContext;
}

export async function requireAuthContext(request: Request): Promise<AuthenticatedContext> {
  const ctx = await getAuth(request).requireUser(request);
  return ctx as AuthenticatedContext;
}

export async function getUser(request: Request): Promise<AuthUser | null> {
  const ctx = await getAuthContext(request);
  return ctx.user;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const ctx = await requireAuthContext(request);
  return ctx.user;
}
