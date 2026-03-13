import type { EmailMessage, EmailProvider } from "./types.js";

/**
 * Create a development-only {@link EmailProvider} that logs email details to the console.
 *
 * No emails are actually sent. Returns a message ID of the form `"console-{uuid}"`.
 * Useful for local development without configuring a real email service.
 *
 * @returns An {@link EmailProvider} that logs to the console.
 *
 * @example
 * ```ts
 * import { console as consoleDev } from "@cfast/email/console";
 *
 * const provider = consoleDev();
 * // Logs: [cfast/email] Email sent (dev mode): ...
 * ```
 */
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
