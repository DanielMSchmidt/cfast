import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { StorageProvider, useUpload } from "../client.js";
import type { ClientStorageConfig } from "../types.js";

const mockConfig: ClientStorageConfig = {
  avatars: {
    accept: ["image/jpeg", "image/png"],
    maxSize: "2mb",
    maxSizeBytes: 2 * 1024 * 1024,
  },
};

function wrapper({ children }: { children: ReactNode }) {
  return createElement(StorageProvider, { config: mockConfig }, children);
}

describe("useUpload", () => {
  it("provides accept string from config", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });
    expect(result.current.accept).toBe("image/jpeg,image/png");
  });

  it("starts with idle state", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.validationError).toBeNull();
  });

  it("validates file size client-side", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });

    const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });

    act(() => {
      result.current.start(largeFile);
    });

    expect(result.current.validationError).toContain("2");
    expect(result.current.isUploading).toBe(false);
  });

  it("validates MIME type client-side", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });

    const wrongType = new File([new ArrayBuffer(100)], "doc.txt", {
      type: "text/plain",
    });

    act(() => {
      result.current.start(wrongType);
    });

    expect(result.current.validationError).toContain("text/plain");
    expect(result.current.isUploading).toBe(false);
  });

  it("resets state", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });

    const wrongType = new File([new ArrayBuffer(100)], "doc.txt", {
      type: "text/plain",
    });

    act(() => {
      result.current.start(wrongType);
    });
    expect(result.current.validationError).not.toBeNull();

    act(() => {
      result.current.reset();
    });
    expect(result.current.validationError).toBeNull();
  });
});
