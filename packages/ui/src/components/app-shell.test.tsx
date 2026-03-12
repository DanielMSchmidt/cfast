import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { AppShell, AppShellHeader } from "./app-shell.js";

afterEach(cleanup);

describe("AppShell", () => {
  it("renders children", () => {
    render(
      createElement(AppShell, {
        children: createElement("div", { "data-testid": "content" }, "Main content"),
      }),
    );
    expect(screen.getByTestId("content")).toBeTruthy();
  });

  it("renders with sidebar and header", () => {
    render(
      createElement(AppShell, {
        sidebar: createElement("nav", { "data-testid": "sidebar" }, "Sidebar"),
        header: createElement("header", { "data-testid": "header" }, "Header"),
        children: "Content",
      }),
    );
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByTestId("header")).toBeTruthy();
  });
});

describe("AppShellHeader", () => {
  it("renders with user menu", () => {
    render(
      createElement(AppShellHeader, {
        userMenu: createElement("div", { "data-testid": "menu" }, "Menu"),
      }),
    );
    expect(screen.getByTestId("menu")).toBeTruthy();
  });
});
