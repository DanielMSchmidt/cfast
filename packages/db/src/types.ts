import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";

// --- Operation ---

export type Operation<TResult> = {
  permissions: PermissionDescriptor[];
  run: (params: Record<string, unknown>) => Promise<TResult>;
};

// --- Cache ---

export type CacheBackend = "cache-api" | "kv";

export type CacheConfig = {
  backend: CacheBackend;
  kv?: KVNamespace;
  ttl?: string;
  staleWhileRevalidate?: string;
  exclude?: string[];
  onHit?: (key: string, table: string) => void;
  onMiss?: (key: string, table: string) => void;
  onInvalidate?: (tables: string[]) => void;
};

export type QueryCacheOptions =
  | false
  | { ttl?: string; staleWhileRevalidate?: string; tags?: string[] };

// --- DB Config ---

export type DbConfig = {
  d1: D1Database;
  schema: Record<string, DrizzleTable>;
  grants: Grant[];
  user: { id: string } | null;
  cache?: CacheConfig | false;
};

// --- Query options ---

export type FindManyOptions = {
  columns?: Record<string, boolean>;
  where?: unknown;
  orderBy?: unknown;
  limit?: number;
  offset?: number;
  with?: Record<string, unknown>;
  cache?: QueryCacheOptions;
};

export type FindFirstOptions = Omit<FindManyOptions, "limit" | "offset">;

// --- Pagination ---

export type CursorParams = {
  type: "cursor";
  cursor: string | null;
  limit: number;
};

export type OffsetParams = {
  type: "offset";
  page: number;
  limit: number;
};

export type PaginateParams = CursorParams | OffsetParams;

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type OffsetPage<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

export type PaginateOptions = {
  columns?: Record<string, boolean>;
  where?: unknown;
  orderBy?: unknown;
  cursorColumns?: unknown[];
  with?: Record<string, unknown>;
  cache?: QueryCacheOptions;
};

// --- Db type ---

export type Db = {
  query: (table: DrizzleTable) => QueryBuilder;
  insert: (table: DrizzleTable) => InsertBuilder;
  update: (table: DrizzleTable) => UpdateBuilder;
  delete: (table: DrizzleTable) => DeleteBuilder;
  unsafe: () => Db;
  batch: (operations: Operation<unknown>[]) => Operation<unknown[]>;
  cache: {
    invalidate: (options: { tags?: string[]; tables?: string[] }) => Promise<void>;
  };
};

export type QueryBuilder = {
  findMany: (options?: FindManyOptions) => Operation<unknown[]>;
  findFirst: (options?: FindFirstOptions) => Operation<unknown | undefined>;
  paginate: ((params: CursorParams, options: PaginateOptions & { cursorColumns: unknown[] }) => Operation<CursorPage<unknown>>) &
    ((params: OffsetParams, options?: PaginateOptions) => Operation<OffsetPage<unknown>>);
};

export type InsertBuilder = {
  values: (values: Record<string, unknown>) => InsertReturningBuilder;
};

export type InsertReturningBuilder = Operation<void> & {
  returning: () => Operation<unknown>;
};

export type UpdateBuilder = {
  set: (values: Record<string, unknown>) => UpdateWhereBuilder;
};

export type UpdateWhereBuilder = {
  where: (condition: unknown) => UpdateReturningBuilder;
};

export type UpdateReturningBuilder = Operation<void> & {
  returning: () => Operation<unknown>;
};

export type DeleteBuilder = {
  where: (condition: unknown) => DeleteReturningBuilder;
};

export type DeleteReturningBuilder = Operation<void> & {
  returning: () => Operation<unknown>;
};
