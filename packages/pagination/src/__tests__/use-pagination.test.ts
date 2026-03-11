import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-router hooks
const mockLoaderData = vi.fn();
const mockFetcher = vi.fn();

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData(),
  useFetcher: () => mockFetcher(),
  useLocation: () => ({ pathname: "/posts", search: "" }),
}));

vi.mock("react", () => ({
  useRef: (val: unknown) => ({ current: val }),
  useCallback: (fn: Function) => fn,
  useMemo: (fn: Function) => fn(),
  useState: (init: unknown) => {
    const state = typeof init === "function" ? (init as Function)() : init;
    return [state, vi.fn()];
  },
  useEffect: (fn: Function) => fn(),
}));

import { usePagination } from "../use-pagination";

describe("usePagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial items from loader data", () => {
    mockLoaderData.mockReturnValue({
      items: [
        { id: "1", title: "Post 1" },
        { id: "2", title: "Post 2" },
      ],
      nextCursor: "abc123",
    });
    mockFetcher.mockReturnValue({ state: "idle", data: null, load: vi.fn() });

    const result = usePagination();
    expect(result.items).toEqual([
      { id: "1", title: "Post 1" },
      { id: "2", title: "Post 2" },
    ]);
    expect(result.hasMore).toBe(true);
    expect(result.isLoading).toBe(false);
  });

  it("hasMore is false when nextCursor is null", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1", title: "Post 1" }],
      nextCursor: null,
    });
    mockFetcher.mockReturnValue({ state: "idle", data: null, load: vi.fn() });

    const result = usePagination();
    expect(result.hasMore).toBe(false);
  });

  it("provides a loadMore function", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1", title: "Post 1" }],
      nextCursor: "cursor-1",
    });
    const load = vi.fn();
    mockFetcher.mockReturnValue({ state: "idle", data: null, load });

    const result = usePagination();
    expect(typeof result.loadMore).toBe("function");
  });

  it("isLoading is true when fetcher is loading", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1" }],
      nextCursor: "cursor-1",
    });
    mockFetcher.mockReturnValue({
      state: "loading",
      data: null,
      load: vi.fn(),
    });

    const result = usePagination();
    expect(result.isLoading).toBe(true);
  });

  it("deduplicates items by id", () => {
    mockLoaderData.mockReturnValue({
      items: [
        { id: "1", title: "A" },
        { id: "1", title: "B" },
      ],
      nextCursor: null,
    });
    mockFetcher.mockReturnValue({ state: "idle", data: null, load: vi.fn() });

    const result = usePagination();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({ id: "1", title: "A" });
  });

  it("supports custom getKey", () => {
    mockLoaderData.mockReturnValue({
      items: [
        { slug: "a", title: "A" },
        { slug: "a", title: "B" },
      ],
      nextCursor: null,
    });
    mockFetcher.mockReturnValue({ state: "idle", data: null, load: vi.fn() });

    const result = usePagination<{ slug: string; title: string }>({
      getKey: (item) => item.slug,
    });
    expect(result.items).toHaveLength(1);
  });
});
