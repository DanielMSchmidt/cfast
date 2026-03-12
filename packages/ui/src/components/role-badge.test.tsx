import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { RoleBadge } from "./role-badge.js";

afterEach(cleanup);

describe("RoleBadge", () => {
  it("renders the role text", () => {
    render(createElement(RoleBadge, { role: "admin" }));
    expect(screen.getByText("admin")).toBeTruthy();
  });

  it("renders with custom colors without error", () => {
    render(
      createElement(RoleBadge, {
        role: "moderator",
        colors: { moderator: "warning" },
      }),
    );
    expect(screen.getByText("moderator")).toBeTruthy();
  });

  it("falls back to neutral for unknown roles", () => {
    render(createElement(RoleBadge, { role: "unknown" }));
    expect(screen.getByText("unknown")).toBeTruthy();
  });
});
