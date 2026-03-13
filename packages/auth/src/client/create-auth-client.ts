/**
 * Re-exports Better Auth's React client factory and the magic link plugin.
 *
 * Usage:
 * ```ts
 * import { createAuthClient, magicLinkClient } from "@cfast/auth/client";
 * import { passkeyClient } from "@better-auth/passkey/client";
 *
 * export const authClient = createAuthClient({
 *   plugins: [magicLinkClient(), passkeyClient()],
 * });
 * ```
 */
export { createAuthClient } from "better-auth/react";
export { magicLinkClient } from "better-auth/client/plugins";
