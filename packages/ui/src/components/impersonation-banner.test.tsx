import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { ImpersonationBanner } from "./impersonation-banner.js";

afterEach(cleanup);

// Mock @cfast/auth/client
vi.mock("@cfast/auth/client", () => ({
  useCurrentUser: vi.fn(),
}));

import { useCurrentUser } from "@cfast/auth/client";
const mockUseCurrentUser = vi.mocked(useCurrentUser);

describe("ImpersonationBanner", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not impersonating", () => {
    mockUseCurrentUser.mockReturnValue({
      id: "1",
      email: "user@example.com",
      name: "Test User",
      avatarUrl: null,
      roles: ["admin"],
      isImpersonating: false,
    });

    const { container } = render(createElement(ImpersonationBanner, {}));
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when user is null", () => {
    mockUseCurrentUser.mockReturnValue(null);

    const { container } = render(createElement(ImpersonationBanner, {}));
    expect(container.innerHTML).toBe("");
  });

  it("renders banner when impersonating", () => {
    mockUseCurrentUser.mockReturnValue({
      id: "2",
      email: "impersonated@example.com",
      name: "Impersonated User",
      avatarUrl: null,
      roles: ["reader"],
      isImpersonating: true,
      realUser: { id: "1", name: "Admin" },
    });

    render(createElement(ImpersonationBanner, {}));
    expect(screen.getByText("Viewing as Impersonated User (impersonated@example.com)")).toBeTruthy();
    expect(screen.getByText("Stop Impersonating")).toBeTruthy();
  });

  it("uses custom stop action URL", () => {
    mockUseCurrentUser.mockReturnValue({
      id: "2",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      roles: [],
      isImpersonating: true,
    });

    render(createElement(ImpersonationBanner, { stopAction: "/custom/stop" }));
    const form = screen.getByText("Stop Impersonating").closest("form") as HTMLFormElement;
    expect(form.getAttribute("action")).toBe("/custom/stop");
  });
});
