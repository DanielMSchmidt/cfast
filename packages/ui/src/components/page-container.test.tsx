import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PageContainer } from "./page-container.js";

afterEach(cleanup);

describe("PageContainer", () => {
  it("renders children", () => {
    render(
      <PageContainer>
        <div data-testid="content">Page content</div>
      </PageContainer>,
    );
    expect(screen.getByTestId("content")).toBeTruthy();
  });

  it("renders title", () => {
    render(
      <PageContainer title="My Page">
        Content
      </PageContainer>,
    );
    expect(screen.getByText("My Page")).toBeTruthy();
  });

  it("renders breadcrumb", () => {
    render(
      <PageContainer
        breadcrumb={[
          { label: "Home", to: "/" },
          { label: "Posts" },
        ]}
      >
        Content
      </PageContainer>,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    // "Posts" is rendered inside a span with " / " prefix — use a function matcher
    expect(screen.getByText((_content, element) => element?.textContent?.includes("Posts") === true && element.tagName === "SPAN")).toBeTruthy();
  });

  it("renders actions", () => {
    render(
      <PageContainer actions={<button>Create</button>}>
        Content
      </PageContainer>,
    );
    expect(screen.getByText("Create")).toBeTruthy();
  });
});
