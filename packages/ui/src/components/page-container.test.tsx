import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { PageContainer } from "./page-container.js";

afterEach(cleanup);

describe("PageContainer", () => {
  it("renders children", () => {
    render(
      createElement(PageContainer, {
        children: createElement("div", { "data-testid": "content" }, "Page content"),
      }),
    );
    expect(screen.getByTestId("content")).toBeTruthy();
  });

  it("renders title", () => {
    render(
      createElement(PageContainer, {
        title: "My Page",
        children: "Content",
      }),
    );
    expect(screen.getByText("My Page")).toBeTruthy();
  });

  it("renders breadcrumb", () => {
    render(
      createElement(PageContainer, {
        breadcrumb: [
          { label: "Home", to: "/" },
          { label: "Posts" },
        ],
        children: "Content",
      }),
    );
    expect(screen.getByText("Home")).toBeTruthy();
    // "Posts" is rendered inside a span with " / " prefix — use a function matcher
    expect(screen.getByText((_content, element) => element?.textContent?.includes("Posts") === true && element.tagName === "SPAN")).toBeTruthy();
  });

  it("renders actions", () => {
    render(
      createElement(PageContainer, {
        actions: createElement("button", null, "Create"),
        children: "Content",
      }),
    );
    expect(screen.getByText("Create")).toBeTruthy();
  });
});
