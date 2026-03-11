export class EmailDeliveryError extends Error {
  readonly provider: string;
  readonly statusCode?: number;
  readonly response?: string;

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
