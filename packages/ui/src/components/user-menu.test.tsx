import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { UserMenu } from "./user-menu.js";

afterEach(cleanup);

// Mock @cfast/auth/client
vi.mock("@cfast/auth/client", () => ({
  useCurrentUser: vi.fn(),
}));

// Mock useActionStatus
vi.mock("../hooks/use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useCurrentUser } from "@cfast/auth/client";
const mockUseCurrentUser = vi.mocked(useCurrentUser);

describe("UserMenu", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when user is null", () => {
    mockUseCurrentUser.mockReturnValue(null);
    const { container } = render(<UserMenu />);
    expect(container.innerHTML).toBe("");
  });

  it("renders user info when user is present", () => {
    mockUseCurrentUser.mockReturnValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
      roles: ["admin"],
    });

    render(<UserMenu />);
    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByText("test@example.com")).toBeTruthy();
  });

  it("renders role badges", () => {
    mockUseCurrentUser.mockReturnValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
      roles: ["admin", "editor"],
    });

    render(<UserMenu />);
    expect(screen.getByText("admin")).toBeTruthy();
    expect(screen.getByText("editor")).toBeTruthy();
  });

  it("renders sign out button when onSignOut provided", () => {
    mockUseCurrentUser.mockReturnValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
      roles: [],
    });

    render(<UserMenu onSignOut={vi.fn()} />);
    expect(screen.getByText("Sign out")).toBeTruthy();
  });
});
