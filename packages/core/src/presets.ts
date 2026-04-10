import type { Grant } from "@cfast/permissions";
import { definePlugin } from "./define-plugin";

type AuthInstanceLike = {
  createContext: (request: Request) => Promise<{
    user: { id: string; email: string; name: string; [key: string]: unknown } | null;
    grants: Grant[];
  }>;
};

type DbFactory = (grants: Grant[], user: { id: string } | null) => unknown;

export type DefaultPluginsConfig = {
  initAuth: (env: Record<string, unknown>) => AuthInstanceLike;
  createDb: DbFactory;
};

export type DefaultAuthProvides = {
  user: { id: string; email: string; name: string; [key: string]: unknown } | null;
  grants: Grant[];
  instance: AuthInstanceLike;
};

export type DefaultDbProvides = {
  client: unknown;
};

export function createDefaultPlugins(config: DefaultPluginsConfig) {
  const authPlugin = definePlugin({
    name: "auth" as const,
    async setup(ctx: { request: Request; env: Record<string, unknown> }) {
      const auth = config.initAuth(ctx.env);
      const authCtx = await auth.createContext(ctx.request);
      return {
        user: authCtx.user,
        grants: authCtx.grants,
        instance: auth,
      };
    },
  });

  const dbPlugin = definePlugin({
    name: "db" as const,
    requires: [authPlugin],
    setup(ctx) {
      const client = config.createDb(
        ctx.auth.grants,
        ctx.auth.user ? { id: ctx.auth.user.id } : null,
      );
      return { client };
    },
  });

  return { authPlugin, dbPlugin };
}
