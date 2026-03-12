// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "../client/auth-guard";
import { useCurrentUser } from "../client/auth-provider";
import { AuthProvider } from "../client/auth-provider";
import type { AuthUser } from "../types";

const testUser: AuthUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  roles: ["editor"],
};

describe("AuthGuard", () => {
  it("renders children", () => {
    render(
      <AuthProvider user={null}>
        <AuthGuard user={testUser}>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.getByText("Protected Content")).toBeDefined();
  });

  it("provides user to useCurrentUser inside its boundary", () => {
    function UserDisplay() {
      const user = useCurrentUser();
      return <div>{user?.name ?? "no user"}</div>;
    }

    render(
      <AuthProvider user={null}>
        <AuthGuard user={testUser}>
          <UserDisplay />
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.getByText("Test User")).toBeDefined();
  });

  it("overrides outer AuthProvider user with guard user", () => {
    const outerUser: AuthUser = {
      id: "other",
      email: "other@test.com",
      name: "Outer User",
      avatarUrl: null,
      roles: ["reader"],
    };

    function UserDisplay() {
      const user = useCurrentUser();
      return <div>{user?.name}</div>;
    }

    render(
      <AuthProvider user={outerUser}>
        <AuthGuard user={testUser}>
          <UserDisplay />
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.getByText("Test User")).toBeDefined();
  });
});
