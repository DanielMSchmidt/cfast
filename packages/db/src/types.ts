import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";

// --- Row inference helpers ---

/**
 * Extracts the row type from a Drizzle table reference.
 *
 * Drizzle tables expose `$inferSelect` (the row shape returned by `SELECT *`).
 * `InferRow<typeof posts>` resolves to `{ id: string; title: string; ... }`.
 *
 * Falls back to `Record<string, unknown>` for opaque `DrizzleTable` references
 * (e.g. when callers do not specify a concrete table type generic).
 *
 * @typeParam TTable - The Drizzle table type (e.g. `typeof posts`).
 */
export type InferRow<TTable> = TTable extends { $inferSelect: infer R }
  ? R
  : Record<string, unknown>;

// --- Operation ---

/**
 * A lazy, permission-aware database operation.
 *
 * Every method on {@link Db} returns an `Operation` instead of a promise. The operation
 * exposes its permission requirements via `.permissions` for inspection and executes with
 * full permission checking via `.run()`. This two-phase design enables UI adaptation,
 * upfront composition via {@link compose}, and introspection before any SQL is executed.
 *
 * @typeParam TResult - The type of the result returned by `.run()`.
 *
 * @example
 * ```ts
 * const op = db.query(posts).findMany();
 *
 * // Inspect permissions without executing
 * console.log(op.permissions);
 * // => [{ action: "read", table: "posts" }]
 *
 * // Execute with permission checks
 * const rows = await op.run({});
 * ```
 */
export type Operation<TResult> = {
  /** Structural permission requirements. Available immediately without execution. */
  permissions: PermissionDescriptor[];
  /**
   * Checks permissions, applies permission WHERE clauses, executes the query via Drizzle,
   * and returns the result. Throws `ForbiddenError` if the user's role lacks a required grant.
   *
   * @param params - Placeholder values for `sql.placeholder()` calls. Pass `{}` when no placeholders are used.
   */
  run: (params?: Record<string, unknown>) => Promise<TResult>;
};

// --- Cache ---

/**
 * Supported cache backend types for {@link CacheConfig}.
 *
 * - `"cache-api"` — Edge-local Cloudflare Cache API (~0ms latency, per-edge-node).
 * - `"kv"` — Global Cloudflare KV (10-50ms latency, eventually consistent).
 */
export type CacheBackend = "cache-api" | "kv";

/**
 * Configuration for the database cache layer.
 *
 * Controls how query results are cached and invalidated. Mutations automatically
 * bump table version counters, causing subsequent reads to miss the cache.
 *
 * @example
 * ```ts
 * const db = createDb({
 *   d1: env.DB,
 *   schema,
 *   grants: resolvedGrants,
 *   user: currentUser,
 *   cache: {
 *     backend: "cache-api",
 *     ttl: "30s",
 *     staleWhileRevalidate: "5m",
 *     exclude: ["sessions"],
 *   },
 * });
 * ```
 */
export type CacheConfig = {
  /** Which cache backend to use: edge-local Cache API or global KV. */
  backend: CacheBackend;
  /** KV namespace binding. Required when {@link backend} is `"kv"`. */
  kv?: KVNamespace;
  /** Default TTL for cached queries (e.g., `"30s"`, `"5m"`, `"1h"`). Defaults to `"60s"`. */
  ttl?: string;
  /** Stale-while-revalidate window (e.g., `"5m"`). Serves stale data while revalidating in the background. */
  staleWhileRevalidate?: string;
  /** Table names that should never be cached (e.g., `["sessions", "tokens"]`). */
  exclude?: string[];
  /** Observability hook called on cache hits. */
  onHit?: (key: string, table: string) => void;
  /** Observability hook called on cache misses. */
  onMiss?: (key: string, table: string) => void;
  /** Observability hook called when tables are invalidated by mutations. */
  onInvalidate?: (tables: string[]) => void;
};

/**
 * Per-query cache control options.
 *
 * Pass `false` to skip caching for a specific query, or an options object to
 * override the default {@link CacheConfig} for that query.
 *
 * @example
 * ```ts
 * // Skip cache entirely
 * db.query(posts).findMany({ cache: false });
 *
 * // Custom TTL and tags
 * db.query(posts).findMany({ cache: { ttl: "5m", tags: ["user-posts"] } });
 * ```
 */
