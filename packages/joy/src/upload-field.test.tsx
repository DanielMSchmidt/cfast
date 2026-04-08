// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { UploadField } from "./upload-field.js";
import type { UploadFieldFile } from "@cfast/ui";

afterEach(cleanup);

/**
 * Build a fake `File` for the file input. Tests use small payloads so they
 * never accidentally trip the `maxSize` validator unless the test wants to.
 */
function makeFile(
  name: string,
  type = "image/png",
  size = 1024,
): File {
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

/** Build a deferred Promise so tests can sequence asynchronous uploads. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Joy UploadField", () => {
  it("renders the drop zone copy", () => {
    render(<UploadField filetype="productImages" />);
    expect(
      screen.getByText("Drop a file here or click to browse"),
    ).toBeTruthy();
  });

  it("uploads via the configured uploader and emits the new keys", async () => {
    const onChange = vi.fn();
    const uploader = vi
      .fn()
      .mockResolvedValue({ key: "products/abc.png", size: 1024, type: "image/png" });

    render(
      <UploadField
        filetype="productImages"
        accept="image/*"
        value={[]}
        onChange={onChange}
        uploader={uploader}
      />,
    );
    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("abc.png")] },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(["products/abc.png"]);
    });
    expect(uploader).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ url: "/uploads/productImages" }),
    );
  });

  it("respects basePath when building the upload URL", async () => {
    const uploader = vi
      .fn()
      .mockResolvedValue({ key: "k", size: 1, type: "image/png" });

    render(
      <UploadField
        filetype="productImages"
        basePath="/files"
        uploader={uploader}
      />,
    );
    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("a.png")] },
    });
    await waitFor(() => {
      expect(uploader).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({ url: "/files/productImages" }),
      );
    });
  });

  it("enforces maxFiles globally", async () => {
    const uploader = vi.fn();
    render(
      <UploadField
        filetype="productImages"
        multiple
        maxFiles={2}
        value={["a", "b"]}
        uploader={uploader}
      />,
    );

    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("c.png")] },
    });

    const globalError = await screen.findByTestId("upload-field-global-error");
    expect(globalError.textContent).toBe("Maximum of 2 files reached");
    expect(uploader).not.toHaveBeenCalled();
  });

  it("rejects files whose mime type does not match accept", async () => {
    const uploader = vi.fn();
    const onError = vi.fn();
    render(
      <UploadField
        filetype="productImages"
        accept="image/*"
        uploader={uploader}
        onError={onError}
      />,
    );
    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("notes.txt", "text/plain")] },
    });

    const errors = await screen.findAllByTestId("upload-field-file-error");
    expect(errors[0].textContent).toMatch(/not an accepted type/);
    expect(uploader).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it("forwards onProgress updates from the uploader to the LinearProgress", async () => {
    const d = deferred<{ key: string; size: number; type: string }>();
    let capturedOnProgress: ((p: number) => void) | undefined;
    const uploader = vi.fn(async (
      _file: File,
      options: { onProgress: (p: number) => void },
    ) => {
      capturedOnProgress = options.onProgress;
      return d.promise;
    });

    render(<UploadField filetype="productImages" uploader={uploader} />);
    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("a.png")] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("upload-field-progress")).toBeTruthy();
    });
    capturedOnProgress?.(73);
    await waitFor(() => {
      const progress = screen.getByTestId("upload-field-progress");
      expect(progress.getAttribute("aria-valuenow")).toBe("73");
    });
    d.resolve({ key: "k", size: 1, type: "image/png" });
  });

  it("shows an upload error inline without losing existing value", async () => {
    const uploader = vi.fn().mockRejectedValue(new Error("boom"));
    const onChange = vi.fn();

    render(
      <UploadField
        filetype="productImages"
        multiple
        value={["existing-key"]}
        onChange={onChange}
        uploader={uploader}
      />,
    );

    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("bad.png")] },
    });

    const inlineError = await screen.findByTestId("upload-field-file-error");
    expect(inlineError.textContent).toBe("boom");
    expect(screen.getByText("existing-key")).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports controlled value round-trip with removal", async () => {
    function Wrapper() {
      const [keys, setKeys] = useState<string[]>(["k1", "k2"]);
      return (
        <>
          <UploadField
            filetype="productImages"
            multiple
            value={keys}
            onChange={(next) => {
              setKeys(next);
              recorded.push(next);
            }}
          />
          <span data-testid="state">{keys.join(",")}</span>
        </>
      );
    }
    const recorded: string[][] = [];
    render(<Wrapper />);

    expect(screen.getByTestId("state").textContent).toBe("k1,k2");

    const removeButton = screen.getByLabelText("Remove k1");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByTestId("state").textContent).toBe("k2");
    });
    expect(recorded.at(-1)).toEqual(["k2"]);
  });

  it("rejects files larger than maxSize before calling the uploader", async () => {
    const uploader = vi.fn();
    const onError = vi.fn<(file: UploadFieldFile) => void>();
    render(
      <UploadField
        filetype="productImages"
        maxSize={500}
        uploader={uploader}
        onError={onError}
      />,
    );

    fireEvent.change(screen.getByTestId("upload-field-input"), {
      target: { files: [makeFile("big.png", "image/png", 2048)] },
    });

    const errors = await screen.findAllByTestId("upload-field-file-error");
    expect(errors[0].textContent).toMatch(/max is/);
    expect(uploader).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});
