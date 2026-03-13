import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { passkey } from "@better-auth/passkey";
import { createDbClient } from "./db/client";
import type { Env } from "./env";
import { sendMagicLinkEmail } from "./email/send";

export function createAuth(env: Env) {
  const db = createDbClient(env.DB);

  return betterAuth({
    baseURL: env.APP_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(env, email, url);
        },
      }),
      passkey({
        rpName: "Team Blog",
        rpID: new URL(env.APP_URL).hostname,
        origin: env.APP_URL,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 30,
    },
  });
}
