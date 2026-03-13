import { describe, it, expect } from "vitest";
import { EmailDeliveryError } from "@cfast/email";

describe("provider-errors", () => {
  it("EmailDeliveryError carries provider metadata", () => {
    const err = new EmailDeliveryError("Gateway timeout", {
      provider: "failing-provider",
      statusCode: 504,
      response: "upstream timeout",
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(EmailDeliveryError);
    expect(err.name).toBe("EmailDeliveryError");
    expect(err.message).toBe("Gateway timeout");
    expect(err.provider).toBe("failing-provider");
    expect(err.statusCode).toBe(504);
    expect(err.response).toBe("upstream timeout");

    // Optional fields should be omittable
    const minimalErr = new EmailDeliveryError("Send failed", {
      provider: "test",
    });
    expect(minimalErr.statusCode).toBeUndefined();
    expect(minimalErr.response).toBeUndefined();
    expect(minimalErr.provider).toBe("test");
  });
});
