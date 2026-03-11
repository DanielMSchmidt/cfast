import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";
import { env } from "~/env";

export const email = createEmailClient({
  provider: mailgun(() => ({
    apiKey: env.get().MAILGUN_API_KEY,
    domain: env.get().MAILGUN_DOMAIN,
  })),
  from: () => `Team Blog <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
