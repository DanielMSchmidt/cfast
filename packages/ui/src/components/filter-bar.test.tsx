// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { FilterBar } from "./filter-bar.js";

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("react-router", () => ({
  useSearchParams: () => [mockSearchParams],
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/admin/posts" }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

describe("FilterBar", () => {
  it("renders select filters", () => {
    render(
      createElement(FilterBar, {
        filters: [
          {
            column: "status",
            type: "select",
            label: "Status",
            options: [
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
            ],
          },
        ],
      }),
    );

    expect(screen.getByLabelText("Status")).toBeTruthy();
    expect(screen.getByText("All Status")).toBeTruthy();
    expect(screen.getByText("Published")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("renders text filters", () => {
    render(
      createElement(FilterBar, {
        filters: [
          {
            column: "title",
            type: "text",
            placeholder: "Search titles...",
          },
        ],
      }),
    );

    expect(screen.getByPlaceholderText("Search titles...")).toBeTruthy();
  });

  it("renders search input when searchable is set", () => {
    render(
      createElement(FilterBar, {
        filters: [],
        searchable: ["title", "body"],
      }),
    );

    expect(screen.getByPlaceholderText("Search title, body...")).toBeTruthy();
  });

  it("navigates with updated params on filter change", () => {
    render(
      createElement(FilterBar, {
        filters: [
          {
            column: "status",
            type: "select",
            label: "Status",
            options: [
              { label: "Published", value: "published" },
            ],
          },
        ],
      }),
    );

    const select = screen.getByLabelText("Status");
    fireEvent.change(select, { target: { value: "published" } });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/admin/posts?status=published",
    );
  });

  it("removes page and cursor params on filter change", () => {
    mockSearchParams = new URLSearchParams("page=3&cursor=abc");

    render(
      createElement(FilterBar, {
        filters: [
          {
            column: "status",
            type: "select",
            label: "Status",
            options: [
              { label: "Published", value: "published" },
            ],
          },
        ],
      }),
    );

    const select = screen.getByLabelText("Status");
    fireEvent.change(select, { target: { value: "published" } });

    // Should NOT include page or cursor
    const navigatedUrl = mockNavigate.mock.calls[0][0] as string;
    expect(navigatedUrl).not.toContain("page=");
    expect(navigatedUrl).not.toContain("cursor=");
    expect(navigatedUrl).toContain("status=published");
  });
});
