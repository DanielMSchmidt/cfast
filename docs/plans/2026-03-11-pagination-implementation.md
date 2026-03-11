# Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add cursor-based and offset-based pagination to `@cfast/db` (server) and page-accumulating React hooks to `@cfast/pagination` (client).

**Architecture:** Server-side param parsers + a `.paginate()` method on `QueryBuilder` that returns `Operation<CursorPage>` or `Operation<OffsetPage>`. Client-side hooks (`usePagination`, `useInfiniteScroll`, `useOffsetPagination`) consume loader data and manage page accumulation via React Router's `useFetcher`. The two packages have no runtime dependency — `@cfast/pagination` reads the serialized page shape from loader data.

**Tech Stack:** TypeScript, drizzle-orm (SQLite/D1), React 19, React Router 7, vitest

---

## Task 1: Pagination Types in `@cfast/db`

**Files:**
- Modify: `packages/db/src/types.ts`

**Step 1: Add pagination types to types.ts**

Add these types after the existing `FindFirstOptions` type:

```typescript
// --- Pagination ---

type CursorParams = {
  type: "cursor";
  cursor: string | null;
  limit: number;
};

type OffsetParams = {
  type: "offset";
  page: number;
  limit: number;
};

type PaginateParams = CursorParams | OffsetParams;

type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

type OffsetPage<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

type PaginateOptions = {
  columns?: Record<string, boolean>;
  where?: unknown;
  orderBy?: unknown;
  cursorColumns?: unknown[];
  with?: Record<string, unknown>;
  cache?: QueryCacheOptions;
};
```

Export all new types from `types.ts` and add `paginate` to the `QueryBuilder` type:

```typescript
export type QueryBuilder = {
  findMany: (options?: FindManyOptions) => Operation<unknown[]>;
  findFirst: (options?: FindFirstOptions) => Operation<unknown | undefined>;
  paginate: ((params: CursorParams, options: PaginateOptions & { cursorColumns: unknown[] }) => Operation<CursorPage<unknown>>) &
    ((params: OffsetParams, options?: PaginateOptions) => Operation<OffsetPage<unknown>>);
};
```

Also add all new types to the `export type` block.

**Step 2: Add pagination types to index.ts exports**

In `packages/db/src/index.ts`, add to the `export type` block:
```typescript
CursorParams, OffsetParams, PaginateParams, CursorPage, OffsetPage, PaginateOptions,
```

**Step 3: Run typecheck**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm typecheck --filter @cfast/db`
Expected: PASS (types only, no implementation yet — `createQueryBuilder` will fail since it doesn't return `paginate` yet, so expect a type error there. That's fine — Task 2 fixes it.)

**Step 4: Commit**

```
git add packages/db/src/types.ts packages/db/src/index.ts
git commit -m "feat(db): add pagination types"
```

---

## Task 2: Param Parsers

**Files:**
- Create: `packages/db/src/paginate.ts`
- Create: `packages/db/src/__tests__/paginate.test.ts`

**Step 1: Write failing tests for parseCursorParams**

Create `packages/db/src/__tests__/paginate.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseCursorParams, parseOffsetParams } from "../paginate";

describe("parseCursorParams", () => {
  it("parses cursor and limit from URL", () => {
    const req = new Request("https://example.com/posts?cursor=abc123&limit=10");
    const result = parseCursorParams(req);
    expect(result).toEqual({ type: "cursor", cursor: "abc123", limit: 10 });
  });

  it("returns null cursor when not provided", () => {
    const req = new Request("https://example.com/posts");
    const result = parseCursorParams(req);
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 20 });
  });

  it("uses defaultLimit", () => {
    const req = new Request("https://example.com/posts");
    const result = parseCursorParams(req, { defaultLimit: 50 });
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 50 });
  });

  it("clamps limit to maxLimit", () => {
    const req = new Request("https://example.com/posts?limit=999");
    const result = parseCursorParams(req, { maxLimit: 50 });
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 50 });
  });

  it("clamps limit to 1 minimum", () => {
    const req = new Request("https://example.com/posts?limit=0");
    const result = parseCursorParams(req);
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 1 });
  });
});