export type QueryCacheOptions =
  | false
  | {
      /** Override the default TTL for this query (e.g., `"5m"`, `"1h"`). */
      ttl?: string;
      /** Override the default stale-while-revalidate window for this query. */
      staleWhileRevalidate?: string;
      /** Tags for targeted manual invalidation via `db.cache.invalidate({ tags })`. */
      tags?: string[];
    };

// --- DB Config ---

/**
 * Configuration for {@link createDb}.
 *
 * @example
 * ```ts
 * import { createDb } from "@cfast/db";
 * import * as schema from "./schema";
 *
 * const db = createDb({
 *   d1: env.DB,
 *   schema,
 *   grants: resolvedGrants,
 *   user: { id: "user-123" },
 *   cache: { backend: "cache-api" },
 * });
 * ```
 */
export type DbConfig = {
  /** The Cloudflare D1 database binding from `env.DB`. */
  d1: D1Database;
  /**
   * Drizzle schema object. Must be `import * as schema` so that keys match
   * table variable names (required by Drizzle's relational query API).
   *
   * Typed as `Record<string, unknown>` so callers can pass `import * as schema`
   * directly without casting -- Drizzle schemas typically include `Relations`
   * exports alongside tables, and the `@cfast/db` runtime ignores any non-table
   * entries when looking up tables by key.
   */
  schema: Record<string, unknown>;
  /** Resolved permission grants for the current user's role, from `resolveGrants()`. */
  grants: Grant[];
  /**
   * The current user, or `null` for anonymous access.
   * When `null`, the `"anonymous"` role is used for permission checks.
   */
  user: { id: string } | null;
  /** Cache configuration, or `false` to disable caching entirely. Defaults to `{ backend: "cache-api" }`. */
  cache?: CacheConfig | false;
};

// --- Query options ---

/**
 * Options for `db.query(table).findMany()`.
 *
 * The `where` condition is AND'd with any permission-based WHERE clauses
 * resolved from the user's grants.
 *
 * @example
 * ```ts
 * import { eq, desc } from "drizzle-orm";
 *
 * db.query(posts).findMany({
 *   columns: { id: true, title: true },
 *   where: eq(posts.category, "tech"),
 *   orderBy: desc(posts.createdAt),
 *   limit: 10,
 *   offset: 20,
 *   with: { comments: true },
 *   cache: { ttl: "5m", tags: ["posts"] },
 * });
 * ```
 */
export type FindManyOptions = {
  /** Column selection (e.g., `{ id: true, title: true }`). Omit to select all columns. */
  columns?: Record<string, boolean>;
  /** User-supplied filter condition (AND'd with permission filters at `.run()` time). */
  where?: unknown;
  /** Ordering expression (e.g., `desc(posts.createdAt)`). */
  orderBy?: unknown;
  /** Maximum number of rows to return. */
  limit?: number;
  /** Number of rows to skip (for offset-based pagination). */
  offset?: number;
  /**
   * Drizzle relational query includes (e.g., `{ comments: true }`).
   *
   * Note: Permission filters are only applied to the root table, not to joined relations.
   */
  with?: Record<string, unknown>;
  /** Per-query cache control. Pass `false` to skip caching, or an object to customize. */
  cache?: QueryCacheOptions;
};

/**
 * Options for `db.query(table).findFirst()`.
 *
 * Same as {@link FindManyOptions} without `limit`/`offset` (returns the first match or `undefined`).
 *
 * @example
 * ```ts
 * db.query(posts).findFirst({
 *   where: eq(posts.id, "abc-123"),
 * });
 * ```
 */
export type FindFirstOptions = Omit<FindManyOptions, "limit" | "offset">;

// --- Pagination ---

/**
 * Parsed cursor-based pagination parameters from a request URL.
 *
 * Produced by {@link parseCursorParams}. Pass to `db.query(table).paginate()` for
 * keyset pagination that avoids the offset performance cliff on large datasets.
 *
 * @example
 * ```ts
 * const params = parseCursorParams(request, { defaultLimit: 20 });
 * const page = await db.query(posts).paginate(params).run({});
 * ```
 */
