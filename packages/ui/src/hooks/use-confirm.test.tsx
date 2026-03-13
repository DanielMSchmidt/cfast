import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirm, ConfirmContext } from "./use-confirm.js";
import type { ConfirmOptions } from "../types.js";

describe("useConfirm", () => {
  it("throws when used outside ConfirmProvider", () => {
    expect(() => {
      renderHook(() => useConfirm());
    }).toThrow("useConfirm must be used within a <ConfirmProvider>");
  });

  it("calls confirm from context and resolves", async () => {
    const mockConfirm = vi.fn().mockResolvedValue(true);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfirmContext.Provider value={{ confirm: mockConfirm }}>
        {children}
      </ConfirmContext.Provider>
    );

    const { result } = renderHook(() => useConfirm(), { wrapper });

    let resolved: boolean | undefined;
    await act(async () => {
      resolved = await result.current({ title: "Delete?" });
    });

    expect(mockConfirm).toHaveBeenCalledWith({ title: "Delete?" } satisfies ConfirmOptions);
    expect(resolved).toBe(true);
  });
});
