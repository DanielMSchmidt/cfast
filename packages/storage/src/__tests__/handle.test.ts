import { describe, it, expect } from "vitest";
import { defineStorage, filetype } from "../schema.js";
import { StorageError } from "../errors.js";
import { createMockR2Bucket, createMockFormDataRequest } from "./helpers.js";

describe("defineStorage", () => {
  const schema = {
    avatars: filetype({
      bucket: "UPLOADS",
      accept: ["image/jpeg", "image/png"] as const,
      maxSize: "2mb",
      key: (file: { name: string; extension: string }, ctx: { user: { id: string }; input: Record<string, unknown> }) => `avatars/${ctx.user.id}/${file.name}`,
      replace: true,
    }),
    documents: filetype({
      bucket: "DOCUMENTS",
      accept: ["application/pdf"] as const,
      maxSize: "50mb",
      key: (file: { name: string; extension: string }) => `docs/${file.name}`,
      publicUrl: "https://cdn.example.com",
    }),
  };

  it("returns an object with handle, serve, getPublicUrl, getSignedUrl, verifySignedUrl, clientConfig", () => {
    const storage = defineStorage(schema);

    expect(typeof storage.handle).toBe("function");
    expect(typeof storage.serve).toBe("function");
    expect(typeof storage.getPublicUrl).toBe("function");
    expect(typeof storage.getSignedUrl).toBe("function");
    expect(typeof storage.verifySignedUrl).toBe("function");
    expect(typeof storage.clientConfig).toBe("function");
  });

  describe("clientConfig", () => {
    it("returns client-safe config for all filetypes", () => {
      const storage = defineStorage(schema);
      const config = storage.clientConfig();

      expect(config.avatars).toEqual({
        accept: ["image/jpeg", "image/png"],
        maxSize: "2mb",
        maxSizeBytes: 2 * 1024 * 1024,
      });

      expect(config.documents).toEqual({
        accept: ["application/pdf"],
        maxSize: "50mb",
        maxSizeBytes: 50 * 1024 * 1024,
      });
    });
  });

  describe("getPublicUrl", () => {
    it("returns the public URL for a key", () => {
      const storage = defineStorage(schema);
      const url = storage.getPublicUrl("documents", "docs/report.pdf");
      expect(url).toBe("https://cdn.example.com/docs/report.pdf");
    });

    it("throws when filetype has no publicUrl", () => {
      const storage = defineStorage(schema);
      expect(() => storage.getPublicUrl("avatars", "test")).toThrow("publicUrl");
    });
  });

  describe("handle", () => {
    it("uploads a valid file", async () => {
      const storage = defineStorage(schema);
      // JPEG magic bytes + some data
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00),
      ]);

      const request = createMockFormDataRequest({
        name: "photo.jpg",
        type: "image/jpeg",
        content: jpegData,
      });

      const bucket = createMockR2Bucket();
      const result = await storage.handle("avatars", request, {
        env: { UPLOADS: bucket },
        user: { id: "user-1" },
      });

      expect(result.key).toBe("avatars/user-1/photo.jpg");
      expect(result.type).toBe("image/jpeg");
      expect(bucket.put).toHaveBeenCalled();
    });

    it("rejects invalid MIME type", async () => {
      const storage = defineStorage(schema);
      const request = createMockFormDataRequest({
        name: "doc.txt",
        type: "text/plain",
        content: new Uint8Array([0x01, 0x02]),
      });

      const bucket = createMockR2Bucket();
      await expect(
        storage.handle("avatars", request, {
          env: { UPLOADS: bucket },
          user: { id: "user-1" },
        }),
      ).rejects.toThrow(StorageError);
    });

    it("calls replace when replace is true", async () => {
      const storage = defineStorage(schema);
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00),
      ]);
      const request = createMockFormDataRequest({
        name: "photo.jpg",
        type: "image/jpeg",
        content: jpegData,
      });

      const bucket = createMockR2Bucket({
        listResult: {
          objects: [{ key: "avatars/user-1/old.jpg" } as R2Object],
          delimitedPrefixes: [],
          truncated: false,
        } as unknown as R2Objects,
      });

      await storage.handle("avatars", request, {
        env: { UPLOADS: bucket },
        user: { id: "user-1" },
      });

      expect(bucket.list).toHaveBeenCalled();
      expect(bucket.delete).toHaveBeenCalledWith(["avatars/user-1/old.jpg"]);
    });
  });
});
