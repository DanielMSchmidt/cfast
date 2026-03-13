import { createAuth } from "@cfast/auth";
import * as schema from "./db/schema";
import { permissions } from "./permissions";
import { env } from "./env";

export const initAuth = createAuth({
  permissions,
  schema,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      // TODO: integrate with @cfast/email when email feature is enabled
      console.log(`Magic link for ${email}: ${url}`);
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["member"],
});
