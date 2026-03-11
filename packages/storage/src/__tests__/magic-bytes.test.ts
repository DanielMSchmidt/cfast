import { describe, it, expect } from "vitest";
import { detectMimeType, SIGNATURES, type MagicSignature } from "../magic-bytes.js";

describe("SIGNATURES", () => {
  it("has entries for common image types", () => {
    expect(SIGNATURES.some((s: MagicSignature) => s.mime === "image/jpeg")).toBe(true);
    expect(SIGNATURES.some((s: MagicSignature) => s.mime === "image/png")).toBe(true);
    expect(SIGNATURES.some((s: MagicSignature) => s.mime === "image/webp")).toBe(true);
    expect(SIGNATURES.some((s: MagicSignature) => s.mime === "image/gif")).toBe(true);
    expect(SIGNATURES.some((s: MagicSignature) => s.mime === "application/pdf")).toBe(true);
  });
});

describe("detectMimeType", () => {
  it("detects JPEG", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00]);
    expect(detectMimeType(bytes)).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMimeType(bytes)).toBe("image/png");
  });

  it("detects WebP", () => {
    // RIFF....WEBP
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectMimeType(bytes)).toBe("image/webp");
  });

  it("detects GIF", () => {
    // GIF89a
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(detectMimeType(bytes)).toBe("image/gif");
  });

  it("detects PDF", () => {
    // %PDF
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(detectMimeType(bytes)).toBe("application/pdf");
  });

  it("returns null for unknown bytes", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectMimeType(bytes)).toBeNull();
  });

  it("returns null for empty input", () => {
    const bytes = new Uint8Array(0);
    expect(detectMimeType(bytes)).toBeNull();
  });
});
