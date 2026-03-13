import type { EmailMessage, EmailProvider } from "./types.js";
import { EmailDeliveryError } from "./errors.js";

/** Configuration for the Mailgun email provider. */
type MailgunConfig = {
  /** Mailgun API key (found in your Mailgun dashboard). */
  apiKey: string;
  /** Mailgun sending domain (e.g. `"mail.myapp.com"`). */
  domain: string;
};

/**
 * Create a Mailgun {@link EmailProvider} that sends emails via the Mailgun HTTP API.
 *
 * The config getter is called lazily at send time, which is the Workers-friendly
 * pattern for accessing env bindings that are not available at module scope.
 *
 * @param getConfig - A getter function returning Mailgun API credentials.
 * @returns An {@link EmailProvider} backed by Mailgun.
 * @throws {EmailDeliveryError} If the Mailgun API returns a non-OK response.
 *
 * @example
 * ```ts
 * import { mailgun } from "@cfast/email/mailgun";
 *
 * const provider = mailgun(() => ({
 *   apiKey: env.get().MAILGUN_API_KEY,
 *   domain: env.get().MAILGUN_DOMAIN,
 * }));
 * ```
 */
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

      // JSON parsing boundary: validate response shape before use
      const data: unknown = await response.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "id" in data &&
        typeof data.id === "string"
      ) {
        return { id: data.id };
      }
      throw new EmailDeliveryError(
        "Mailgun API returned an unexpected response shape",
        {
          provider: "mailgun",
          statusCode: response.status,
          response: JSON.stringify(data),
        },
      );
    },
  };
}