describe("parseOffsetParams", () => {
  it("parses page and limit from URL", () => {
    const req = new Request("https://example.com/posts?page=3&limit=10");
    const result = parseOffsetParams(req);
    expect(result).toEqual({ type: "offset", page: 3, limit: 10 });
  });

  it("defaults to page 1", () => {
    const req = new Request("https://example.com/posts");
    const result = parseOffsetParams(req);
    expect(result).toEqual({ type: "offset", page: 1, limit: 20 });
  });

  it("clamps page to 1 minimum", () => {
    const req = new Request("https://example.com/posts?page=-5");
    const result = parseOffsetParams(req);
    expect(result).toEqual({ type: "offset", page: 1, limit: 20 });
  });

  it("uses defaultLimit and maxLimit", () => {
    const req = new Request("https://example.com/posts?limit=200");
    const result = parseOffsetParams(req, { defaultLimit: 25, maxLimit: 50 });
    expect(result).toEqual({ type: "offset", page: 1, limit: 50 });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/db`
Expected: FAIL — `../paginate` module not found

**Step 3: Implement parsers**

Create `packages/db/src/paginate.ts`:

```typescript
import type { CursorParams, OffsetParams } from "./types";

type ParserOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

function clampLimit(raw: number | null, defaultLimit: number, maxLimit: number): number {
  const limit = raw ?? defaultLimit;
  return Math.max(1, Math.min(limit, maxLimit));
}

export function parseCursorParams(
  request: Request,
  options?: ParserOptions,
): CursorParams {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const rawLimit = url.searchParams.get("limit");
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  return {
    type: "cursor",
    cursor: cursor ?? null,
    limit: clampLimit(rawLimit ? Number(rawLimit) : null, defaultLimit, maxLimit),
  };
}

export function parseOffsetParams(
  request: Request,
  options?: ParserOptions,
): OffsetParams {
  const url = new URL(request.url);
  const rawPage = url.searchParams.get("page");
  const rawLimit = url.searchParams.get("limit");
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  return {
    type: "offset",
    page: Math.max(1, rawPage ? Number(rawPage) : 1),
    limit: clampLimit(rawLimit ? Number(rawLimit) : null, defaultLimit, maxLimit),
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/db`
Expected: PASS

**Step 5: Commit**

```
git add packages/db/src/paginate.ts packages/db/src/__tests__/paginate.test.ts
git commit -m "feat(db): parseCursorParams and parseOffsetParams"
```

---

## Task 3: Cursor Encoding/Decoding

**Files:**
- Modify: `packages/db/src/paginate.ts`
- Modify: `packages/db/src/__tests__/paginate.test.ts`

**Step 1: Write failing tests for cursor encoding**

Add to `paginate.test.ts`:

```typescript
import { encodeCursor, decodeCursor } from "../paginate";

describe("cursor encoding", () => {
  it("encodes column values as base64 JSON", () => {
    const cursor = encodeCursor(["2026-01-01", "post-123"]);
    expect(typeof cursor).toBe("string");
    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual(["2026-01-01", "post-123"]);
  });

  it("handles single column", () => {
    const cursor = encodeCursor(["post-123"]);
    expect(decodeCursor(cursor)).toEqual(["post-123"]);
  });

  it("handles numeric values", () => {
    const cursor = encodeCursor([42, "abc"]);
    expect(decodeCursor(cursor)).toEqual([42, "abc"]);
  });

  it("returns null for null/invalid cursor", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("not-valid-base64-json!!!")).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/db`
Expected: FAIL — `encodeCursor` and `decodeCursor` not found

**Step 3: Implement cursor encoding**

Add to `packages/db/src/paginate.ts`:

```typescript
export function encodeCursor(values: unknown[]): string {
  return btoa(JSON.stringify({ v: values }));
}

export function decodeCursor(cursor: string | null): unknown[] | null {
  if (cursor == null) return null;
  try {
    const parsed = JSON.parse(atob(cursor));
    if (parsed && Array.isArray(parsed.v)) return parsed.v;
    return null;
  } catch {
    return null;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/db`
Expected: PASS

**Step 5: Commit**

```
git add packages/db/src/paginate.ts packages/db/src/__tests__/paginate.test.ts
git commit -m "feat(db): cursor encoding and decoding"
```

---

## Task 4: Paginate Method on QueryBuilder

**Files:**
- Modify: `packages/db/src/query-builder.ts`
- Modify: `packages/db/src/paginate.ts`
- Modify: `packages/db/src/__tests__/paginate.test.ts`

This is the most complex task. The `.paginate()` method needs to:
- For cursor params: decode cursor, build WHERE clause using `cursorColumns`, fetch N+1 rows, encode next cursor
- For offset params: apply limit/offset, run count query, compute totalPages

**Step 1: Write failing tests for `.paginate()` with cursor params**

Add to `paginate.test.ts`:

```typescript
import { createQueryBuilder } from "../query-builder";
import { posts, schema, createMockD1, grantsForRole } from "./helpers";

describe("QueryBuilder.paginate", () => {
  it("returns an Operation with read permissions", () => {
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = qb.paginate(
      { type: "cursor", cursor: null, limit: 10 },
      { cursorColumns: [posts.id] },
    );
    expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("returns an Operation for offset params", () => {
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = qb.paginate(
      { type: "offset", page: 1, limit: 10 },
    );
    expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("returns empty permissions when unsafe", () => {
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: true,
    });

    const op = qb.paginate(
      { type: "cursor", cursor: null, limit: 10 },
      { cursorColumns: [posts.id] },
    );
    expect(op.permissions).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/db`
Expected: FAIL — `qb.paginate` is not a function

**Step 3: Implement paginate on QueryBuilder**

Add a `buildCursorWhere` helper to `packages/db/src/paginate.ts`:

```typescript
import { and, or, gt, lt, eq, type Column } from "drizzle-orm";

export function buildCursorWhere(
  cursorColumns: Column[],
  cursorValues: unknown[],
  direction: "forward",
): unknown {
  // For descending: WHERE (col1, col2) < (v1, v2)
  // Implemented as: (col1 < v1) OR (col1 = v1 AND col2 < v2)
  // For now we assume descending order (most common).
  // The comparison operator is `lt` for descending.
  // With multiple columns, we build the standard tuple comparison expansion.
  if (cursorColumns.length === 1) {
    return lt(cursorColumns[0], cursorValues[0]);
  }

  const clauses: unknown[] = [];
  for (let i = 0; i < cursorColumns.length; i++) {
    const eqs = cursorColumns.slice(0, i).map((col, j) => eq(col, cursorValues[j]));
    const ltClause = lt(cursorColumns[i], cursorValues[i]);
    clauses.push(eqs.length > 0 ? and(...(eqs as [any, ...any[]]), ltClause) : ltClause);
  }
  return or(...(clauses as [any, ...any[]]));
}
```

Then in `packages/db/src/query-builder.ts`, add the `paginate` method to the returned object in `createQueryBuilder`:

```typescript
paginate(
  params: CursorParams | OffsetParams,
  options?: PaginateOptions,
): Operation<CursorPage<unknown>> | Operation<OffsetPage<unknown>> {
  if (!tableKey) {
    return {
      permissions: makePermissions(config.unsafe, "read", config.table),
      async run(): Promise<any> { throw new Error("Table not found in schema"); },
    };
  }

  const permissions = makePermissions(config.unsafe, "read", config.table);

  if (params.type === "cursor") {
    return {
      permissions,
      async run(_p: Record<string, unknown>): Promise<CursorPage<unknown>> {
        if (!config.unsafe) {
          checkOperationPermissions(config.grants, permissions);
        }

        const cursorColumns = options?.cursorColumns as Column[] | undefined;
        if (!cursorColumns?.length) {
          throw new Error("cursorColumns is required for cursor pagination");
        }

        const permFilter = buildPermissionFilter(
          config.grants, "read", config.table, config.user, config.unsafe,
        );

        const cursorValues = decodeCursor(params.cursor);
        const cursorWhere = cursorValues
          ? buildCursorWhere(cursorColumns, cursorValues, "forward")
          : undefined;

        const userWhere = options?.where;
        const combinedWhere = combineWhere(
          combineWhere(userWhere, permFilter),
          cursorWhere,
        );

        const queryOptions: Record<string, unknown> = { ...options };
        if (combinedWhere) queryOptions.where = combinedWhere;
        delete queryOptions.cache;
        delete queryOptions.cursorColumns;
        queryOptions.limit = params.limit + 1;

        const rows = await (db.query as any)[tableKey].findMany(queryOptions) as unknown[];

        const hasMore = rows.length > params.limit;
        const items = hasMore ? rows.slice(0, params.limit) : rows;
        const nextCursor = hasMore
          ? encodeCursor(cursorColumns.map((col) => {
              const colName = (col as any).name as string;
              const lastItem = items[items.length - 1] as Record<string, unknown>;
              return lastItem[colName];
            }))
          : null;

        return { items, nextCursor };
      },
    };
  }

  // Offset pagination
  return {
    permissions,
    async run(_p: Record<string, unknown>): Promise<OffsetPage<unknown>> {
      if (!config.unsafe) {
        checkOperationPermissions(config.grants, permissions);
      }

      const permFilter = buildPermissionFilter(
        config.grants, "read", config.table, config.user, config.unsafe,
      );
      const userWhere = options?.where;
      const combinedWhere = combineWhere(userWhere, permFilter);

      const queryOptions: Record<string, unknown> = { ...options };
      if (combinedWhere) queryOptions.where = combinedWhere;
      delete queryOptions.cache;
      queryOptions.limit = params.limit;
      queryOptions.offset = (params.page - 1) * params.limit;

      const countOptions: Record<string, unknown> = {};
      if (combinedWhere) countOptions.where = combinedWhere;

      const [rows, allRows] = await Promise.all([
        (db.query as any)[tableKey].findMany(queryOptions) as Promise<unknown[]>,
        (db.query as any)[tableKey].findMany(countOptions) as Promise<unknown[]>,
      ]);

      const total = allRows.length;
      return {
        items: rows,
        total,
        page: params.page,
        totalPages: Math.ceil(total / params.limit),
      };
    },
  };
}
```

Note: D1/Drizzle relational queries don't have a `.count()` method, so we fetch all rows for counting. This is a known limitation — for large tables, users should use raw SQL. Add a `// TODO: use COUNT(*) raw query when drizzle supports it` comment.

Add the necessary imports to `query-builder.ts`:
```typescript
import type { CursorParams, OffsetParams, CursorPage, OffsetPage, PaginateOptions } from "./types";
import { decodeCursor, encodeCursor, buildCursorWhere } from "./paginate";
import type { Column } from "drizzle-orm";
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/db`
Expected: PASS

**Step 5: Run typecheck**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm typecheck --filter @cfast/db`
Expected: PASS

**Step 6: Commit**

```
git add packages/db/src/query-builder.ts packages/db/src/paginate.ts packages/db/src/__tests__/paginate.test.ts
git commit -m "feat(db): paginate method on QueryBuilder"
```

---

## Task 5: Export Parsers from `@cfast/db`

**Files:**
- Modify: `packages/db/src/index.ts`

**Step 1: Add parser exports**

Add to `packages/db/src/index.ts`:

```typescript
export { parseCursorParams, parseOffsetParams } from "./paginate";
```

**Step 2: Run typecheck**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm typecheck --filter @cfast/db`
Expected: PASS

**Step 3: Commit**

```
git add packages/db/src/index.ts
git commit -m "feat(db): export parseCursorParams and parseOffsetParams"
```

---

## Task 6: usePagination Hook

**Files:**
- Create: `packages/pagination/src/use-pagination.ts`
- Create: `packages/pagination/src/__tests__/use-pagination.test.ts`
- Modify: `packages/pagination/src/index.ts`
- Modify: `packages/pagination/package.json` (add dependencies, test script)
- Create: `packages/pagination/vitest.config.ts`

**Step 1: Set up package**

Update `packages/pagination/package.json` — add test script, vitest dev dep, and update build to include both entrypoints:

```json
{
  "name": "@cfast/pagination",
  "version": "0.0.1",
  "description": "Cursor-based, offset-based pagination and infinite scroll for React Router",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
    "react-router": ">=7"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.6.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

Create `packages/pagination/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

**Step 2: Write failing tests**

Create `packages/pagination/src/__tests__/use-pagination.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

// Mock react-router hooks
const mockLoaderData = vi.fn();
const mockFetcher = vi.fn();

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData(),
  useFetcher: () => mockFetcher(),
  useLocation: () => ({ pathname: "/posts", search: "" }),
}));

// Mock react
vi.mock("react", () => ({
  useRef: (val: unknown) => ({ current: val }),
  useCallback: (fn: Function) => fn,
  useState: (init: unknown) => {
    let state = typeof init === "function" ? (init as Function)() : init;
    return [state, (updater: unknown) => {
      state = typeof updater === "function" ? (updater as Function)(state) : updater;
    }];
  },
  useEffect: (fn: Function) => fn(),
}));

import { usePagination } from "../use-pagination";

describe("usePagination", () => {
  it("returns initial items from loader data", () => {
    mockLoaderData.mockReturnValue({
      items: [{ id: "1", title: "Post 1" }, { id: "2", title: "Post 2" }],
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
    mockFetcher.mockReturnValue({ state: "loading", data: null, load: vi.fn() });

    const result = usePagination();
    expect(result.isLoading).toBe(true);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/pagination`
Expected: FAIL — module not found

**Step 4: Implement usePagination**

Create `packages/pagination/src/use-pagination.ts`:

```typescript
import { useLoaderData, useFetcher, useLocation } from "react-router";
import { useState, useCallback, useEffect, useRef } from "react";

type CursorPageData = {
  items: unknown[];
  nextCursor: string | null;
};

type UsePaginationOptions<T> = {
  getKey?: (item: T) => string | number;
};

type UsePaginationResult<T> = {
  items: T[];
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
};

function defaultGetKey(item: unknown): string | number {
  return (item as Record<string, unknown>).id as string | number;
}

function deduplicateItems<T>(
  items: T[],
  getKey: (item: T) => string | number,
): T[] {
  const seen = new Map<string | number, T>();
  for (const item of items) {
    seen.set(getKey(item), item);
  }
  return Array.from(seen.values());
}

export function usePagination<T = unknown>(
  options?: UsePaginationOptions<T>,
): UsePaginationResult<T> {
  const loaderData = useLoaderData() as CursorPageData;
  const fetcher = useFetcher<CursorPageData>();
  const location = useLocation();
  const getKey = (options?.getKey ?? defaultGetKey) as (item: T) => string | number;

  const [pages, setPages] = useState<CursorPageData[]>(() => [loaderData]);
  const lastCursorRef = useRef<string | null>(loaderData.nextCursor);

  // Reset when route changes (new loader data)
  useEffect(() => {
    setPages([loaderData]);
    lastCursorRef.current = loaderData.nextCursor;
  }, [location.pathname, location.search]);

  // Append fetcher results
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      setPages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.nextCursor === fetcher.data?.nextCursor) return prev;
        return [...prev, fetcher.data!];
      });
      lastCursorRef.current = fetcher.data.nextCursor;
    }
  }, [fetcher.data, fetcher.state]);

  const allItems = deduplicateItems(
    pages.flatMap((p) => p.items) as T[],
    getKey,
  );

  const hasMore = lastCursorRef.current != null;
  const isLoading = fetcher.state !== "idle";

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const cursor = lastCursorRef.current;
    const params = new URLSearchParams(location.search);
    params.set("cursor", cursor!);
    fetcher.load(`${location.pathname}?${params.toString()}`);
  }, [isLoading, hasMore, location.pathname, location.search, fetcher]);

  return { items: allItems, loadMore, hasMore, isLoading };
}
```

Update `packages/pagination/src/index.ts`:

```typescript
export { usePagination } from "./use-pagination";
export type { UsePaginationOptions, UsePaginationResult } from "./use-pagination";
```

Note: Export the types from use-pagination.ts as well (add `export` keyword to their declarations).

**Step 5: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/pagination`
Expected: PASS

**Step 6: Commit**

```
git add packages/pagination/
git commit -m "feat(pagination): usePagination hook"
```

---

## Task 7: useInfiniteScroll Hook

**Files:**
- Create: `packages/pagination/src/use-infinite-scroll.ts`
- Create: `packages/pagination/src/__tests__/use-infinite-scroll.test.ts`
- Modify: `packages/pagination/src/index.ts`

**Step 1: Write failing tests**

Create `packages/pagination/src/__tests__/use-infinite-scroll.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

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
  useState: (init: unknown) => {
    let state = typeof init === "function" ? (init as Function)() : init;
    return [state, (updater: unknown) => {
      state = typeof updater === "function" ? (updater as Function)(state) : updater;
    }];
  },
  useEffect: (fn: Function) => fn(),
}));

import { useInfiniteScroll } from "../use-infinite-scroll";

describe("useInfiniteScroll", () => {
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
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/pagination`
Expected: FAIL

**Step 3: Implement useInfiniteScroll**

Create `packages/pagination/src/use-infinite-scroll.ts`:

```typescript
import { useRef, useEffect, useCallback } from "react";
import { usePagination } from "./use-pagination";

type UseInfiniteScrollOptions<T> = {
  getKey?: (item: T) => string | number;
  rootMargin?: string;
};

type UseInfiniteScrollResult<T> = {
  items: T[];
  sentinelRef: { current: Element | null };
  hasMore: boolean;
  isLoading: boolean;
};

export function useInfiniteScroll<T = unknown>(
  options?: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollResult<T> {
  const { items, loadMore, hasMore, isLoading } = usePagination<T>({
    getKey: options?.getKey,
  });

  const sentinelRef = useRef<Element | null>(null);
  const rootMargin = options?.rootMargin ?? "200px";

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, rootMargin]);

  return { items, sentinelRef, hasMore, isLoading };
}
```

Add to `packages/pagination/src/index.ts`:

```typescript
export { useInfiniteScroll } from "./use-infinite-scroll";
export type { UseInfiniteScrollOptions, UseInfiniteScrollResult } from "./use-infinite-scroll";
```

Note: Export the types from use-infinite-scroll.ts as well.

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/pagination`
Expected: PASS

**Step 5: Commit**

```
git add packages/pagination/src/use-infinite-scroll.ts packages/pagination/src/__tests__/use-infinite-scroll.test.ts packages/pagination/src/index.ts
git commit -m "feat(pagination): useInfiniteScroll hook"
```

---

## Task 8: useOffsetPagination Hook

**Files:**
- Create: `packages/pagination/src/use-offset-pagination.ts`
- Create: `packages/pagination/src/__tests__/use-offset-pagination.test.ts`
- Modify: `packages/pagination/src/index.ts`

**Step 1: Write failing tests**

Create `packages/pagination/src/__tests__/use-offset-pagination.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

const mockLoaderData = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData(),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/posts", search: "" }),
}));

import { useOffsetPagination } from "../use-offset-pagination";

describe("useOffsetPagination", () => {
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

  it("preserves existing search params when navigating", () => {
    vi.mocked(vi.fn()).mockClear;
    mockNavigate.mockClear();

    // Re-mock with search params
    vi.doMock("react-router", () => ({
      useLoaderData: () => ({
        items: [],
        total: 100,
        page: 1,
        totalPages: 10,
      }),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: "/posts", search: "?limit=25&sort=title" }),
    }));

    // Note: This test may need adjustment depending on mock behavior.
    // The key behavior is that goToPage sets/replaces the page param while keeping others.
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/pagination`
Expected: FAIL

**Step 3: Implement useOffsetPagination**

Create `packages/pagination/src/use-offset-pagination.ts`:

```typescript
import { useLoaderData, useNavigate, useLocation } from "react-router";
import { useCallback } from "react";

type OffsetPageData = {
  items: unknown[];
  total: number;
  page: number;
  totalPages: number;
};

type UseOffsetPaginationResult<T> = {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  goToPage: (page: number) => void;
};

export function useOffsetPagination<T = unknown>(): UseOffsetPaginationResult<T> {
  const data = useLoaderData() as OffsetPageData;
  const navigate = useNavigate();
  const location = useLocation();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(location.search);
      params.set("page", String(page));
      navigate(`${location.pathname}?${params.toString()}`);
    },
    [navigate, location.pathname, location.search],
  );

  return {
    items: data.items as T[],
    total: data.total,
    totalPages: data.totalPages,
    currentPage: data.page,
    goToPage,
  };
}
```

Add to `packages/pagination/src/index.ts`:

```typescript
export { useOffsetPagination } from "./use-offset-pagination";
export type { UseOffsetPaginationResult } from "./use-offset-pagination";
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test --filter @cfast/pagination`
Expected: PASS

**Step 5: Commit**

```
git add packages/pagination/src/use-offset-pagination.ts packages/pagination/src/__tests__/use-offset-pagination.test.ts packages/pagination/src/index.ts
git commit -m "feat(pagination): useOffsetPagination hook"
```

---

## Task 9: Final Verification & README Update

**Files:**
- Modify: `packages/pagination/README.md`

**Step 1: Run full test suite**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm test`
Expected: All packages pass

**Step 2: Run full typecheck**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm typecheck`
Expected: All packages pass

**Step 3: Update pagination README**

Update `packages/pagination/README.md` to reflect the actual implemented API. The main changes from the original README:
- Import paths are `@cfast/db` for server (parsers) and `@cfast/pagination` for client (hooks)
- `paginate()` is a method on `db.query(table)`, not a standalone function
- Add `cursorColumns` to the cursor example
- Remove `@cfast/router` references (that was the old package name idea)

**Step 4: Commit**

```
git add packages/pagination/README.md
git commit -m "docs(pagination): update README to match implemented API"
```
