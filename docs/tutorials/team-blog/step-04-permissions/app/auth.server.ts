import { createAuth } from "@cfast/auth";
import { permissions } from "./permissions";
import { env } from "./env.server";

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

export async function getAuthContext(request: Request) {
  const auth = getAuth();
  return auth.createContext(request);
}

export async function requireAuthContext(request: Request) {
  const auth = getAuth();
  return auth.requireUser(request);
}