export type CursorParams = {
  /** Discriminant for cursor-based pagination. Always `"cursor"`. */
  type: "cursor";
  /** The opaque cursor string from the previous page, or `null` for the first page. */
  cursor: string | null;
  /** Maximum items per page (clamped between 1 and `maxLimit`). */
  limit: number;
};

/**
 * Parsed offset-based pagination parameters from a request URL.
 *
 * Produced by {@link parseOffsetParams}. Pass to `db.query(table).paginate()` for
 * traditional page-number-based pagination with total counts.
 *
 * @example
 * ```ts
 * const params = parseOffsetParams(request, { defaultLimit: 20 });
 * const page = await db.query(posts).paginate(params).run({});
 * ```
 */
export type OffsetParams = {
  /** Discriminant for offset-based pagination. Always `"offset"`. */
  type: "offset";
  /** The 1-based page number. */
  page: number;
  /** Maximum items per page (clamped between 1 and `maxLimit`). */
  limit: number;
};

/**
 * Union of cursor and offset pagination parameters.
 *
 * Use the `type` discriminant to determine which pagination strategy is in use.
 * Accepted by `db.query(table).paginate()`.
 */
export type PaginateParams = CursorParams | OffsetParams;

/**
 * A page of results from cursor-based pagination.
 *
 * Use `nextCursor` to fetch the next page. When `nextCursor` is `null`, there are no more pages.
 *
 * @typeParam T - The row type.
 *
 * @example
 * ```ts
 * const page: CursorPage<Post> = await db.query(posts)
 *   .paginate({ type: "cursor", cursor: null, limit: 20 })
 *   .run({});
 *
 * if (page.nextCursor) {
 *   // Fetch next page with page.nextCursor
 * }
 * ```
 */
export type CursorPage<T> = {
  /** The items on this page. */
  items: T[];
  /** Opaque cursor for the next page, or `null` if this is the last page. */
  nextCursor: string | null;
};

/**
 * A page of results from offset-based pagination.
 *
 * Includes total counts for rendering page navigation controls.
 *
 * @typeParam T - The row type.
 *
 * @example
 * ```ts
 * const page: OffsetPage<Post> = await db.query(posts)
 *   .paginate({ type: "offset", page: 1, limit: 20 })
 *   .run({});
 *
 * console.log(`Page ${page.page} of ${page.totalPages} (${page.total} total)`);
 * ```
 */
export type OffsetPage<T> = {
  /** The items on this page. */
  items: T[];
  /** Total number of matching rows across all pages. */
  total: number;
  /** The current 1-based page number. */
  page: number;
  /** Total number of pages (computed as `Math.ceil(total / limit)`). */
  totalPages: number;
};

/**
 * Options for `db.query(table).paginate()`.
 *
 * Combines query filtering with pagination-specific settings. The actual pagination
 * strategy (cursor vs. offset) is determined by the {@link PaginateParams} passed
 * alongside these options.
 *
 * @example
 * ```ts
 * db.query(posts).paginate(params, {
 *   where: eq(posts.published, true),
 *   orderBy: desc(posts.createdAt),
 *   cursorColumns: [posts.createdAt, posts.id],
 *   orderDirection: "desc",
 * });
 * ```
 */
export type PaginateOptions = {
  /** Column selection (e.g., `{ id: true, title: true }`). Omit to select all columns. */
  columns?: Record<string, boolean>;
  /** User-supplied filter condition (AND'd with permission filters at `.run()` time). */
  where?: unknown;
  /** Ordering expression for offset pagination. Ignored for cursor pagination (uses `cursorColumns` instead). */
  orderBy?: unknown;
  /** Drizzle column references used for cursor-based ordering and comparison. */
  cursorColumns?: unknown[];
  /** Sort direction for cursor pagination. Defaults to `"desc"`. */
  orderDirection?: "asc" | "desc";
  /**
   * Drizzle relational query includes (e.g., `{ comments: true }`).
   *
   * Note: Permission filters are only applied to the root table, not to joined relations.
   */
  with?: Record<string, unknown>;
  /** Per-query cache control. Pass `false` to skip caching, or an object to customize. */
  cache?: QueryCacheOptions;
};

// --- Db type ---

