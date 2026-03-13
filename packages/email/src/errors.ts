/**
 * Error thrown when an {@link EmailProvider} fails to deliver a message.
 *
 * Contains provider-specific context such as the HTTP status code and raw
 * response body for debugging delivery failures.
 *
 * @example
 * ```ts
 * import { EmailDeliveryError } from "@cfast/email";
 *
 * try {
 *   await email.send({ to, subject, react: <Template /> });
 * } catch (error) {
 *   if (error instanceof EmailDeliveryError) {
 *     console.error(error.provider);    // "mailgun"
 *     console.error(error.statusCode);  // 401
 *     console.error(error.response);    // "Unauthorized"
 *   }
 * }
 * ```
 */
export class EmailDeliveryError extends Error {
  /** The name of the provider that failed (e.g. `"mailgun"`). */
  readonly provider: string;
  /** HTTP status code returned by the provider's API, if available. */
  readonly statusCode?: number;
  /** Raw response body from the provider's API, if available. */
  readonly response?: string;

  /**
   * @param message - Human-readable error description.
   * @param options - Provider context for the failure.
   */
  constructor(
    message: string,
    options: { provider: string; statusCode?: number; response?: string },
  ) {
    super(message);
    this.name = "EmailDeliveryError";
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.response = options.response;
  }
}
