import { render } from "@react-email/render";
import type { EmailClient, EmailClientConfig, SendOptions } from "./types.js";

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
