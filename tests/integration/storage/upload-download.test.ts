import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { defineStorage, filetype } from "@cfast/storage";

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const storage = defineStorage({
  avatar: filetype({
    bucket: "UPLOADS",
    accept: ["image/png", "image/jpeg"],
    maxSize: "2mb",
    key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
  }),
});

function makeUploadRequest(
  fileName: string,
  bytes: Uint8Array,
  mimeType: string,
): Request {
  const file = new File([bytes], fileName, { type: mimeType });
  const form = new FormData();
  form.append("file", file);
  return new Request("http://localhost/upload", {
    method: "POST",
    body: form,
  });
}

const ctx = {
  env: env as unknown as Record<string, unknown>,
  user: { id: "user-1" },
};

describe("upload-download", () => {
  beforeEach(async () => {
    // Clean up bucket before each test
    const listed = await env.UPLOADS.list({ prefix: "avatars/user-1/" });
    if (listed.objects.length > 0) {
      await env.UPLOADS.delete(listed.objects.map((o) => o.key));
    }
  });

  it("upload via handle() lands in R2 and returns { key, size, type }", async () => {
    const request = makeUploadRequest("photo.png", pngBytes, "image/png");
    const result = await storage.handle("avatar", request, ctx);

    expect(result.key).toBe("avatars/user-1/photo.png");
    expect(result.size).toBe(pngBytes.byteLength);
    expect(result.type).toBe("image/png");

    // Verify the file actually landed in R2
    const obj = await env.UPLOADS.get("avatars/user-1/photo.png");
    expect(obj).not.toBeNull();
    expect(obj!.size).toBe(pngBytes.byteLength);
  });

  it("serve() streams back matching content", async () => {
    // First upload the file
    const request = makeUploadRequest("photo.png", pngBytes, "image/png");
    await storage.handle("avatar", request, ctx);

    // Now serve it
    const response = await storage.serve("avatar", "avatars/user-1/photo.png", {
      env: env as unknown as Record<string, unknown>,
    });

    expect(response.status).toBe(200);
    const body = new Uint8Array(await response.arrayBuffer());
    expect(body).toEqual(pngBytes);
  });
});
