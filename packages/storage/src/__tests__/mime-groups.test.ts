import { describe, it, expect } from "vitest";
import { filetype, defineStorage, parseSize } from "../schema.js";
import { StorageError } from "../errors.js";
import { createMockR2Bucket, createMockFormDataRequest } from "./helpers.js";

describe("filetype() — per-mime form (#148)", () => {
  it("derives `accept` from the union of all group mime types", () => {
    const config = filetype(
      {
        image: { mimes: ["image/jpeg", "image/png"], maxSize: "10mb" },
        document: { mimes: ["application/pdf"], maxSize: "50mb" },
      },
      {
        bucket: "UPLOADS",
        key: (file: { name: string }) => `files/${file.name}`,
      },
    );

    expect(config.accept).toEqual([
      "image/jpeg",
      "image/png",
      "application/pdf",
    ]);
  });

  it("uses the largest group's maxSize as the top-level maxSize", () => {
    const config = filetype(
      {
        image: { mimes: ["image/jpeg"], maxSize: "10mb" },
        document: { mimes: ["application/pdf"], maxSize: "50mb" },
      },
      {
        bucket: "UPLOADS",
        key: (f: { name: string }) => f.name,
      },
    );
    expect(parseSize(config.maxSize)).toBe(parseSize("50mb"));
  });

  it("normalizes each group into a MimeGroup with pre-parsed maxSizeBytes", () => {
    const config = filetype(
      {
        image: { mimes: ["image/jpeg"], maxSize: "2mb" },
        document: { mimes: ["application/pdf"], maxSize: "50mb" },
      },
      {
        bucket: "UPLOADS",
        key: (f: { name: string }) => f.name,
      },
    );
    expect(config.mimeGroups).toHaveLength(2);
    expect(config.mimeGroups?.[0].maxSizeBytes).toBe(parseSize("2mb"));
    expect(config.mimeGroups?.[1].maxSizeBytes).toBe(parseSize("50mb"));
  });

  it("preserves backwards-compat defaults for uploadable/replace/partSize", () => {
    const config = filetype(
      { image: { mimes: ["image/jpeg"], maxSize: "2mb" } },
      {
        bucket: "UPLOADS",
        key: (f: { name: string }) => f.name,
      },
    );
    expect(config.uploadable).toBe(true);
    expect(config.replace).toBe(false);
    expect(config.multipartThreshold).toBe("5mb");
    expect(config.partSize).toBe("10mb");
  });

  it("requires a second options argument in the per-mime form", () => {
    expect(() =>
      (filetype as unknown as (g: unknown) => unknown)({
        image: { mimes: ["image/jpeg"], maxSize: "2mb" },
      }),
    ).toThrow();
  });

  it("still accepts the single-limit legacy signature", () => {
    const config = filetype({
      bucket: "UPLOADS",
      accept: ["image/jpeg"],
      maxSize: "2mb",
      key: (f: { name: string }) => f.name,
    });
    expect(config.accept).toEqual(["image/jpeg"]);
    expect(config.mimeGroups).toBeUndefined();
  });

  it("rejects images over the image group's maxSize but accepts PDFs under the pdf group's maxSize", async () => {
    const storage = defineStorage({
      assets: filetype(
        {
          // Intentionally tiny image limit so a 200-byte fixture exceeds it.
          image: { mimes: ["image/jpeg"], maxSize: "100b" },
          document: { mimes: ["application/pdf"], maxSize: "10mb" },
        },
        {
          bucket: "UPLOADS",
          key: (f: { name: string }) => `assets/${f.name}`,
        },
      ),
    });

    const bigJpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, ...Array(200).fill(0x00),
    ]);
    const smallPdf = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, ...Array(20).fill(0x00),
    ]);

    // Image over limit — rejected with FILE_TOO_LARGE.
    const overLimitRequest = createMockFormDataRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      content: bigJpeg,
    });
    const bucket = createMockR2Bucket();
    await expect(
      storage.handle("assets", overLimitRequest, {
        env: { UPLOADS: bucket },
        user: { id: "u1" },
      }),
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof StorageError &&
        err.code === "FILE_TOO_LARGE" &&
        err.status === 413
      );
    });

    // PDF under limit — accepted.
    const okRequest = createMockFormDataRequest({
      name: "manual.pdf",
      type: "application/pdf",
      content: smallPdf,
    });
    const bucket2 = createMockR2Bucket();
    const result = await storage.handle("assets", okRequest, {
      env: { UPLOADS: bucket2 },
      user: { id: "u1" },
    });
    expect(result.key).toBe("assets/manual.pdf");
    expect(bucket2.put).toHaveBeenCalled();
  });
});

describe("storage.handle() — File overload (#180)", () => {
  it("accepts a pre-extracted File in place of a Request", async () => {
    const storage = defineStorage({
      photos: filetype({
        bucket: "UPLOADS",
        accept: ["image/jpeg"],
        maxSize: "5mb",
        key: (f: { name: string }, ctx: { user: { id: string } }) =>
          `photos/${ctx.user.id}/${f.name}`,
      }),
    });

    const jpegData = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, ...Array(200).fill(0x00),
    ]);
    const file = new File([jpegData as unknown as BlobPart], "vacation.jpg", {
      type: "image/jpeg",
    });

    const bucket = createMockR2Bucket();
    const result = await storage.handle("photos", file, {
      env: { UPLOADS: bucket },
      user: { id: "user-42" },
    });

    expect(result.key).toBe("photos/user-42/vacation.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(bucket.put).toHaveBeenCalled();
  });

  it("lets the caller consume the request body once before uploading", async () => {
    const storage = defineStorage({
      photos: filetype({
        bucket: "UPLOADS",
        accept: ["image/jpeg"],
        maxSize: "5mb",
        key: (f: { name: string }) => `photos/${f.name}`,
      }),
    });

    // Simulate a real form: a file + a text field the route action needs.
    const jpegData = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, ...Array(50).fill(0x00),
    ]);
    const formData = new FormData();
    formData.append(
      "photo",
      new Blob([jpegData as unknown as BlobPart], { type: "image/jpeg" }),
      "sunset.jpg",
    );
    formData.append("title", "Sunset over the lake");

    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    // The route action parses formData itself to read `title`, then hands the
    // File to `storage.handle()` — exactly the pattern #180 enables.
    const parsed = await request.formData();
    const photo = parsed.get("photo");
    const title = parsed.get("title");

    expect(photo).toBeInstanceOf(File);
    expect(title).toBe("Sunset over the lake");

    const bucket = createMockR2Bucket();
    const result = await storage.handle("photos", photo as File, {
      env: { UPLOADS: bucket },
      user: { id: "u1" },
    });
    expect(result.key).toBe("photos/sunset.jpg");
  });
});
