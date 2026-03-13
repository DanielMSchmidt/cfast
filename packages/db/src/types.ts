import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";

// --- Operation ---

/**
 * A lazy, permission-aware database operation.
 *
 * Every method on `Db` returns an `Operation` instead of a promise. The operation exposes
 * its permission requirements via `.permissions` and executes with permission checking via `.run()`.
 *
 * @typeParam TResult - The type of the result returned by `.run()`.
 */
export type Operation<TResult> = {
  /** Structural permission requirements. Available immediately without execution. */
  permissions: PermissionDescriptor[];
  /** Checks permissions, applies WHERE clauses, executes via Drizzle, and returns results. */
  run: (params: Record<string, unknown>) => Promise<TResult>;
};

// --- Cache ---

/** Supported cache backend types. */
export type CacheBackend = "cache-api" | "kv";

/**
 * Configuration for the database cache layer.
 */
export type CacheConfig = {
  /** Which cache backend to use: edge-local Cache API or global KV. */
  backend: CacheBackend;
  /** KV namespace binding (required when `backend` is `"kv"`). */
  kv?: KVNamespace;
  /** Default TTL for cached queries (e.g., `"30s"`, `"5m"`, `"1h"`). Defaults to `"60s"`. */
  ttl?: string;
  /** Stale-while-revalidate window (e.g., `"5m"`). */
  staleWhileRevalidate?: string;
  /** Table names that should never be cached. */
  exclude?: string[];
  /** Observability hook called on cache hits. */
  onHit?: (key: string, table: string) => void;
  /** Observability hook called on cache misses. */
  onMiss?: (key: string, table: string) => void;
  /** Observability hook called when tables are invalidated. */
  onInvalidate?: (tables: string[]) => void;
};

/**
 * Per-query cache control. Pass `false` to skip caching, or an options object to customize.
 */
export type QueryCacheOptions =
  | false
  | { ttl?: string; staleWhileRevalidate?: string; tags?: string[] };

// --- DB Config ---

/**
 * Configuration for {@link createDb}.
 */
export type DbConfig = {
  /** The Cloudflare D1 database binding. */
  d1: D1Database;
  /** Drizzle schema (`import * as schema` -- keys must match table variable names). */
  schema: Record<string, DrizzleTable>;
  /** Resolved permission grants for the current user's role. */
  grants: Grant[];
  /** The current user. `null` means anonymous (uses `"anonymous"` role for checks). */
  user: { id: string } | null;
  /** Cache configuration, or `false` to disable caching entirely. Defaults to `{ backend: "cache-api" }`. */
  cache?: CacheConfig | false;
};

// --- Query options ---

/** Options for `db.query(table).findMany()`. */
export type FindManyOptions = {
  /** Column selection (e.g., `{ id: true, title: true }`). */
  columns?: Record<string, boolean>;
  /** User-supplied filter condition (AND'd with permission filters). */
  where?: unknown;
  /** Ordering expression (e.g., `desc(posts.createdAt)`). */
  orderBy?: unknown;
  /** Maximum number of rows to return. */
  limit?: number;
  /** Number of rows to skip (for offset pagination). */
  offset?: number;
  /** Drizzle relational query includes (e.g., `{ comments: true }`). */
  with?: Record<string, unknown>;
  /** Per-query cache control. */
  cache?: QueryCacheOptions;
};

/** Options for `db.query(table).findFirst()`. Same as `FindManyOptions` without `limit`/`offset`. */
export type FindFirstOptions = Omit<FindManyOptions, "limit" | "offset">;

// --- Pagination ---

/** Parsed cursor-based pagination parameters from a request URL. */
export type CursorParams = {
  /** Discriminant for cursor pagination. */
  type: "cursor";
  /** The opaque cursor string, or `null` for the first page. */
  cursor: string | null;
  /** Maximum items per page. */
  limit: number;
};

/** Parsed offset-based pagination parameters from a request URL. */
export type OffsetParams = {
  /** Discriminant for offset pagination. */
  type: "offset";
  /** The 1-based page number. */
  page: number;
  /** Maximum items per page. */
  limit: number;
};

/** Union of cursor and offset pagination parameters. */
export type PaginateParams = CursorParams | OffsetParams;

