import { createAuth } from "@cfast/auth";
import * as schema from "./db/schema";
import { permissions } from "./permissions";

export const initAuth = createAuth({
  permissions,
  schema,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      // In a real app you'd send the email; for the tutorial we log it
      console.log(`[Magic Link] Send to ${email}: ${url}`);
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["reader"],
});
