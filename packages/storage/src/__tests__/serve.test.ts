import { describe, it, expect, vi } from "vitest";
import { serveFile, getPublicUrl, createSignedUrl, verifySignedUrl } from "../serve.js";
import { createMockR2Bucket } from "./helpers.js";

describe("serveFile", () => {
  it("returns a Response with the R2 object body", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("file content"));
        controller.close();
      },
    });

    const bucket = createMockR2Bucket({
      getResult: {
        body,
        httpMetadata: { contentType: "image/jpeg" },
        size: 12,
        key: "avatars/photo.jpg",
        writeHttpMetadata: vi.fn((headers: Headers) => {
          headers.set("content-type", "image/jpeg");
        }),
      } as unknown as R2ObjectBody,
    });

    const response = await serveFile(bucket, "avatars/photo.jpg");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe("12");
  });

  it("returns 404 when object not found", async () => {
    const bucket = createMockR2Bucket({ getResult: null });

    const response = await serveFile(bucket, "missing-key");
    expect(response.status).toBe(404);
  });

  it("merges custom headers", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.close(); },
    });

    const bucket = createMockR2Bucket({
      getResult: {
        body,
        httpMetadata: {},
        size: 0,
        key: "test.jpg",
        writeHttpMetadata: vi.fn(),
      } as unknown as R2ObjectBody,
    });

    const response = await serveFile(bucket, "test.jpg", {
      "Cache-Control": "public, max-age=31536000",
    });

    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000");
  });
});

describe("getPublicUrl", () => {
  it("constructs URL from base and key", () => {
    const url = getPublicUrl("https://cdn.example.com", "posts/123/photo.jpg");
    expect(url).toBe("https://cdn.example.com/posts/123/photo.jpg");
  });

  it("handles trailing slash on base URL", () => {
    const url = getPublicUrl("https://cdn.example.com/", "posts/photo.jpg");
    expect(url).toBe("https://cdn.example.com/posts/photo.jpg");
  });
});

describe("signed URLs", () => {
  const secret = "test-secret-key-for-hmac";

  it("creates and verifies a signed URL", async () => {
    const url = await createSignedUrl("posts", "posts/123/photo.jpg", secret, "1h");

    expect(url).toContain("posts/123/photo.jpg");
    expect(url).toContain("expires=");
    expect(url).toContain("sig=");

    const isValid = await verifySignedUrl(url, secret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered URLs", async () => {
    const url = await createSignedUrl("posts", "posts/123/photo.jpg", secret, "1h");

    // Tamper with the key
    const tampered = url.replace("photo.jpg", "other.jpg");

    const isValid = await verifySignedUrl(tampered, secret);
    expect(isValid).toBe(false);
  });

  it("rejects URLs with invalid signature", async () => {
    const isValid = await verifySignedUrl("/storage/posts/key?expires=9999999999&sig=invalid", secret);
    expect(isValid).toBe(false);
  });
});
