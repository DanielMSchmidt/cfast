import { describe, it, expect } from "vitest";
import { parseRequest } from "../parse.js";
import { createMockFormDataRequest } from "./helpers.js";

describe("parseRequest", () => {
  it("extracts file from multipart form data", async () => {
    const content = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
    const request = createMockFormDataRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      content,
    });

    const file = await parseRequest(request);

    expect(file.name).toBe("photo.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(file.extension).toBe("jpg");
  });

  it("throws when no file is present in form data", async () => {
    const formData = new FormData();
    formData.append("text", "not a file");
    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    await expect(parseRequest(request)).rejects.toThrow("No file found");
  });

  it("extracts extension from filename", async () => {
    const request = createMockFormDataRequest({
      name: "document.report.pdf",
      type: "application/pdf",
      content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    });

    const file = await parseRequest(request);
    expect(file.extension).toBe("pdf");
  });
});
