import type { AuthInstance } from "./types";

/**
 * Adapter type matching @cfast/admin's AdminAuthConfig interface.
 * Duplicated here to avoid a circular dependency on @cfast/admin.
 */
type AdminAuthBridge = {
  requireUser(request: Request): Promise<{ user: { id: string; email: string; name: string; avatarUrl: string | null; roles: string[]; isImpersonating?: boolean; realUser?: { id: string; name: string } }; grants: unknown[] }>;
  hasRole(user: { roles: string[] }, role: string): boolean;
  getRoles(userId: string): Promise<string[]>;
  setRole(userId: string, role: string): Promise<void>;
  removeRole(userId: string, role: string): Promise<void>;
  setRoles(userId: string, roles: string[]): Promise<void>;
};

/**
 * Creates an admin auth adapter from a cfast auth instance factory.
 *
 * Replaces ~150 lines of manual adapter boilerplate with a single call.
 * The factory is called per-operation to ensure fresh env bindings on Workers.
 *
 * @param getAuth - Factory that returns an initialized AuthInstance.
 * @returns An object satisfying `@cfast/admin`'s `AdminAuthConfig` interface.
 *
 * @example
 * ```ts
 * import { createAdminAuth } from "@cfast/auth";
 *
 * const auth = createAdminAuth(() =>
 *   initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL })
 * );
 *
 * const admin = createAdmin({ auth, db: createDbForAdmin, schema });
 * ```
 */
export function createAdminAuth(
  getAuth: () => AuthInstance,
): AdminAuthBridge {
  return {
    async requireUser(request: Request) {
      const ctx = await getAuth().requireUser(request);
      return { user: ctx.user, grants: ctx.grants };
    },

    hasRole(user: { roles: string[] }, role: string): boolean {
      return user.roles.includes(role);
    },

    async getRoles(userId: string) {
      return getAuth().getRoles(userId);
    },

    async setRole(userId: string, role: string) {
      await getAuth().setRole(userId, role);
    },

    async removeRole(userId: string, role: string) {
      await getAuth().removeRole(userId, role);
    },

    async setRoles(userId: string, roles: string[]) {
      await getAuth().setRoles(userId, roles);
    },
  };
}
