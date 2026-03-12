// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DropZone } from "./drop-zone.js";

vi.mock("../plugin.js", () => ({
  useComponent: () =>
    ({
      children,
      onClick,
      isDragOver,
    }: {
      children: unknown;
      onClick: () => void;
      isDragOver: boolean;
    }) => (
      <div
        data-testid="dropzone"
        data-drag-over={isDragOver}
        onClick={onClick}
      >
        {children as string}
      </div>
    ),
}));

afterEach(cleanup);

function makeMockUpload(overrides?: Record<string, unknown>) {
  return {
    accept: "image/*",
    start: vi.fn(),
    progress: 0,
    isUploading: false,
    result: null,
    error: null,
    validationError: null,
    reset: vi.fn(),
    ...overrides,
  };
}

describe("DropZone", () => {
  it("renders default content", () => {
    render(<DropZone upload={makeMockUpload()} />);
    expect(screen.getByText("Drop files here or click to browse")).toBeTruthy();
  });

  it("shows upload progress", () => {
    render(
      <DropZone
        upload={makeMockUpload({ isUploading: true, progress: 42 })}
      />,
    );
    expect(screen.getByText("Uploading... 42%")).toBeTruthy();
  });

  it("shows error message", () => {
    render(
      <DropZone
        upload={makeMockUpload({ error: "Upload failed" })}
      />,
    );
    expect(screen.getByText("Upload failed")).toBeTruthy();
  });

  it("shows validation error", () => {
    render(
      <DropZone
        upload={makeMockUpload({ validationError: "File too large" })}
      />,
    );
    expect(screen.getByText("File too large")).toBeTruthy();
  });

  it("renders custom children", () => {
    render(
      <DropZone upload={makeMockUpload()}>
        <span>Custom content</span>
      </DropZone>,
    );
    expect(screen.getByText("Custom content")).toBeTruthy();
  });

  it("triggers file input on click", () => {
    render(<DropZone upload={makeMockUpload()} />);
    const dropzone = screen.getByTestId("dropzone");
    // Click should propagate to the hidden input
    fireEvent.click(dropzone);
    // The hidden input exists
    const input = document.querySelector("input[type='file']");
    expect(input).toBeTruthy();
    expect(input?.getAttribute("accept")).toBe("image/*");
  });
});
