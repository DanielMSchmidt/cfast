import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import type {
  CfastItem,
  CfastCollection,
  CfastItemMethods,
  CfastLoaderData,
} from "../client/use-cfast-loader.js";
import type { ActionHookResult } from "../client/use-actions.js";

// Mock state
let mockLoaderData: Record<string, unknown> = {};

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData,
}));

// Mock useMemo to just execute the factory immediately (no React context needed)
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useMemo: <T>(factory: () => T, _deps: unknown[]): T => factory(),
  };
});

// Import after mocks are set up
const { useCfastLoader } = await import("../client/use-cfast-loader.js");

describe("useCfastLoader", () => {
  beforeEach(() => {
    mockLoaderData = {};
  });

  it("passes through plain fields unchanged", () => {
    mockLoaderData = {
      title: "hello",
      count: 42,
      active: true,
    };

    const result = useCfastLoader();
    expect(result.title).toBe("hello");
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
  });

  it("does not expose _tablePerms on the result", () => {
    mockLoaderData = {
      _tablePerms: { posts: { read: true, create: true, update: true, delete: true } },
      title: "hello",
    };

    const result = useCfastLoader();
    expect(result._tablePerms).toBeUndefined();
    expect(result.title).toBe("hello");
  });

  describe("item wrapping (object with _can)", () => {
    it("wraps an object with _can into an item with can*() methods", () => {
      mockLoaderData = {
        post: {
          id: "1",
          title: "Hello World",
          _can: { read: true, create: false, update: true, delete: false },
        },
        _tablePerms: {},
      };

      const result = useCfastLoader();
      const post = result.post as Record<string, unknown>;

      // Row fields accessible directly
      expect(post.id).toBe("1");
      expect(post.title).toBe("Hello World");

      // Permission methods
      expect(typeof post.canEdit).toBe("function");
      expect(typeof post.canDelete).toBe("function");
      expect(typeof post.canRead).toBe("function");
      expect(typeof post.canCreate).toBe("function");

      // Returns ActionHookResult
      const editResult = (post.canEdit as () => unknown)();
      expect(editResult).toEqual(
        expect.objectContaining({
          permitted: true,
          invisible: false,
          reason: null,
          pending: false,
        }),
      );

      const deleteResult = (post.canDelete as () => unknown)();
      expect(deleteResult).toEqual(
        expect.objectContaining({ permitted: false }),
      );
    });

    it("can*() methods are non-enumerable", () => {
      mockLoaderData = {
        post: {
          id: "1",
          _can: { read: true, create: true, update: true, delete: true },
        },
        _tablePerms: {},
      };

      const result = useCfastLoader();
      const post = result.post as Record<string, unknown>;
      const keys = Object.keys(post);

      expect(keys).toContain("id");
      expect(keys).not.toContain("canEdit");
      expect(keys).not.toContain("canDelete");
      expect(keys).not.toContain("canRead");
      expect(keys).not.toContain("canCreate");
      expect(keys).not.toContain("_can");
    });
  });

  describe("collection wrapping (array with _can items)", () => {
    it("wraps each item with can*() methods", () => {
      const arr = [
        { id: "1", title: "First", _can: { read: true, create: false, update: true, delete: false } },
        { id: "2", title: "Second", _can: { read: true, create: false, update: false, delete: true } },
      ];

      // Simulate cfastJson _tableName annotation
      Object.defineProperty(arr, "_tableName", {
        value: "posts",
        enumerable: false,
      });

      mockLoaderData = {
        posts: arr,
        _tablePerms: {
          posts: { read: true, create: true, update: false, delete: false },
        },
      };

      const result = useCfastLoader();
      const posts = result.posts as unknown[];

      // Array works normally
      expect(posts.length).toBe(2);
      expect((posts[0] as Record<string, unknown>).title).toBe("First");
      expect((posts[1] as Record<string, unknown>).title).toBe("Second");

      // Each item has can*() methods
      const first = posts[0] as Record<string, unknown>;
      expect(typeof first.canEdit).toBe("function");
      const editResult = (first.canEdit as () => unknown)();
      expect(editResult).toEqual(expect.objectContaining({ permitted: true }));

      const second = posts[1] as Record<string, unknown>;
      const deleteResult = (second.canDelete as () => unknown)();
      expect(deleteResult).toEqual(expect.objectContaining({ permitted: true }));
    });

    it("adds canAdd() method from _tablePerms", () => {
      const arr = [
        { id: "1", _can: { read: true, create: false, update: false, delete: false } },
      ];

      Object.defineProperty(arr, "_tableName", {
        value: "posts",
        enumerable: false,
      });

      mockLoaderData = {
        posts: arr,
        _tablePerms: {
          posts: { read: true, create: true, update: false, delete: false },
        },
      };

      const result = useCfastLoader();
      const posts = result.posts as unknown as { canAdd: () => unknown };

      expect(typeof posts.canAdd).toBe("function");
      const addResult = posts.canAdd();
      expect(addResult).toEqual(expect.objectContaining({ permitted: true }));
    });

    it("canAdd() returns false when create is not permitted", () => {
      const arr = [
        { id: "1", _can: { read: true, create: false, update: false, delete: false } },
      ];

      Object.defineProperty(arr, "_tableName", {
        value: "posts",
        enumerable: false,
      });

      mockLoaderData = {
        posts: arr,
        _tablePerms: {
          posts: { read: true, create: false, update: false, delete: false },
        },
      };

      const result = useCfastLoader();
      const posts = result.posts as unknown as { canAdd: () => { permitted: boolean } };

      expect(posts.canAdd().permitted).toBe(false);
    });

    it("canAdd() is non-enumerable", () => {
      const arr = [
        { id: "1", _can: { read: true, create: false, update: false, delete: false } },
      ];

      Object.defineProperty(arr, "_tableName", {
        value: "posts",
        enumerable: false,
      });

      mockLoaderData = {
        posts: arr,
        _tablePerms: {
          posts: { read: true, create: true, update: false, delete: false },
        },
      };

      const result = useCfastLoader();
      const posts = result.posts as unknown[];
      const keys = Object.keys(posts);
      expect(keys).not.toContain("canAdd");
    });
  });

  describe("passthrough for arrays without _can", () => {
    it("does not wrap arrays of primitives", () => {
      mockLoaderData = {
        tags: ["a", "b", "c"],
        _tablePerms: {},
      };

      const result = useCfastLoader();
      expect(result.tags).toEqual(["a", "b", "c"]);
      expect((result.tags as unknown as { canAdd?: unknown }).canAdd).toBeUndefined();
    });

    it("does not wrap arrays of objects without _can", () => {
      mockLoaderData = {
        items: [{ id: "1" }, { id: "2" }],
        _tablePerms: {},
      };

      const result = useCfastLoader();
      const items = result.items as unknown[];
      expect(items.length).toBe(2);
      expect((items[0] as Record<string, unknown>).canEdit).toBeUndefined();
    });
  });

  describe("empty collections", () => {
    it("handles empty arrays gracefully", () => {
      const arr: unknown[] = [];
      Object.defineProperty(arr, "_tableName", {
        value: "posts",
        enumerable: false,
      });

      mockLoaderData = {
        posts: arr,
        _tablePerms: {
          posts: { read: true, create: true, update: false, delete: false },
        },
      };

      const result = useCfastLoader();
      const posts = result.posts as unknown[];
      expect(posts.length).toBe(0);
      // Empty arrays don't have _can items, so they pass through
    });
  });

  describe("mapped types", () => {
    it("CfastItem adds permission methods to an object type", () => {
      type Post = { id: string; title: string };
      type Wrapped = CfastItem<Post>;

      expectTypeOf<Wrapped>().toHaveProperty("id");
      expectTypeOf<Wrapped>().toHaveProperty("title");
      expectTypeOf<Wrapped>().toHaveProperty("canRead");
      expectTypeOf<Wrapped>().toHaveProperty("canEdit");
      expectTypeOf<Wrapped>().toHaveProperty("canDelete");
      expectTypeOf<Wrapped>().toHaveProperty("canCreate");

      // canEdit returns ActionHookResult
      expectTypeOf<Wrapped["canEdit"]>().returns.toEqualTypeOf<ActionHookResult>();
    });

    it("CfastCollection is an array of CfastItem with canAdd()", () => {
      type Post = { id: string; title: string };
      type Col = CfastCollection<Post>;

      // canAdd exists on the collection
      expectTypeOf<Col>().toHaveProperty("canAdd");
      expectTypeOf<Col["canAdd"]>().returns.toEqualTypeOf<ActionHookResult>();

      // Indexing yields a CfastItem
      expectTypeOf<Col[number]>().toHaveProperty("canEdit");
      expectTypeOf<Col[number]>().toHaveProperty("id");
    });

    it("CfastItemMethods contains all four permission helpers", () => {
      expectTypeOf<CfastItemMethods>().toHaveProperty("canRead");
      expectTypeOf<CfastItemMethods>().toHaveProperty("canCreate");
      expectTypeOf<CfastItemMethods>().toHaveProperty("canEdit");
      expectTypeOf<CfastItemMethods>().toHaveProperty("canDelete");
    });

    it("CfastLoaderData transforms loader return shape", () => {
      type LoaderReturn = {
        posts: { id: string; title: string }[];
        post: { id: string; title: string };
        count: number;
      };
      type Transformed = CfastLoaderData<LoaderReturn>;

      // Array of objects -> CfastCollection
      expectTypeOf<Transformed["posts"]>().toHaveProperty("canAdd");
      expectTypeOf<Transformed["posts"][number]>().toHaveProperty("canEdit");

      // Single object -> CfastItem
      expectTypeOf<Transformed["post"]>().toHaveProperty("canEdit");
      expectTypeOf<Transformed["post"]>().toHaveProperty("id");

      // Primitive -> unchanged
      expectTypeOf<Transformed["count"]>().toEqualTypeOf<number>();
    });

    it("useCfastLoader return type includes permission methods", () => {
      type MockLoader = () => Promise<{
        documents: { id: string; name: string }[];
        document: { id: string; name: string };
        total: number;
      }>;

      // This verifies that useCfastLoader's generic produces CfastLoaderData
      type Result = ReturnType<typeof useCfastLoader<MockLoader>>;

      // Collection
      expectTypeOf<Result["documents"]>().toHaveProperty("canAdd");
      expectTypeOf<Result["documents"][number]>().toHaveProperty("canEdit");
      expectTypeOf<Result["documents"][number]>().toHaveProperty("id");

      // Single item
      expectTypeOf<Result["document"]>().toHaveProperty("canEdit");
      expectTypeOf<Result["document"]>().toHaveProperty("name");

      // Primitive passthrough
      expectTypeOf<Result["total"]>().toEqualTypeOf<number>();
    });
  });
});
