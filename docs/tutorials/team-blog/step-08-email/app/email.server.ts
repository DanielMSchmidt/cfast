import { createEmailClient } from "@cfast/email";
import { console as consoleProvider } from "@cfast/email/console";
import type { EmailProvider } from "@cfast/email";
import { env } from "~/env";

// Use the console provider during development.
// In production, swap to mailgun:
//   import { mailgun } from "@cfast/email/mailgun";
//   provider: mailgun(() => ({
//     apiKey: env.get().MAILGUN_API_KEY,
//     domain: env.get().MAILGUN_DOMAIN,
//   })),

let cachedProvider: EmailProvider | null = null;
function getProvider(): EmailProvider {
  if (!cachedProvider) {
    cachedProvider = consoleProvider();
  }
  return cachedProvider;
}

const lazyProvider: EmailProvider = {
  name: "lazy",
  send(message) {
    return getProvider().send(message);
  },
};

export const email = createEmailClient({
  provider: lazyProvider,
  from: () => `Team Blog <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
