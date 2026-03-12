// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DetailView } from "./detail-view.js";

vi.mock("./page-container.js", () => ({
  PageContainer: ({ title, children }: { title?: string; children: unknown }) => (
    <div data-testid="page-container">
      {title ? <h1>{title}</h1> : null}
      {children as string}
    </div>
  ),
}));

import { vi } from "vitest";

afterEach(cleanup);

describe("DetailView", () => {
  it("renders title in PageContainer", () => {
    render(
      <DetailView
        title="Post Details"
        record={{ id: 1, name: "Test" }}
        fields={["id", "name"]}
      />,
    );

    expect(screen.getByText("Post Details")).toBeTruthy();
  });

  it("renders field labels and values", () => {
    render(
      <DetailView
        title="Post"
        record={{ id: 1, name: "Hello World" }}
        fields={["id", "name"]}
      />,
    );

    expect(screen.getByText("Id")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("infers fields from record when none specified", () => {
    render(
      <DetailView
        title="Post"
        record={{ id: 1, title: "Test", status: "published" }}
      />,
    );

    expect(screen.getByText("Id")).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
  });

  it("excludes fields when exclude prop is set", () => {
    render(
      <DetailView
        title="Post"
        record={{ id: 1, title: "Test", secret: "hidden" }}
        exclude={["secret"]}
      />,
    );

    expect(screen.getByText("Id")).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.queryByText("Secret")).toBeNull();
  });

  it("uses custom render function for fields", () => {
    render(
      <DetailView
        title="Post"
        record={{ id: 1, status: "published" }}
        fields={[
          "id",
          {
            key: "status",
            label: "Status",
            render: (value: unknown) => (
              <span data-testid="custom-render">{`Status: ${value}`}</span>
            ),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("custom-render")).toBeTruthy();
    expect(screen.getByText("Status: published")).toBeTruthy();
  });
});
