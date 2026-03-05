import { describe, it, expect } from "vitest";
import { validateBinding } from "../validators";

describe("validateBinding", () => {
  describe("d1", () => {
    it("passes for object with prepare()", () => {
      const fake = { prepare: () => {}, dump: () => {}, batch: () => {}, exec: () => {} };
      expect(validateBinding("DB", { type: "d1" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("DB", { type: "d1" }, undefined);
      expect(result).toEqual({ key: "DB", message: expect.stringContaining("Missing") });
    });

    it("fails for wrong type", () => {
      const result = validateBinding("DB", { type: "d1" }, "not-a-d1");
      expect(result).toEqual({ key: "DB", message: expect.stringContaining("Expected D1") });
    });
  });

  describe("kv", () => {
    it("passes for object with get() and put()", () => {
      const fake = { get: () => {}, put: () => {}, delete: () => {}, list: () => {} };
      expect(validateBinding("CACHE", { type: "kv" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("CACHE", { type: "kv" }, undefined);
      expect(result).toEqual({ key: "CACHE", message: expect.stringContaining("Missing") });
    });
  });

  describe("r2", () => {
    it("passes for object with put() and head()", () => {
      const fake = { put: () => {}, get: () => {}, head: () => {}, delete: () => {}, list: () => {} };
      expect(validateBinding("UPLOADS", { type: "r2" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("UPLOADS", { type: "r2" }, undefined);
      expect(result).toEqual({ key: "UPLOADS", message: expect.stringContaining("Missing") });
    });
  });

  describe("queue", () => {
    it("passes for object with send()", () => {
      const fake = { send: () => {}, sendBatch: () => {} };
      expect(validateBinding("Q", { type: "queue" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("Q", { type: "queue" }, undefined);
      expect(result).toEqual({ key: "Q", message: expect.stringContaining("Missing") });
    });
  });

  describe("durable-object", () => {
    it("passes for object with get() and idFromName()", () => {
      const fake = { get: () => {}, idFromName: () => {}, idFromString: () => {}, newUniqueId: () => {} };
      expect(validateBinding("DO", { type: "durable-object" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("DO", { type: "durable-object" }, undefined);
      expect(result).toEqual({ key: "DO", message: expect.stringContaining("Missing") });
    });
  });

  describe("service", () => {
    it("passes for object with fetch()", () => {
      const fake = { fetch: () => {} };
      expect(validateBinding("SVC", { type: "service" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("SVC", { type: "service" }, undefined);
      expect(result).toEqual({ key: "SVC", message: expect.stringContaining("Missing") });
    });
  });

  describe("secret", () => {
    it("passes for non-empty string", () => {
      expect(validateBinding("KEY", { type: "secret" }, "abc123")).toBeUndefined();
    });

    it("fails for empty string", () => {
      const result = validateBinding("KEY", { type: "secret" }, "");
      expect(result).toEqual({ key: "KEY", message: expect.stringContaining("empty") });
    });

    it("fails for missing", () => {
      const result = validateBinding("KEY", { type: "secret" }, undefined);
      expect(result).toEqual({ key: "KEY", message: expect.stringContaining("Missing") });
    });
  });

  describe("var", () => {
    it("passes for string", () => {
      expect(validateBinding("APP_URL", { type: "var" }, "http://localhost")).toBeUndefined();
    });

    it("passes for empty string (empty is allowed for var)", () => {
      expect(validateBinding("APP_URL", { type: "var" }, "")).toBeUndefined();
    });

    it("fails when missing and no default", () => {
      const result = validateBinding("APP_URL", { type: "var" }, undefined);
      expect(result).toEqual({ key: "APP_URL", message: expect.stringContaining("Missing") });
    });

    it("passes when missing but has default", () => {
      expect(validateBinding("APP_URL", { type: "var", default: "http://localhost" }, undefined)).toBeUndefined();
    });

    it("fails when validate returns false", () => {
      const def = { type: "var" as const, validate: (v: string) => v === "yes" };
      const result = validateBinding("FLAG", def, "no");
      expect(result).toEqual({ key: "FLAG", message: expect.stringContaining("failed validation") });
    });

    it("passes when validate returns true", () => {
      const def = { type: "var" as const, validate: (v: string) => v === "yes" };
      expect(validateBinding("FLAG", def, "yes")).toBeUndefined();
    });
  });
});
