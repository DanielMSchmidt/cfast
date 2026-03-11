import { render } from "@react-email/render";
import type { EmailClient, EmailClientConfig, SendOptions } from "./types.js";

export function createEmailClient(config: EmailClientConfig): EmailClient {
  return {
    async send(options: SendOptions): Promise<{ id: string }> {
      const html = await render(options.react);
      const text = await render(options.react, { plainText: true });

      const from =
        options.from ??
        (typeof config.from === "function" ? config.from() : config.from);

      return config.provider.send({
        to: options.to,
        from,
        subject: options.subject,
        html,
        text,
      });
    },
  };
}
