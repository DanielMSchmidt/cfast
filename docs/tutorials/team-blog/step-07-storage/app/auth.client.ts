import { createAuthClient, magicLinkClient } from "@cfast/auth/client";

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});
