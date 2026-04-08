import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";
import { createAdminAuth } from "@cfast/auth";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";
import { appDb } from "~/cfast.server";
import * as schema from "~/db/schema";

// ---------------------------------------------------------------------------
// Admin auth adapter — one line instead of ~150
// ---------------------------------------------------------------------------

const auth = createAdminAuth(() =>
  initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL })
);

// ---------------------------------------------------------------------------
// DB factory — reused from cfast.server.ts
// ---------------------------------------------------------------------------
//
// `appDb` is `(grants, user) => Db`, which is exactly the shape that
// @cfast/admin's `db` field expects. Reusing the same factory means the
// admin loader/action and the rest of the app share one `createDb`
// definition (no more duplicated `createDbForAdmin` boilerplate -- #149).

// ---------------------------------------------------------------------------
// Admin config
// ---------------------------------------------------------------------------

const adminConfig = {
  db: appDb,
  auth,
  schema: {
    users: schema.users,
    posts: schema.posts,
    comments: schema.comments,
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
// Introspect schema (shared between server and client)
// ---------------------------------------------------------------------------

const tableMetas = introspectSchema(adminConfig.schema);

// ---------------------------------------------------------------------------
// Server-only loader and action
// ---------------------------------------------------------------------------

export const adminLoader = createAdminLoader(adminConfig, tableMetas);
export const adminAction = createAdminAction(adminConfig, tableMetas);
