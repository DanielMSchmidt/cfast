import { describe, it, expect } from "vitest";
import { defineEnv } from "@cfast/env";

describe("environment-defaults", () => {
  it("picks correct default based on ENVIRONMENT binding", () => {
    const appEnv = defineEnv({
      API_URL: {
        type: "var",
        default: {
          development: "http://localhost:3000",
          staging: "https://staging.example.com",
          production: "https://api.example.com",
        },
      },
    });

    appEnv.init({ ENVIRONMENT: "staging" });
    expect(appEnv.get().API_URL).toBe("https://staging.example.com");
  });

  it("uses development default when ENVIRONMENT not set", () => {
    const appEnv = defineEnv({
      API_URL: {
        type: "var",
        default: {
          development: "http://localhost:3000",
          staging: "https://staging.example.com",
          production: "https://api.example.com",
        },
      },
    });

    // No ENVIRONMENT => defaults to "development"
    appEnv.init({});
    expect(appEnv.get().API_URL).toBe("http://localhost:3000");
  });

  it("simple string default used", () => {
    const appEnv = defineEnv({
      LOG_LEVEL: {
        type: "var",
        default: "info",
      },
    });

    appEnv.init({});
    expect(appEnv.get().LOG_LEVEL).toBe("info");
  });
});
