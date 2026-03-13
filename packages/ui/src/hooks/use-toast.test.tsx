import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, ToastContext } from "./use-toast.js";

describe("useToast", () => {
  it("throws when used outside ToastProvider", () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow("useToast must be used within a <ToastProvider>");
  });

  it("calls show with correct options for each method", () => {
    const mockShow = vi.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContext.Provider value={{ show: mockShow }}>
        {children}
      </ToastContext.Provider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.success("Done!");
    });
    expect(mockShow).toHaveBeenCalledWith({
      message: "Done!",
      type: "success",
      description: undefined,
    });

    mockShow.mockClear();

    act(() => {
      result.current.error("Failed", "Details here");
    });
    expect(mockShow).toHaveBeenCalledWith({
      message: "Failed",
      type: "error",
      description: "Details here",
    });
  });
});