/**
 * A permission-aware database instance bound to a specific user.
 *
 * Created by {@link createDb}. All query and mutation methods return lazy {@link Operation}
 * objects that check permissions at `.run()` time. Create a new instance per request --
 * sharing across requests would apply one user's permissions to another's queries.
 *
 * @example
 * ```ts
 * // Read
 * const posts = await db.query(postsTable).findMany().run({});
 *
 * // Write
 * await db.insert(postsTable).values({ title: "Hello" }).run({});
 *
 * // Bypass permissions for system tasks
 * await db.unsafe().delete(sessionsTable).where(expired).run({});
 * ```
 */
export type Db = {
  /**
   * Creates a {@link QueryBuilder} for reading rows from the given table.
   *
   * The builder is generic over `TTable`, so `findMany`/`findFirst` return rows
   * typed via `InferRow<TTable>` -- callers don't need to cast to `as any`.
   */
  query: <TTable extends DrizzleTable>(table: TTable) => QueryBuilder<TTable>;
  /** Creates an {@link InsertBuilder} for inserting rows into the given table. */
  insert: <TTable extends DrizzleTable>(table: TTable) => InsertBuilder<TTable>;
  /** Creates an {@link UpdateBuilder} for updating rows in the given table. */
  update: <TTable extends DrizzleTable>(table: TTable) => UpdateBuilder<TTable>;
  /** Creates a {@link DeleteBuilder} for deleting rows from the given table. */
  delete: <TTable extends DrizzleTable>(table: TTable) => DeleteBuilder<TTable>;
  /**
   * Returns a new `Db` instance that skips all permission checks.
   *
   * Use for cron jobs, migrations, and system operations without an authenticated user.
   * Every call site is greppable via `git grep '.unsafe()'`.
   */
  unsafe: () => Db;
  /**
   * Groups multiple operations into a single {@link Operation} with merged, deduplicated permissions.
   *
   * When every operation was produced by `db.insert/update/delete`, the batch is
   * executed via D1's native `batch()` API, which is **atomic** -- if any
   * statement fails, the entire batch is rolled back. This is the recommended
   * way to perform multi-step mutations that need transactional safety, such as
   * decrementing stock across multiple products during checkout.
   *
   * Permissions for every sub-operation are checked **upfront**: if the user
   * lacks any required grant, the batch throws before any SQL is issued.
   *
   * Operations that don't carry the internal batchable hook (for example, ops
   * produced by `compose()` executors) cause the batch to fall back to
   * sequential execution. This preserves backward compatibility for non-trivial
   * compositions but loses the atomicity guarantee.
   */
  batch: (operations: Operation<unknown>[]) => Operation<unknown[]>;
  /** Cache control methods for manual invalidation. */
  cache: {
    /** Invalidate cached queries by tag names and/or table names. */
    invalidate: (options: {
      /** Tag names to invalidate (from {@link QueryCacheOptions} `tags`). */
      tags?: string[];
      /** Table names to invalidate (bumps their version counters). */
      tables?: string[];
    }) => Promise<void>;
  };
};

/**
 * Builder for read queries on a single table.
 *
 * Returned by `db.query(table)`. Provides `findMany`, `findFirst`, and `paginate` methods
 * that each return an {@link Operation} with permission-aware execution.
 *
 * @example
 * ```ts
 * const builder = db.query(posts);
 *
 * // Fetch all visible posts
 * const all = await builder.findMany().run({});
 *
 * // Fetch a single post
 * const post = await builder.findFirst({ where: eq(posts.id, id) }).run({});
 *
 * // Paginate
 * const page = await builder.paginate(params, { orderBy: desc(posts.createdAt) }).run({});
 * ```
 */
export type QueryBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  /**
   * Returns an {@link Operation} that fetches multiple rows matching the given options.
   *
   * The result is typed via `InferRow<TTable>`, so callers get IntelliSense on
   * `(row) => row.title` without any cast.
   */
  findMany: (options?: FindManyOptions) => Operation<InferRow<TTable>[]>;
  /**
   * Returns an {@link Operation} that fetches the first matching row, or `undefined`
   * if none match. The row type is propagated from `TTable`.
   */
  findFirst: (options?: FindFirstOptions) => Operation<InferRow<TTable> | undefined>;
  /**
   * Returns a paginated {@link Operation} using either cursor-based or offset-based strategy.
   *
   * The return type depends on the `params.type` discriminant: {@link CursorPage} for `"cursor"`,
   * {@link OffsetPage} for `"offset"`. Each page's items are typed as `InferRow<TTable>`.
   */
  paginate: (
    params: CursorParams | OffsetParams,
    options?: PaginateOptions,
  ) => Operation<CursorPage<InferRow<TTable>>> | Operation<OffsetPage<InferRow<TTable>>>;
};

