import { createAuth } from "@cfast/auth";
import * as schema from "./db/schema";
import { permissions } from "./permissions";
import { env } from "./env";
import { sendMagicLinkEmail } from "./email/send";

export const initAuth = createAuth({
  permissions,
  schema,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      await sendMagicLinkEmail(env.get(), email, url);
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["reader"],
});
