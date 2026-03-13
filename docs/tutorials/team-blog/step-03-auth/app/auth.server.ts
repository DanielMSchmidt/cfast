import { createAuth } from "@cfast/auth";
import { definePermissions } from "@cfast/permissions";
import { env } from "./env.server";

// Minimal permissions for now -- we expand these in Step 4
const permissions = definePermissions({
  roles: ["reader"] as const,
  grants: {
    reader: [],
  },
});

export const initAuth = createAuth({
  permissions,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      // In development, log the magic link to the console
      console.log(`[Magic Link] Send to ${email}: ${url}`);
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["reader"],
});

export function getAuth() {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
}

export async function getUser(request: Request) {
  const auth = getAuth();
  const ctx = await auth.createContext(request);
  return ctx.user;
}

export async function requireUser(request: Request) {
  const auth = getAuth();
  const ctx = await auth.requireUser(request);
  return ctx.user;
}
