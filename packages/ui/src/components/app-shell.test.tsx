import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AppShell, AppShellHeader } from "./app-shell.js";

afterEach(cleanup);

describe("AppShell", () => {
  it("renders children", () => {
    render(
      <AppShell>
        <div data-testid="content">Main content</div>
      </AppShell>,
    );
    expect(screen.getByTestId("content")).toBeTruthy();
  });

  it("renders with sidebar and header", () => {
    render(
      <AppShell
        sidebar={<nav data-testid="sidebar">Sidebar</nav>}
        header={<header data-testid="header">Header</header>}
      >
        Content
      </AppShell>,
    );
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByTestId("header")).toBeTruthy();
  });
});

describe("AppShellHeader", () => {
  it("renders with user menu", () => {
    render(
      <AppShellHeader
        userMenu={<div data-testid="menu">Menu</div>}
      />,
    );
    expect(screen.getByTestId("menu")).toBeTruthy();
  });
});
