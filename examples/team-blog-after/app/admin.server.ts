import { redirect } from "react-router";
import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";
import type { AdminAuthConfig, AdminUser } from "@cfast/admin";
import { createDb } from "@cfast/db";
import type { DbConfig } from "@cfast/db";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";
import * as schema from "~/db/schema";
import { impersonationLogs } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Admin auth adapter — bridges the app's auth to @cfast/admin's interface
// ---------------------------------------------------------------------------

const auth: AdminAuthConfig = {
  async requireUser(request: Request) {
    const ctx = await requireAuthContext(request);
    const user: AdminUser = {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      avatarUrl: ctx.user.avatarUrl,
      roles: ctx.user.roles,
      isImpersonating: ctx.user.isImpersonating,
      realUser: ctx.user.realUser,
    };
    return { user, grants: ctx.grants };
  },

  hasRole(user: AdminUser, role: string) {
    return hasRole(
      user as Parameters<typeof hasRole>[0],
      role as Parameters<typeof hasRole>[1],
    );
  },

  async getRoles(userId: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    return authInstance.getRoles(userId);
  },

  async setRole(userId: string, role: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.setRole(userId, role);
  },

  async removeRole(userId: string, role: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.removeRole(userId, role);
  },

  async setRoles(userId: string, roles: string[]) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.setRoles(userId, roles);
  },

  async impersonate(adminId: string, targetId: string, request: Request) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    const betterAuth = authInstance.api as {
      api: {
        getSession: (opts: {
          headers: Headers;
        }) => Promise<{ session: { id: string } } | null>;
      };
    };
    const session = await betterAuth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session) {
      throw redirect("/login");
    }

    await e.CACHE.put(`impersonation:${session.session.id}`, targetId, {
      expirationTtl: 3600,
    });

    // Log impersonation
    const ctx = await requireAuthContext(request);
    const db = createDb({
      d1: e.DB,
      schema: schema as unknown as DbConfig["schema"],
      grants: ctx.grants,
      user: { id: adminId },
      cache: false,
    });
    await db
      .unsafe()
      .insert(impersonationLogs)
      .values({
        id: nanoid(),
        adminId,
        targetUserId: targetId,
      })
      .run({});

    return redirect("/");
  },

  async stopImpersonation(request: Request) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    const betterAuth = authInstance.api as {
      api: {
        getSession: (opts: {
          headers: Headers;
        }) => Promise<{ session: { id: string } } | null>;
      };
    };
    const session = await betterAuth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session) {
      throw redirect("/login");
    }

    await e.CACHE.delete(`impersonation:${session.session.id}`);

    // Close impersonation log
    const ctx = await requireAuthContext(request);
    if (ctx.user.realUser) {
      const db = createDb({
        d1: e.DB,
        schema: schema as unknown as DbConfig["schema"],
        grants: ctx.grants,
        user: { id: ctx.user.realUser.id },
        cache: false,
      });
      await db
        .unsafe()
        .update(impersonationLogs)
        .set({ endedAt: new Date() })
        .where(
          and(
            eq(impersonationLogs.adminId, ctx.user.realUser.id),
            eq(impersonationLogs.targetUserId, ctx.user.id),
            isNull(impersonationLogs.endedAt),
          ),
        )
        .run({});
    }

    return redirect("/admin");
  },
};

// ---------------------------------------------------------------------------
// DB factory — called per-request by @cfast/admin's loader/action
// ---------------------------------------------------------------------------

function createDbForAdmin(grants: unknown[], user: { id: string } | null) {
  const e = env.get();
  return createDb({
    d1: e.DB,
    schema: schema as unknown as DbConfig["schema"],
    grants: grants as Parameters<typeof createDb>[0]["grants"],
    user,
    cache: false,
  });
}

// ---------------------------------------------------------------------------
// Admin config
// ---------------------------------------------------------------------------

const adminConfig = {
  db: createDbForAdmin,
  auth,
  schema: {
    users: schema.users,
    posts: schema.posts,
    comments: schema.comments,
    roles: schema.roles,
    auditLogs: schema.auditLogs,
  },
  users: {
    assignableRoles: ["admin", "editor", "author"],
  },
  dashboard: {
    widgets: [
      { type: "count" as const, table: "users", label: "Total Users" },
      { type: "count" as const, table: "posts", label: "Total Posts" },
      { type: "count" as const, table: "comments", label: "Total Comments" },
      { type: "recent" as const, table: "posts", label: "Recent Posts", limit: 5 },
      { type: "recent" as const, table: "users", label: "Recent Users", limit: 5 },
    ],
  },
  requiredRole: "admin",
};

// ---------------------------------------------------------------------------
// Introspect schema (shared between server and conceptual client)
// ---------------------------------------------------------------------------

const tableMetas = introspectSchema(adminConfig.schema);

// ---------------------------------------------------------------------------
// Server-only loader and action
// ---------------------------------------------------------------------------

export const adminLoader = createAdminLoader(adminConfig, tableMetas);
export const adminAction = createAdminAction(adminConfig, tableMetas);
