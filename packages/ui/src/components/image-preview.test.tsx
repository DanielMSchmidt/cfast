// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ImagePreview } from "./image-preview.js";

afterEach(cleanup);

describe("ImagePreview", () => {
  it("renders image from direct src", () => {
    render(<ImagePreview src="https://example.com/img.png" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("https://example.com/img.png");
  });

  it("resolves src from fileKey + getUrl", () => {
    render(
      <ImagePreview
        fileKey="abc123"
        getUrl={(key: string) => `/files/${key}`}
      />,
    );
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("/files/abc123");
  });

  it("prefers direct src over fileKey", () => {
    render(
      <ImagePreview
        src="https://example.com/direct.png"
        fileKey="abc123"
        getUrl={(key: string) => `/files/${key}`}
      />,
    );
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("https://example.com/direct.png");
  });

  it("renders fallback when no image", () => {
    render(
      <ImagePreview
        fallback={<span>No photo</span>}
      />,
    );
    expect(screen.getByText("No photo")).toBeTruthy();
  });

  it("renders 'No image' text when no src and no fallback", () => {
    render(<ImagePreview />);
    expect(screen.getByText("No image")).toBeTruthy();
  });

  it("applies width and height", () => {
    render(
      <ImagePreview
        src="https://example.com/img.png"
        width={300}
        height={150}
      />,
    );
    const img = screen.getByRole("img");
    expect(img.style.width).toBe("300px");
    expect(img.style.height).toBe("150px");
  });
});
