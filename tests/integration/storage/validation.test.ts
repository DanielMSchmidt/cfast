import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { defineStorage, filetype, StorageError } from "@cfast/storage";
import { pngBytes, makeUploadRequest } from "../helpers/storage";

const jpegMagicBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

const storage = defineStorage({
  image: filetype({
    bucket: "UPLOADS",
    accept: ["image/png"],
    maxSize: "100b",
    key: (file, ctx) => `images/${ctx.user.id}/${file.name}`,
  }),
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

describe("validation", () => {
  it("rejects wrong MIME type detected via magic bytes", async () => {
    // Send JPEG bytes but claim image/png — content-type check passes,
    // but magic bytes detect image/jpeg which is not in accept for "image"
    const request = makeUploadRequest("fake.png", jpegMagicBytes, "image/png");

    await expect(storage.handle("image", request, ctx)).rejects.toThrow(
      StorageError,
    );

    try {
      await storage.handle(
        "image",
        makeUploadRequest("fake.png", jpegMagicBytes, "image/png"),
        ctx,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(StorageError);
      const storageErr = err as InstanceType<typeof StorageError>;
      expect(storageErr.code).toBe("INVALID_MIME_TYPE");
      expect(storageErr.status).toBe(415);
    }
  });

  it("rejects file exceeding maxSize", async () => {
    // The "image" filetype has maxSize: "100b" — our PNG is 67 bytes,
    // so build a file larger than 100 bytes
    const largePayload = new Uint8Array(200);
    // Start with valid PNG magic bytes so it passes magic byte detection
    largePayload.set(pngBytes);

    const request = makeUploadRequest("big.png", largePayload, "image/png");

    await expect(storage.handle("image", request, ctx)).rejects.toThrow(
      StorageError,
    );

    try {
      await storage.handle(
        "image",
        makeUploadRequest("big.png", largePayload, "image/png"),
        ctx,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(StorageError);
      const storageErr = err as InstanceType<typeof StorageError>;
      expect(storageErr.code).toBe("FILE_TOO_LARGE");
      expect(storageErr.status).toBe(413);
    }
  });

  it("accepts valid file within limits", async () => {
    const request = makeUploadRequest("ok.png", pngBytes, "image/png");
    const result = await storage.handle("avatar", request, ctx);

    expect(result.key).toBe("avatars/user-1/ok.png");
    expect(result.size).toBe(pngBytes.byteLength);
    expect(result.type).toBe("image/png");
  });
});
