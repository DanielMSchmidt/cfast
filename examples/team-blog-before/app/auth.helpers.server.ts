import { redirect } from "react-router";
import type { Env } from "./env";
import { createAuth } from "./auth.server";
import { createDbClient } from "./db/client";
import { roles, users } from "./db/schema";
import { eq } from "drizzle-orm";

// Re-export from shared module for convenience in server-only code
export { hasRole, hasAnyRole } from "./permissions";
export type { AuthUser, UserRole } from "./permissions";

import type { AuthUser } from "./permissions";

export async function getUser(request: Request, env: Env): Promise<AuthUser | null> {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;

  const db = createDbClient(env.DB);

  // Check for impersonation
  const impersonationTarget = await env.CACHE.get(`impersonation:${session.session.id}`);
  if (impersonationTarget) {
    const targetUser = await db.select().from(users).where(eq(users.id, impersonationTarget)).get();
    if (targetUser) {
      const targetRoles = await db.select().from(roles).where(eq(roles.userId, targetUser.id));
      return {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        avatarUrl: targetUser.avatarUrl,
        roles: targetRoles.length > 0 ? targetRoles.map((r) => r.role) : ["reader"],
        isImpersonating: true,
        impersonatedBy: session.user.id,
        realUser: { id: session.user.id, name: session.user.name },
      };
    }
  }

  const userRoles = await db.select().from(roles).where(eq(roles.userId, session.user.id));

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatarUrl: session.user.image ?? null,
    roles: userRoles.length > 0 ? userRoles.map((r) => r.role) : ["reader"],
  };
}

export async function requireUser(request: Request, env: Env): Promise<AuthUser> {
  const user = await getUser(request, env);
  if (!user) throw redirect("/login");
  return user;
}
