import { createAuthClient, magicLinkClient } from "@cfast/auth/client";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
});
