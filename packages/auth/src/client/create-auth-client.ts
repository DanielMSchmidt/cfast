/**
 * Re-exports Better Auth's React client factory, the magic link plugin,
 * and the passkey client plugin.
 *
 * Usage:
 * ```ts
 * import { createAuthClient, magicLinkClient, passkeyClient } from "@cfast/auth/client";
 *
 * export const authClient = createAuthClient({
 *   plugins: [magicLinkClient(), passkeyClient()],
 * });
 * ```
 */
export { createAuthClient } from "better-auth/react";
export { magicLinkClient } from "better-auth/client/plugins";
export { passkeyClient } from "@better-auth/passkey/client";
