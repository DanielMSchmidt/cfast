import type { ReactElement } from "react";

/**
 * A fully rendered email message ready for delivery by an {@link EmailProvider}.
 *
 * Contains the rendered HTML and plain-text bodies (produced from the React element),
 * along with addressing and subject metadata.
 */
export type EmailMessage = {
  /** Recipient email address. */
  to: string;
  /** Sender address (e.g. `"MyApp <noreply@example.com>"`). */
  from: string;
  /** Email subject line. */
  subject: string;
  /** HTML body rendered from the react-email component. */
  html: string;
  /** Plain-text body rendered from the react-email component. */
  text: string;
};

/**
 * A pluggable email delivery backend.
 *
 * Implement this interface to add support for a new email service. The provider
 * receives a fully rendered {@link EmailMessage} and is responsible for delivering
 * it via the service's HTTP API.
 *
 * @example
 * ```ts
 * import type { EmailProvider, EmailMessage } from "@cfast/email";
 *
 * const myProvider: EmailProvider = {
 *   name: "my-provider",
 *   async send(message: EmailMessage) {
 *     const res = await fetch("https://api.example.com/send", {
 *       method: "POST",
 *       body: JSON.stringify(message),
 *     });
 *     const data = await res.json() as { id: string };
 *     return { id: data.id };
 *   },
 * };
 * ```
 */
export type EmailProvider = {
  /** Unique name identifying the provider (e.g. `"mailgun"`, `"console"`). */
  name: string;
  /** Deliver a rendered email message. Returns a provider-specific message ID. */
  send: (message: EmailMessage) => Promise<{ id: string }>;
};

/**
 * Configuration for {@link createEmailClient}.
 *
 * Both `provider` and `from` accept either a static value or a getter function.
 * Getter functions are called lazily at send time, which is the Workers-friendly
 * pattern for accessing env bindings that are not available at module scope.
 */
export type EmailClientConfig = {
  /**
   * The delivery backend, or a getter that returns one.
   * Use a getter when the provider needs env bindings resolved at send time.
   */
  provider: EmailProvider | (() => EmailProvider);
  /**
   * Default sender address, or a getter that returns one.
   * Can be overridden per-message via {@link SendOptions.from}.
   */
  from: string | (() => string);
};

/**
 * Options passed to {@link EmailClient.send} to compose and deliver an email.
 */
export type SendOptions = {
  /** Recipient email address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** A react-email component to render as the email body (HTML + plain text). */
  react: ReactElement;
  /** Override the default sender address for this message. */
  from?: string;
};

/**
 * An email client instance returned by {@link createEmailClient}.
 *
 * Renders react-email components and delivers them through the configured
 * {@link EmailProvider}.
 */
export type EmailClient = {
  /**
   * Render a react-email component and send the resulting email.
   *
   * @param options - The message details including recipient, subject, and React template.
   * @returns The provider-specific message ID.
   */
  send: (options: SendOptions) => Promise<{ id: string }>;
};
