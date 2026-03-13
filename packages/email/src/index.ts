/** @module email */
export { createEmailClient } from "./create-email-client.js";
export { EmailDeliveryError } from "./errors.js";
export type {
  EmailClient,
  EmailClientConfig,
  EmailMessage,
  EmailProvider,
  SendOptions,
} from "./types.js";