/**
 * Builder for insert operations on a single table.
 *
 * Returned by `db.insert(table)`. Chain `.values()` to set the row data,
 * then optionally `.returning()` to get the inserted row back.
 *
 * @example
 * ```ts
 * // Insert without returning
 * await db.insert(posts).values({ title: "Hello", authorId: user.id }).run({});
 *
 * // Insert with returning
 * const row = await db.insert(posts)
 *   .values({ title: "Hello", authorId: user.id })
 *   .returning()
 *   .run({});
 * ```
 */
export type InsertBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  /** Specifies the column values to insert, returning an {@link InsertReturningBuilder}. */
  values: (values: Record<string, unknown>) => InsertReturningBuilder<TTable>;
};

/**
 * An insert {@link Operation} that optionally returns the inserted row via `.returning()`.
 *
 * Without `.returning()`, the operation resolves to `void`. With `.returning()`,
 * it resolves to the full inserted row, typed as `InferRow<TTable>`.
 */
export type InsertReturningBuilder<TTable extends DrizzleTable = DrizzleTable> =
  Operation<void> & {
    /** Chains `.returning()` to get the inserted row back from D1. */
    returning: () => Operation<InferRow<TTable>>;
  };

/**
 * Builder for update operations on a single table.
 *
 * Returned by `db.update(table)`. Chain `.set()` to specify values, then `.where()`
 * to add a condition, and optionally `.returning()` to get the updated row back.
 *
 * @example
 * ```ts
 * await db.update(posts)
 *   .set({ published: true })
 *   .where(eq(posts.id, "abc-123"))
 *   .run({});
 * ```
 */
export type UpdateBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  /** Specifies the column values to update, returning an {@link UpdateWhereBuilder}. */
  set: (values: Record<string, unknown>) => UpdateWhereBuilder<TTable>;
};

/**
 * Intermediate builder requiring a WHERE condition before the update can execute.
 *
 * The WHERE condition is AND'd with any permission-based WHERE clauses from the user's grants.
 */
export type UpdateWhereBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  /** Specifies the WHERE condition (AND'd with permission filters at `.run()` time). */
  where: (condition: unknown) => UpdateReturningBuilder<TTable>;
};

/**
 * An update {@link Operation} that optionally returns the updated row via `.returning()`.
 *
 * Without `.returning()`, the operation resolves to `void`. With `.returning()`,
 * it resolves to the full updated row, typed as `InferRow<TTable>`.
 */
export type UpdateReturningBuilder<TTable extends DrizzleTable = DrizzleTable> =
  Operation<void> & {
    /** Chains `.returning()` to get the updated row back from D1. */
    returning: () => Operation<InferRow<TTable>>;
  };

/**
 * Builder for delete operations on a single table.
 *
 * Returned by `db.delete(table)`. Chain `.where()` to add a condition,
 * and optionally `.returning()` to get the deleted row back.
 *
 * @example
 * ```ts
 * await db.delete(posts).where(eq(posts.id, "abc-123")).run({});
 * ```
 */
export type DeleteBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  /** Specifies the WHERE condition (AND'd with permission filters at `.run()` time). */
  where: (condition: unknown) => DeleteReturningBuilder<TTable>;
};

/**
 * A delete {@link Operation} that optionally returns the deleted row via `.returning()`.
 *
 * Without `.returning()`, the operation resolves to `void`. With `.returning()`,
 * it resolves to the full deleted row, typed as `InferRow<TTable>`.
 */
export type DeleteReturningBuilder<TTable extends DrizzleTable = DrizzleTable> =
  Operation<void> & {
    /** Chains `.returning()` to get the deleted row back from D1. */
    returning: () => Operation<InferRow<TTable>>;
  };