/**
 * A page of results from cursor-based pagination.
 *
 * @typeParam T - The row type.
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
 * @typeParam T - The row type.
 */
export type OffsetPage<T> = {
  /** The items on this page. */
  items: T[];
  /** Total number of matching rows across all pages. */
  total: number;
  /** The current 1-based page number. */
  page: number;
  /** Total number of pages. */
  totalPages: number;
};

/** Options for `db.query(table).paginate()`. */
export type PaginateOptions = {
  /** Column selection. */
  columns?: Record<string, boolean>;
  /** User-supplied filter condition (AND'd with permission filters). */
  where?: unknown;
  /** Ordering expression. */
  orderBy?: unknown;
  /** Columns used for cursor-based ordering and comparison. */
  cursorColumns?: unknown[];
  /** Sort direction for cursor pagination. Defaults to `"desc"`. */
  orderDirection?: "asc" | "desc";
  /** Drizzle relational query includes. */
  with?: Record<string, unknown>;
  /** Per-query cache control. */
  cache?: QueryCacheOptions;
};

// --- Db type ---

/**
 * A permission-aware database instance bound to a specific user.
 *
 * All query and mutation methods return lazy `Operation` objects that check permissions at `.run()` time.
 */
export type Db = {
  /** Creates a query builder for reading rows from the given table. */
  query: (table: DrizzleTable) => QueryBuilder;
  /** Creates an insert builder for the given table. */
  insert: (table: DrizzleTable) => InsertBuilder;
  /** Creates an update builder for the given table. */
  update: (table: DrizzleTable) => UpdateBuilder;
  /** Creates a delete builder for the given table. */
  delete: (table: DrizzleTable) => DeleteBuilder;
  /** Returns a new `Db` instance that skips all permission checks. */
  unsafe: () => Db;
  /** Groups multiple operations into a single operation with merged, deduplicated permissions. */
  batch: (operations: Operation<unknown>[]) => Operation<unknown[]>;
  /** Cache control methods for manual invalidation. */
  cache: {
    /** Invalidate cached queries by tag names and/or table names. */
    invalidate: (options: { tags?: string[]; tables?: string[] }) => Promise<void>;
  };
};

/** Builder for read queries on a single table. */
export type QueryBuilder = {
  /** Returns an operation that fetches multiple rows. */
  findMany: (options?: FindManyOptions) => Operation<unknown[]>;
  /** Returns an operation that fetches the first matching row, or `undefined`. */
  findFirst: (options?: FindFirstOptions) => Operation<unknown | undefined>;
  /** Returns a paginated operation (cursor-based or offset-based). */
  paginate: (
    params: CursorParams | OffsetParams,
    options?: PaginateOptions,
  ) => Operation<CursorPage<unknown>> | Operation<OffsetPage<unknown>>;
};

/** Builder for insert operations. */
export type InsertBuilder = {
  /** Specifies the values to insert. */
  values: (values: Record<string, unknown>) => InsertReturningBuilder;
};

/** An insert operation that optionally returns the inserted row. */
export type InsertReturningBuilder = Operation<void> & {
  /** Chains `.returning()` to get the inserted row back. */
  returning: () => Operation<unknown>;
};

/** Builder for update operations. */
export type UpdateBuilder = {
  /** Specifies the column values to update. */
  set: (values: Record<string, unknown>) => UpdateWhereBuilder;
};

/** Intermediate builder requiring a WHERE condition for updates. */
export type UpdateWhereBuilder = {
  /** Specifies the WHERE condition (AND'd with permission filters). */
  where: (condition: unknown) => UpdateReturningBuilder;
};

/** An update operation that optionally returns the updated row. */
export type UpdateReturningBuilder = Operation<void> & {
  /** Chains `.returning()` to get the updated row back. */
  returning: () => Operation<unknown>;
};

/** Builder for delete operations. */
export type DeleteBuilder = {
  /** Specifies the WHERE condition (AND'd with permission filters). */
  where: (condition: unknown) => DeleteReturningBuilder;
};

/** A delete operation that optionally returns the deleted row. */
export type DeleteReturningBuilder = Operation<void> & {
  /** Chains `.returning()` to get the deleted row back. */
  returning: () => Operation<unknown>;
};
