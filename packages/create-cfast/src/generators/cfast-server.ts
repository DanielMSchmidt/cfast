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
    imports.push(`import { createDb } from "@cfast/db";`);
    imports.push(`import * as schema from "./db/schema";`);

    if (config.features.auth) {
      pluginDefs.push(`
type AuthProvides = { auth: { user: AuthUser | null; grants: Grant[] } };
const dbPlugin = definePlugin<AuthProvides>()({
  name: "db",
  setup(ctx) {
    const client = createDb({
      d1: ctx.env.DB as D1Database,
      schema: schema as unknown as Record<string, unknown>,
      grants: ctx.auth.grants,
      user: ctx.auth.user ? { id: ctx.auth.user.id } : null,
      cache: false,
    });
    return { client };
  },
});`);
    } else {
      pluginDefs.push(`
const dbPlugin = definePlugin({
  name: "db",
  setup(ctx) {
    const client = createDb({
      d1: ctx.env.DB as D1Database,
      schema: schema as unknown as Record<string, unknown>,
      grants: [],
      user: null,
      cache: false,
    });
    return { client };
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
