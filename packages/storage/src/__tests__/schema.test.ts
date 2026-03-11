import { describe, it, expect } from "vitest";
import { parseSize, filetype } from "../schema.js";

describe("parseSize", () => {
  it("parses bytes", () => {
    expect(parseSize("100b")).toBe(100);
    expect(parseSize("0b")).toBe(0);
  });

  it("parses kilobytes", () => {
    expect(parseSize("1kb")).toBe(1024);
    expect(parseSize("1.5kb")).toBe(1536);
  });

  it("parses megabytes", () => {
    expect(parseSize("2mb")).toBe(2 * 1024 * 1024);
    expect(parseSize("10mb")).toBe(10 * 1024 * 1024);
  });

  it("parses gigabytes", () => {
    expect(parseSize("1gb")).toBe(1024 * 1024 * 1024);
  });

  it("is case insensitive", () => {
    expect(parseSize("2MB")).toBe(2 * 1024 * 1024);
    expect(parseSize("1Kb")).toBe(1024);
  });

  it("throws on invalid format", () => {
    expect(() => parseSize("abc")).toThrow();
    expect(() => parseSize("")).toThrow();
    expect(() => parseSize("10")).toThrow();
  });
});

describe("filetype", () => {
  it("returns the config with defaults applied", () => {
    const config = filetype({
      bucket: "UPLOADS",
      accept: ["image/jpeg", "image/png"],
      maxSize: "2mb",
      key: (file) => `images/${file.name}`,
    });

    expect(config.bucket).toBe("UPLOADS");
    expect(config.accept).toEqual(["image/jpeg", "image/png"]);
    expect(config.maxSize).toBe("2mb");
    expect(config.uploadable).toBe(true);
    expect(config.multipartThreshold).toBe("5mb");
    expect(config.partSize).toBe("10mb");
    expect(config.replace).toBe(false);
  });

  it("respects explicit overrides", () => {
    const config = filetype({
      bucket: "DOCS",
      accept: ["application/pdf"],
      maxSize: "50mb",
      key: (file) => file.name,
      uploadable: false,
      replace: true,
      multipartThreshold: "20mb",
      partSize: "5mb",
    });

    expect(config.uploadable).toBe(false);
    expect(config.replace).toBe(true);
    expect(config.multipartThreshold).toBe("20mb");
    expect(config.partSize).toBe("5mb");
  });
});
