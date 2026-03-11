import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLoaderData = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData(),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/posts", search: "" }),
}));

vi.mock("react", () => ({
  useCallback: (fn: Function) => fn,
}));

import { useOffsetPagination } from "../use-offset-pagination";

describe("useOffsetPagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns items and page metadata from loader data", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1" }, { id: "2" }],
      total: 50,
      page: 1,
      totalPages: 5,
    });

    const result = useOffsetPagination();
    expect(result.items).toEqual([{ id: "1" }, { id: "2" }]);
    expect(result.totalPages).toBe(5);
    expect(result.currentPage).toBe(1);
    expect(result.total).toBe(50);
    expect(typeof result.goToPage).toBe("function");
  });

  it("goToPage navigates with page param", () => {
    mockLoaderData.mockReturnValue({
      items: [],
      total: 100,
      page: 1,
      totalPages: 10,
    });

    const result = useOffsetPagination();
    result.goToPage(3);
    expect(mockNavigate).toHaveBeenCalledWith("/posts?page=3");
  });

  it("returns correct metadata for middle pages", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "21" }, { id: "22" }],
      total: 100,
      page: 3,
      totalPages: 10,
    });

    const result = useOffsetPagination();
    expect(result.currentPage).toBe(3);
    expect(result.totalPages).toBe(10);
    expect(result.total).toBe(100);
  });
});
