import { initAuth } from "./auth.setup.server";
import { env } from "./env";
import type { Grant } from "@cfast/permissions";
import type { AuthUser } from "./permissions";

export { hasRole, hasAnyRole } from "./permissions";
export type { UserRole } from "./permissions";

export type AuthContext = { user: AuthUser | null; grants: Grant[] };
export type AuthenticatedContext = { user: AuthUser; grants: Grant[] };

function getAuth() {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const ctx = await getAuth().createContext(request);
  return ctx as AuthContext;
}

export async function requireAuthContext(request: Request): Promise<AuthenticatedContext> {
  const ctx = await getAuth().requireUser(request);
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
