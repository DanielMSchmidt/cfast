import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { defineStorage, filetype } from "@cfast/storage";
import type { FileInfo, UploadResult, HandleContext } from "@cfast/storage";
import { pngBytes, makeUploadRequest } from "../helpers/storage";

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
