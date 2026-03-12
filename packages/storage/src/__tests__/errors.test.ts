import { describe, it, expect } from "vitest";
import { StorageError } from "../errors.js";

describe("StorageError", () => {
  it("creates FILE_TOO_LARGE error with status 413", () => {
    const err = new StorageError({
      code: "FILE_TOO_LARGE",
      detail: "File is 5.2MB but avatars allows max 2MB",
      status: 413,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("StorageError");
    expect(err.code).toBe("FILE_TOO_LARGE");
    expect(err.detail).toBe("File is 5.2MB but avatars allows max 2MB");
    expect(err.status).toBe(413);
    expect(err.message).toBe("File is 5.2MB but avatars allows max 2MB");
  });

  it("creates INVALID_MIME_TYPE error with status 415", () => {
    const err = new StorageError({
      code: "INVALID_MIME_TYPE",
      detail: "image/bmp is not accepted, allowed: image/jpeg, image/png",
      status: 415,
    });

    expect(err.code).toBe("INVALID_MIME_TYPE");
    expect(err.status).toBe(415);
  });

  it("creates UPLOAD_FAILED error with status 500", () => {
    const err = new StorageError({
      code: "UPLOAD_FAILED",
      detail: "R2 upload failed: connection reset",
      status: 500,
    });

    expect(err.code).toBe("UPLOAD_FAILED");
    expect(err.status).toBe(500);
  });
});
