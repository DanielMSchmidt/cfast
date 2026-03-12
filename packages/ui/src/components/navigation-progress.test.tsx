import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { NavigationProgress } from "./navigation-progress.js";

afterEach(cleanup);

// Mock react-router
vi.mock("react-router", () => ({
  useNavigation: vi.fn(),
}));

import { useNavigation } from "react-router";
const mockUseNavigation = vi.mocked(useNavigation);

describe("NavigationProgress", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when idle", () => {
    mockUseNavigation.mockReturnValue({
      state: "idle",
    } as ReturnType<typeof useNavigation>);

    const { container } = render(createElement(NavigationProgress, {}));
    expect(container.innerHTML).toBe("");
  });

  it("renders progress bar when loading", () => {
    mockUseNavigation.mockReturnValue({
      state: "loading",
    } as ReturnType<typeof useNavigation>);

    render(createElement(NavigationProgress, {}));
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });
});
