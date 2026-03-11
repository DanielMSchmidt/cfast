import { describe, it, expect, vi } from "vitest";
import { directPut, multipartUpload, replaceExisting } from "../upload.js";
import { createMockR2Bucket } from "./helpers.js";

describe("directPut", () => {
  it("uploads stream to R2 with correct key and content type", async () => {
    const bucket = createMockR2Bucket();
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const result = await directPut(bucket, "avatars/user1/photo.jpg", stream, "image/jpeg");

    expect(bucket.put).toHaveBeenCalledWith(
      "avatars/user1/photo.jpg",
      expect.anything(),
      { httpMetadata: { contentType: "image/jpeg" } },
    );
    expect(result.key).toBe("avatars/user1/photo.jpg");
  });
});

describe("multipartUpload", () => {
  it("creates multipart upload for large streams", async () => {
    const bucket = createMockR2Bucket();
    // Create a stream with 3 chunks of 10 bytes each (partSize=10)
    const chunk = new Uint8Array(10);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(chunk));
        controller.enqueue(new Uint8Array(chunk));
        controller.enqueue(new Uint8Array(chunk));
        controller.close();
      },
    });

    const result = await multipartUpload(bucket, "docs/big-file.pdf", stream, "application/pdf", {
      partSize: 10,
      concurrency: 1,
    });

    expect(bucket.createMultipartUpload).toHaveBeenCalledWith("docs/big-file.pdf", {
      httpMetadata: { contentType: "application/pdf" },
    });
    expect(result.key).toBe("docs/big-file.pdf");
  });

  it("aborts upload on part failure", async () => {
    const bucket = createMockR2Bucket();
    const mockUpload = {
      key: "test.pdf",
      uploadId: "mock-id",
      uploadPart: vi.fn().mockRejectedValue(new Error("R2 error")),
      complete: vi.fn(),
      abort: vi.fn(),
    };
    (bucket.createMultipartUpload as ReturnType<typeof vi.fn>).mockResolvedValue(mockUpload);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(100));
        controller.close();
      },
    });

    await expect(
      multipartUpload(bucket, "test.pdf", stream, "application/pdf", { partSize: 10, concurrency: 1 }),
    ).rejects.toThrow();

    expect(mockUpload.abort).toHaveBeenCalled();
  });
});

describe("replaceExisting", () => {
  it("deletes objects matching prefix", async () => {
    const bucket = createMockR2Bucket({
      listResult: {
        objects: [
          { key: "avatars/user1/old-photo.jpg" } as R2Object,
          { key: "avatars/user1/older-photo.png" } as R2Object,
        ],
        truncated: false,
      } as R2Objects,
    });

    await replaceExisting(bucket, "avatars/user1/");

    expect(bucket.list).toHaveBeenCalledWith({ prefix: "avatars/user1/" });
    expect(bucket.delete).toHaveBeenCalledWith([
      "avatars/user1/old-photo.jpg",
      "avatars/user1/older-photo.png",
    ]);
  });

  it("skips delete when no existing objects", async () => {
    const bucket = createMockR2Bucket({
      listResult: { objects: [], truncated: false } as R2Objects,
    });

    await replaceExisting(bucket, "avatars/user2/");

    expect(bucket.delete).not.toHaveBeenCalled();
  });
});
