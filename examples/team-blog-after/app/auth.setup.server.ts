import { createAuth } from "@cfast/auth";
import { permissions } from "./permissions";
import { env } from "./env";
import { sendMagicLinkEmail } from "./email/send";

export const initAuth = createAuth({
  permissions,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      await sendMagicLinkEmail(env.get(), email, url);
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["reader"],
});
