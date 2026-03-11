import type { EmailMessage, EmailProvider } from "./types.js";

export function console(): EmailProvider {
  return {
    name: "console",

    async send(message: EmailMessage): Promise<{ id: string }> {
      const id = `console-${crypto.randomUUID()}`;

      globalThis.console.log(
        `\n[cfast/email] Email sent (dev mode):\n` +
        `  ID: ${id}\n` +
        `  To: ${message.to}\n` +
        `  From: ${message.from}\n` +
        `  Subject: ${message.subject}\n` +
        `  HTML: ${message.html.length} chars\n`,
      );

      return { id };
    },
  };
}
