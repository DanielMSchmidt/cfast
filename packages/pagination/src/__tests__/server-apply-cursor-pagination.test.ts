import { describe, it, expect } from "vitest";
import { applyCursorPagination } from "../server/apply-cursor-pagination";
import { decodeCursor, encodeCursor } from "../server/cursor";
// Import from the entry point too, to make sure the public API surface is wired up.
import {
  applyCursorPagination as applyCursorPaginationFromEntry,
  parseCursorParams,
} from "../server";

type Recipe = {
  id: string;
  title: string;
  createdAt: Date;
};

function makeRecipes(): Recipe[] {
  // Sorted descending by createdAt — newest first.
  return [
    { id: "r5", title: "Pizza", createdAt: new Date("2024-05-01") },
    { id: "r4", title: "Pasta", createdAt: new Date("2024-04-01") },
    { id: "r3", title: "Salad", createdAt: new Date("2024-03-01") },
    { id: "r2", title: "Soup", createdAt: new Date("2024-02-01") },
    { id: "r1", title: "Bread", createdAt: new Date("2024-01-01") },
  ];
}

describe("applyCursorPagination", () => {
  it("returns the first page when cursor is null", async () => {
    const result = await applyCursorPagination(makeRecipes(), {
      cursor: null,
      limit: 2,
      cursorColumns: ["createdAt", "id"],
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("r5");
    expect(result.items[1].id).toBe("r4");
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
  });

  it("encodes the next cursor from the last item's columns (Date as ISO string)", async () => {
    const result = await applyCursorPagination(makeRecipes(), {
      cursor: null,
      limit: 2,
      cursorColumns: ["createdAt", "id"],
    });

    // Dates are normalized to ISO strings so the cursor survives JSON
    // serialization. Decoding gives back the ISO string form.
    const decoded = decodeCursor(result.nextCursor);
    expect(decoded).toEqual([new Date("2024-04-01").toISOString(), "r4"]);
  });

  it("returns the next page when given a cursor", async () => {
    const firstPage = await applyCursorPagination(makeRecipes(), {
      cursor: null,
      limit: 2,
      cursorColumns: ["createdAt", "id"],
    });

    const result = await applyCursorPagination(makeRecipes(), {
      cursor: firstPage.nextCursor,
      limit: 2,
      cursorColumns: ["createdAt", "id"],
    });

    expect(result.items.map((r) => r.id)).toEqual(["r3", "r2"]);
    expect(result.hasMore).toBe(true);
  });

  it("hasMore is false and nextCursor is null on the last page", async () => {
    const cursor = encodeCursor([new Date("2024-02-01"), "r2"]);

    const result = await applyCursorPagination(makeRecipes(), {
      cursor,
      limit: 5,
      cursorColumns: ["createdAt", "id"],
    });

    expect(result.items.map((r) => r.id)).toEqual(["r1"]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("returns an empty page when the cursor points past the end", async () => {
    const cursor = encodeCursor([new Date("1999-01-01"), "r0"]);

    const result = await applyCursorPagination(makeRecipes(), {
      cursor,
      limit: 5,
      cursorColumns: ["createdAt", "id"],
    });

    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("supports asc direction", async () => {
    const ascending = [...makeRecipes()].reverse(); // r1 .. r5

    const firstPage = await applyCursorPagination(ascending, {
      cursor: null,
      limit: 2,
      cursorColumns: ["createdAt", "id"],
      direction: "asc",
    });
    expect(firstPage.items.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(firstPage.hasMore).toBe(true);

    const secondPage = await applyCursorPagination(ascending, {
      cursor: firstPage.nextCursor,
      limit: 2,
      cursorColumns: ["createdAt", "id"],
      direction: "asc",
    });
    expect(secondPage.items.map((r) => r.id)).toEqual(["r3", "r4"]);
  });

  it("awaits a Promise query (Drizzle-style)", async () => {
    const promise: Promise<Recipe[]> = Promise.resolve(makeRecipes());

    const result = await applyCursorPagination(promise, {
      cursor: null,
      limit: 3,
      cursorColumns: ["createdAt", "id"],
    });

    expect(result.items).toHaveLength(3);
    expect(result.items[0].id).toBe("r5");
  });

  it("works with a single cursor column", async () => {
    const items = [
      { id: "5", name: "e" },
      { id: "4", name: "d" },
      { id: "3", name: "c" },
      { id: "2", name: "b" },
      { id: "1", name: "a" },
    ];

    const firstPage = await applyCursorPagination(items, {
      cursor: null,
      limit: 2,
      cursorColumns: ["id"],
    });
    expect(firstPage.items.map((i) => i.id)).toEqual(["5", "4"]);

    const secondPage = await applyCursorPagination(items, {
      cursor: firstPage.nextCursor,
      limit: 2,
      cursorColumns: ["id"],
    });
    expect(secondPage.items.map((i) => i.id)).toEqual(["3", "2"]);
  });

  it("returns the shape consumed by usePagination", async () => {
    const result = await applyCursorPagination(makeRecipes(), {
      cursor: null,
      limit: 2,
      cursorColumns: ["id"],
    });

    // Loader return value matches CursorPageData (items, nextCursor)
    // and additionally exposes hasMore for server-side rendering.
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("nextCursor");
    expect(result).toHaveProperty("hasMore");
    expect(Array.isArray(result.items)).toBe(true);
    expect(
      result.nextCursor === null || typeof result.nextCursor === "string",
    ).toBe(true);
    expect(typeof result.hasMore).toBe("boolean");
  });

  it("walks the entire dataset across multiple pages without duplicates", async () => {
    const dataset: Recipe[] = Array.from({ length: 10 }, (_, i) => ({
      id: `r${10 - i}`,
      title: `Recipe ${10 - i}`,
      createdAt: new Date(2024, 0, 10 - i),
    }));

    const seen: string[] = [];
    let cursor: string | null = null;
    let safety = 20;
    do {
      const page: Awaited<ReturnType<typeof applyCursorPagination<Recipe>>> =
        await applyCursorPagination(dataset, {
          cursor,
          limit: 3,
          cursorColumns: ["createdAt", "id"],
        });
      seen.push(...page.items.map((r) => r.id));
      cursor = page.nextCursor;
      safety--;
    } while (cursor !== null && safety > 0);

    expect(seen).toHaveLength(10);
    expect(new Set(seen).size).toBe(10);
    expect(seen[0]).toBe("r10");
    expect(seen[seen.length - 1]).toBe("r1");
  });

  it("falls back to first page when cursor is malformed", async () => {
    const result = await applyCursorPagination(makeRecipes(), {
      cursor: "this-is-not-a-valid-cursor!!!",
      limit: 2,
      cursorColumns: ["id"],
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("r5");
  });

  it("throws when cursorColumns is empty", async () => {
    await expect(
      applyCursorPagination(makeRecipes(), {
        cursor: null,
        limit: 5,
        cursorColumns: [],
      }),
    ).rejects.toThrow(/cursorColumns/);
  });

  it("throws when limit is less than 1", async () => {
    await expect(
      applyCursorPagination(makeRecipes(), {
        cursor: null,
        limit: 0,
        cursorColumns: ["id"],
      }),
    ).rejects.toThrow(/limit/);
  });

  it("matches the loader pattern from issue #106 end-to-end", async () => {
    // This mirrors the exact example from the issue:
    //
    //   const { cursor, limit } = parseCursorParams(request, { defaultLimit: 20 });
    //   const result = await applyCursorPagination(query, {
    //     cursor, limit, cursorColumns: ["createdAt", "id"],
    //   });
    //   return { items, nextCursor, hasMore };
    const request = new Request("https://app.test/recipes");
    const { cursor, limit } = parseCursorParams(request, { defaultLimit: 2 });

    const result = await applyCursorPaginationFromEntry(makeRecipes(), {
      cursor,
      limit,
      cursorColumns: ["createdAt", "id"],
    });

    const loaderReturn = {
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };

    expect(loaderReturn.items).toHaveLength(2);
    expect(loaderReturn.hasMore).toBe(true);
    expect(loaderReturn.nextCursor).not.toBeNull();

    // Following the cursor returns the next page.
    const followUpRequest = new Request(
      `https://app.test/recipes?cursor=${encodeURIComponent(loaderReturn.nextCursor!)}&limit=2`,
    );
    const next = parseCursorParams(followUpRequest, { defaultLimit: 2 });
    expect(next.cursor).toBe(loaderReturn.nextCursor);
    expect(next.limit).toBe(2);

    const nextResult = await applyCursorPaginationFromEntry(makeRecipes(), {
      cursor: next.cursor,
      limit: next.limit,
      cursorColumns: ["createdAt", "id"],
    });
    expect(nextResult.items.map((r) => r.id)).toEqual(["r3", "r2"]);
  });

  it("handles fewer items than the limit on the first page", async () => {
    const items = [{ id: "a" }, { id: "b" }];

    const result = await applyCursorPagination(items, {
      cursor: null,
      limit: 10,
      cursorColumns: ["id"],
    });

    expect(result.items).toEqual(items);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
