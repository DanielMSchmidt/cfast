import type { EmailMessage, EmailProvider } from "./types.js";
import { EmailDeliveryError } from "./errors.js";

type MailgunConfig = {
  apiKey: string;
  domain: string;
};

export function mailgun(getConfig: () => MailgunConfig): EmailProvider {
  return {
    name: "mailgun",

    async send(message: EmailMessage): Promise<{ id: string }> {
      const config = getConfig();

      const form = new FormData();
      form.append("from", message.from);
      form.append("to", message.to);
      form.append("subject", message.subject);
      form.append("html", message.html);
      form.append("text", message.text);

      const response = await fetch(
        `https://api.mailgun.net/v3/${config.domain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`api:${config.apiKey}`)}`,
          },
          body: form,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new EmailDeliveryError(
          `Mailgun API error: ${response.status} ${body}`,
          {
            provider: "mailgun",
            statusCode: response.status,
            response: body,
          },
        );
      }

      const data = (await response.json()) as { id: string };
      return { id: data.id };
    },
  };
}
