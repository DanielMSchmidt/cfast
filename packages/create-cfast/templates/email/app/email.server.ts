import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";
import { console as consoleProvider } from "@cfast/email/console";
import type { EmailProvider } from "@cfast/email";
import { env } from "~/env";

let cachedProvider: EmailProvider | null = null;
function getProvider(): EmailProvider {
  if (!cachedProvider) {
    const e = env.get();
    if (e.MAILGUN_API_KEY === "test-key") {
      cachedProvider = consoleProvider();
    } else {
      cachedProvider = mailgun(() => ({
        apiKey: env.get().MAILGUN_API_KEY,
        domain: env.get().MAILGUN_DOMAIN,
      }));
    }
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
  from: () => `{{projectName}} <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
