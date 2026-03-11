import { describe, it, expect } from "vitest";
import { StorageError } from "../errors.js";
import {
  validateContentType,
  validateContentLength,
  validateMagicBytes,
  createByteCountingStream,
} from "../validation.js";

describe("validateContentType", () => {
  it("passes for accepted MIME type", () => {
    expect(() =>
      validateContentType("image/jpeg", ["image/jpeg", "image/png"]),
    ).not.toThrow();
  });

  it("throws INVALID_MIME_TYPE for rejected type", () => {
    expect(() =>
      validateContentType("image/bmp", ["image/jpeg", "image/png"]),
    ).toThrow(StorageError);

    try {
      validateContentType("image/bmp", ["image/jpeg", "image/png"]);
    } catch (e) {
      expect((e as StorageError).code).toBe("INVALID_MIME_TYPE");
      expect((e as StorageError).status).toBe(415);
    }
  });

  it("throws for missing content type", () => {
    expect(() => validateContentType(null, ["image/jpeg"])).toThrow(StorageError);
  });
});

describe("validateContentLength", () => {
  it("passes when under limit", () => {
    expect(() => validateContentLength(1000, 2000)).not.toThrow();
  });

  it("passes when at limit", () => {
    expect(() => validateContentLength(2000, 2000)).not.toThrow();
  });

  it("throws FILE_TOO_LARGE when over limit", () => {
    expect(() => validateContentLength(3000, 2000)).toThrow(StorageError);

    try {
      validateContentLength(3000, 2000);
    } catch (e) {
      expect((e as StorageError).code).toBe("FILE_TOO_LARGE");
      expect((e as StorageError).status).toBe(413);
    }
  });

  it("skips check when size is null (unknown)", () => {
    expect(() => validateContentLength(null, 2000)).not.toThrow();
  });
});

describe("validateMagicBytes", () => {
  it("passes when magic bytes match accepted type", async () => {
    // JPEG magic bytes
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00)]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const result = await validateMagicBytes(stream, ["image/jpeg", "image/png"]);
    expect(result.validated).toBe(true);

    // The returned stream should still contain all original bytes
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const read = await reader.read();
      if (read.value) chunks.push(read.value);
      done = read.done;
    }
    const total = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      total.set(chunk, offset);
      offset += chunk.length;
    }
    expect(total.length).toBe(data.length);
    expect(total[0]).toBe(0xff);
    expect(total[1]).toBe(0xd8);
  });

  it("throws INVALID_MIME_TYPE when bytes don't match accepted types", async () => {
    // PNG magic bytes but only JPEG accepted
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(50).fill(0x00)]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    await expect(validateMagicBytes(stream, ["image/jpeg"])).rejects.toThrow(StorageError);
  });

  it("skips validation for unknown MIME types", async () => {
    // Random bytes, accepting application/msword (no known magic)
    const data = new Uint8Array([0x01, 0x02, 0x03, ...Array(50).fill(0x00)]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const result = await validateMagicBytes(stream, ["application/msword"]);
    expect(result.validated).toBe(false); // skipped, not validated
  });
});

describe("createByteCountingStream", () => {
  it("counts bytes passing through", async () => {
    const data = new Uint8Array(1500);
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const { stream, getByteCount } = createByteCountingStream(source, 2000);

    const reader = stream.getReader();
    while (!(await reader.read()).done) {}

    expect(getByteCount()).toBe(1500);
  });

  it("throws FILE_TOO_LARGE when exceeding limit", async () => {
    const chunk1 = new Uint8Array(1500);
    const chunk2 = new Uint8Array(1000);
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const { stream } = createByteCountingStream(source, 2000);
    const reader = stream.getReader();

    await expect(async () => {
      while (!(await reader.read()).done) {}
    }).rejects.toThrow(StorageError);
  });
});
