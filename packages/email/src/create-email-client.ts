import { render } from "@react-email/render";
import type { EmailClient, EmailClientConfig, SendOptions } from "./types.js";

/**
 * Create an email client that renders react-email templates and delivers them
 * through a pluggable {@link EmailProvider}.
 *
 * The client renders the React element to both HTML and plain-text via
 * `@react-email/render`, resolves the provider and sender address (supporting
 * lazy getters for Workers compatibility), and delegates delivery.
 *
 * @param config - Client configuration with provider and default sender.
 * @returns An {@link EmailClient} with a `send` method.
 *
 * @example
 * ```ts
 * import { createEmailClient } from "@cfast/email";
 * import { mailgun } from "@cfast/email/mailgun";
 *
 * const email = createEmailClient({
 *   provider: mailgun(() => ({
 *     apiKey: env.get().MAILGUN_API_KEY,
 *     domain: env.get().MAILGUN_DOMAIN,
 *   })),
 *   from: () => `MyApp <noreply@${env.get().MAILGUN_DOMAIN}>`,
 * });
 *
 * await email.send({
 *   to: "user@example.com",
 *   subject: "Welcome",
 *   react: <WelcomeEmail name="Daniel" />,
 * });
 * ```
 */
export function createEmailClient(config: EmailClientConfig): EmailClient {
  return {
    async send(options: SendOptions): Promise<{ id: string }> {
      const [html, text] = await Promise.all([
        render(options.react),
        render(options.react, { plainText: true }),
      ]);

      const from =
        options.from ??
        (typeof config.from === "function" ? config.from() : config.from);

      const provider =
        typeof config.provider === "function"
          ? config.provider()
          : config.provider;

      return provider.send({
        to: options.to,
        from,
        subject: options.subject,
        html,
        text,
      });
    },
  };
}
