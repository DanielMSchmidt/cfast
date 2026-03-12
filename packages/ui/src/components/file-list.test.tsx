// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { FileList } from "./file-list.js";

afterEach(cleanup);

const sampleFiles = [
  { key: "f1", name: "report.pdf", size: 1024 * 512, url: "/files/f1" },
  { key: "f2", name: "photo.jpg", size: 2048 * 1024, url: "/files/f2" },
];

describe("FileList", () => {
  it("renders file names", () => {
    render(<FileList files={sampleFiles} />);
    expect(screen.getByText("report.pdf")).toBeTruthy();
    expect(screen.getByText("photo.jpg")).toBeTruthy();
  });

  it("formats file sizes", () => {
    render(<FileList files={sampleFiles} />);
    expect(screen.getByText("512.0 KB")).toBeTruthy();
    expect(screen.getByText("2.0 MB")).toBeTruthy();
  });

  it("renders download links when files have urls", () => {
    render(<FileList files={sampleFiles} />);
    const links = screen.getAllByText("Download");
    expect(links.length).toBe(2);
    expect(links[0].getAttribute("href")).toBe("/files/f1");
  });

  it("renders 'No files' for empty list", () => {
    render(<FileList files={[]} />);
    expect(screen.getByText("No files")).toBeTruthy();
  });

  it("calls onDownload when button clicked", () => {
    const onDownload = vi.fn();
    render(
      <FileList
        files={sampleFiles}
        onDownload={onDownload}
      />,
    );

    const buttons = screen.getAllByText("Download");
    fireEvent.click(buttons[0]);
    expect(onDownload).toHaveBeenCalledWith(sampleFiles[0]);
  });
});
