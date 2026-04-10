import { createApp, definePlugin } from "@cfast/core";
import { createAppDb } from "@cfast/db";
import { drizzle } from "drizzle-orm/d1";
import type { Grant } from "@cfast/permissions";
import { env, envSchema } from "./env";
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

// Single source of truth for the per-request permission-aware Db. Reused by
// admin.server.ts and any route handler that needs an ad-hoc Db -- previously
// each call site had its own near-identical createDb factory (#149).
export const appDb = createAppDb({
  d1: () => env.get().DB,
  schema,
  cache: false,
});

// db plugin — uses `requires` inference (no curried form) to depend on authPlugin.
// Exposes both the permission-aware client and raw Drizzle.
const dbPlugin = definePlugin({
  name: "db" as const,
  requires: [authPlugin],
  setup(ctx) {
    const client = appDb(
      ctx.auth.grants,
      ctx.auth.user ? { id: ctx.auth.user.id } : null,
    );
    const raw = drizzle(ctx.env.DB as D1Database, { schema });
    return { client, raw };
  },
});

export const app = createApp({ env: envSchema, permissions })
  .use(authPlugin)
  .use(dbPlugin);
