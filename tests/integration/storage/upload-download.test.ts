import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { defineStorage, filetype } from "@cfast/storage";
import { pngBytes, makeUploadRequest } from "../helpers/storage";

const storage = defineStorage({
  avatar: filetype({
    bucket: "UPLOADS",
    accept: ["image/png", "image/jpeg"],
    maxSize: "2mb",
    key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
  }),
});

const ctx = {
  env: env as unknown as Record<string, unknown>,
  user: { id: "user-1" },
};

describe("upload-download", () => {
  beforeEach(async () => {
    // Clean up bucket before each test
    const listed = await env.UPLOADS.list({ prefix: "avatars/user-1/" });
    if (listed.objects.length > 0) {
      await env.UPLOADS.delete(listed.objects.map((o: { key: string }) => o.key));
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
