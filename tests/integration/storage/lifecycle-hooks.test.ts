import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { defineStorage, filetype } from "@cfast/storage";
import type { FileInfo, UploadResult, HandleContext } from "@cfast/storage";

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

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

describe("lifecycle-hooks", () => {
  it("beforeUpload and afterUpload called with correct args", async () => {
    let capturedBefore: { file: FileInfo; ctx: HandleContext } | null = null;
    let capturedAfter: { result: UploadResult; ctx: HandleContext } | null =
      null;

    const storage = defineStorage({
      doc: filetype({
        bucket: "UPLOADS",
        accept: ["image/png"],
        maxSize: "5mb",
        key: (file, ctx) => `docs/${ctx.user.id}/${file.name}`,
        hooks: {
          beforeUpload: async (file, ctx) => {
            capturedBefore = { file, ctx };
          },
          afterUpload: async (result, ctx) => {
            capturedAfter = { result, ctx };
          },
        },
      }),
    });

    const ctx = {
      env: env as unknown as Record<string, unknown>,
      user: { id: "hook-user" },
    };

    const request = makeUploadRequest("test.png", pngBytes, "image/png");
    const result = await storage.handle("doc", request, ctx);

    // beforeUpload assertions
    expect(capturedBefore).not.toBeNull();
    expect(capturedBefore!.file.name).toBe("test.png");
    expect(capturedBefore!.file.extension).toBe("png");
    expect(capturedBefore!.file.type).toBe("image/png");
    expect(capturedBefore!.file.size).toBe(pngBytes.byteLength);
    expect(capturedBefore!.ctx.user.id).toBe("hook-user");

    // afterUpload assertions
    expect(capturedAfter).not.toBeNull();
    expect(capturedAfter!.result.key).toBe("docs/hook-user/test.png");
    expect(capturedAfter!.result.size).toBe(pngBytes.byteLength);
    expect(capturedAfter!.result.type).toBe("image/png");
    expect(capturedAfter!.ctx.user.id).toBe("hook-user");

    // result should match afterUpload's result
    expect(result).toEqual(capturedAfter!.result);
  });
});
