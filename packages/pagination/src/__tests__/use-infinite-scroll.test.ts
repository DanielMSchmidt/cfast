import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLoaderData = vi.fn();
const mockFetcher = vi.fn();

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData(),
  useFetcher: () => mockFetcher(),
  useLocation: () => ({ pathname: "/posts", search: "" }),
}));

vi.mock("react", async () => {
  return {
    useRef: (val: unknown) => ({ current: val }),
    useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useState: (init: unknown) => {
      const state = typeof init === "function" ? (init as () => unknown)() : init;
      return [state, vi.fn()];
    },
    useEffect: (fn: () => void) => { fn(); },
  };
});

import { useInfiniteScroll } from "../use-infinite-scroll";

describe("useInfiniteScroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial items and a sentinelRef", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1", title: "Post 1" }],
      nextCursor: "abc",
    });
    mockFetcher.mockReturnValue({ state: "idle", data: null, load: vi.fn() });

    const result = useInfiniteScroll();
    expect(result.items).toEqual([{ id: "1", title: "Post 1" }]);
    expect(result.hasMore).toBe(true);
    expect(result.isLoading).toBe(false);
    expect(result.sentinelRef).toBeDefined();
    expect(result.sentinelRef.current).toBeNull();
  });

  it("hasMore is false when no next cursor", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1" }],
      nextCursor: null,
    });
    mockFetcher.mockReturnValue({ state: "idle", data: null, load: vi.fn() });

    const result = useInfiniteScroll();
    expect(result.hasMore).toBe(false);
  });

  it("isLoading reflects fetcher state", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1" }],
      nextCursor: "cursor-1",
    });
    mockFetcher.mockReturnValue({ state: "loading", data: null, load: vi.fn() });

    const result = useInfiniteScroll();
    expect(result.isLoading).toBe(true);
  });
});
