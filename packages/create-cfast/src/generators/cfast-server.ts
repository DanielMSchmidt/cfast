import type { Config } from "../types";

export function generateCfastServer(config: Config): string {
  const imports: string[] = [
    `import { createApp } from "@cfast/core";`,
    `import { envSchema } from "./env";`,
    `import { permissions } from "./permissions";`,
  ];

  const pluginDefs: string[] = [];
  const useChain: string[] = [];

  if (config.features.auth) {
    imports.push(`import { definePlugin } from "@cfast/core";`);
    imports.push(`import { initAuth } from "./auth.setup.server";`);
    imports.push(`import type { AuthUser } from "./permissions";`);
    imports.push(`import type { Grant } from "@cfast/permissions";`);

    pluginDefs.push(`
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
});`);
    useChain.push("authPlugin");
  }

  if (config.features.db) {
    // Single source of truth for the per-request permission-aware Db.
    // `createAppDb()` consolidates the three near-identical `createDb`
    // factories older templates duplicated across cfast.server.ts,
    // admin.server.ts, and ad-hoc route handlers (#149). The exported
    // `appDb` is reused by admin.server.ts -- the admin's `db` config field
    // is structurally `(grants, user) => Db`, which is exactly what
    // createAppDb() returns.
    imports.push(`import { createAppDb } from "@cfast/db";`);
    imports.push(`import { env } from "./env";`);
    imports.push(`import * as schema from "./db/schema";`);

    pluginDefs.push(`
// Lazy D1 binding: env.DB isn't materialized at module load on Workers, so
// the factory reads it via env.get() per request. Defined once here and
// reused by admin.server.ts and any route handler that needs an ad-hoc Db.
export const appDb = createAppDb({
  d1: () => env.get().DB,
  schema: schema as unknown as Record<string, object>,
  cache: false,
});`);

    if (config.features.auth) {
      pluginDefs.push(`
const dbPlugin = definePlugin({
  name: "db",
  requires: [authPlugin],
  setup(ctx) {
    return {
      client: appDb(
        ctx.auth.grants,
        ctx.auth.user ? { id: ctx.auth.user.id } : null,
      ),
    };
  },
});`);
    } else {
      pluginDefs.push(`
const dbPlugin = definePlugin({
  name: "db",
  setup(_ctx) {
    return { client: appDb([], null) };
  },
});`);
    }
    useChain.push("dbPlugin");
  }

  const appLine =
    useChain.length > 0
      ? `export const app = createApp({ env: envSchema, permissions })\n${useChain.map((p) => `  .use(${p})`).join("\n")};`
      : `export const app = createApp({ env: envSchema, permissions });`;

  return `${imports.join("\n")}
${pluginDefs.join("\n")}

${appLine}
`;
}
