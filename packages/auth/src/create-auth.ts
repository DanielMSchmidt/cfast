import { resolveGrants } from "@cfast/permissions";
import type { Grant } from "@cfast/permissions";
import { createRoleManager } from "./roles";
import type { AuthConfig, AuthContext, AuthenticatedContext, AuthEnvConfig, AuthInstance } from "./types";

export function createAuth(config: AuthConfig) {
  const anonymousRoles = config.anonymousRoles ?? [];
  const anonymousGrants: Grant[] = resolveGrants(config.permissions, anonymousRoles);
  const loginPath = config.redirects?.loginPath ?? "/login";

  return function initAuth(env: AuthEnvConfig): AuthInstance {
    const roleManager = createRoleManager(env.d1);

    async function createContext(request: Request): Promise<AuthContext> {
      // TODO: Better Auth session lookup goes here (Task 4).
      // For now, always return anonymous context since Better Auth isn't wired yet.
      return {
        user: null,
        grants: anonymousGrants,
      };
    }

    async function requireUser(request: Request): Promise<AuthenticatedContext> {
      const ctx = await createContext(request);

      if (ctx.user === null) {
        const redirectTo = new URL(request.url).pathname;
        const headers = new Headers();
        headers.set("Location", loginPath);
        headers.set(
          "Set-Cookie",
          `cfast_redirect_to=${encodeURIComponent(redirectTo)}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
        );
        throw new Response(null, { status: 302, headers });
      }

      return ctx as AuthenticatedContext;
    }

    return {
      createContext,
      requireUser,
      getRoles: roleManager.getRoles,
      setRole: roleManager.setRole,
      setRoles: roleManager.setRoles,
      removeRole: roleManager.removeRole,
      api: null,
    };
  };
}
