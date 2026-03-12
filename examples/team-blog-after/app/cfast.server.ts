import { createApp, definePlugin } from "@cfast/core";
import { createDb } from "@cfast/db";
import type { DrizzleTable, Grant } from "@cfast/permissions";
import { envSchema } from "./env";
import { initAuth } from "./auth.setup.server";
import { permissions, type AuthUser } from "./permissions";
import * as schema from "./db/schema";

// Inline auth plugin (will be replaced by @cfast/auth's authPlugin when it ships)
const authPlugin = definePlugin({
  name: "auth",
  async setup(ctx) {
    const auth = initAuth({
      d1: ctx.env.DB as D1Database,
      appUrl: ctx.env.APP_URL as string,
    });
    const authCtx = await auth.createContext(ctx.request);
    return {
      user: authCtx.user as AuthUser | null,
      grants: authCtx.grants as Grant[],
      instance: auth,
    };
  },
});

// Inline db plugin
type AuthProvides = { auth: { user: AuthUser | null; grants: Grant[] } };
const dbPlugin = definePlugin<AuthProvides>()({
  name: "db",
  setup(ctx) {
    const client = createDb({
      d1: ctx.env.DB as D1Database,
      schema: schema as unknown as Record<string, DrizzleTable>,
      grants: ctx.auth.grants,
      user: ctx.auth.user ? { id: ctx.auth.user.id } : null,
      cache: false,
    });
    return { client };
  },
});

export const app = createApp({ env: envSchema, permissions })
  .use(authPlugin)
  .use(dbPlugin);
