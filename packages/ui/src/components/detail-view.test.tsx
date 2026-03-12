// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { DetailView } from "./detail-view.js";

vi.mock("./page-container.js", () => ({
  PageContainer: ({ title, children }: { title?: string; children: unknown }) =>
    createElement("div", { "data-testid": "page-container" },
      title ? createElement("h1", null, title) : null,
      children as string,
    ),
}));

import { vi } from "vitest";

afterEach(cleanup);

describe("DetailView", () => {
  it("renders title in PageContainer", () => {
    render(
      createElement(DetailView, {
        title: "Post Details",
        record: { id: 1, name: "Test" },
        fields: ["id", "name"],
      }),
    );

    expect(screen.getByText("Post Details")).toBeTruthy();
  });

  it("renders field labels and values", () => {
    render(
      createElement(DetailView, {
        title: "Post",
        record: { id: 1, name: "Hello World" },
        fields: ["id", "name"],
      }),
    );

    expect(screen.getByText("Id")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("infers fields from record when none specified", () => {
    render(
      createElement(DetailView, {
        title: "Post",
        record: { id: 1, title: "Test", status: "published" },
      }),
    );

    expect(screen.getByText("Id")).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
  });

  it("excludes fields when exclude prop is set", () => {
    render(
      createElement(DetailView, {
        title: "Post",
        record: { id: 1, title: "Test", secret: "hidden" },
        exclude: ["secret"],
      }),
    );

    expect(screen.getByText("Id")).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.queryByText("Secret")).toBeNull();
  });

  it("uses custom render function for fields", () => {
    render(
      createElement(DetailView, {
        title: "Post",
        record: { id: 1, status: "published" },
        fields: [
          "id",
          {
            key: "status",
            label: "Status",
            render: (value: unknown) =>
              createElement("span", { "data-testid": "custom-render" }, `Status: ${value}`),
          },
        ],
      }),
    );

    expect(screen.getByTestId("custom-render")).toBeTruthy();
    expect(screen.getByText("Status: published")).toBeTruthy();
  });
});
