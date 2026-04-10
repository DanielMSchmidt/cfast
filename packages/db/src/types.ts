import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import type {
  BuildQueryResult,
  ExtractTablesWithRelations,
  TableRelationalConfig,
  TablesRelationalConfig,
  Table,
} from "drizzle-orm";

// --- Row inference helpers ---

export type InferRow<TTable> = TTable extends { $inferSelect: infer R }
  ? R
  : Record<string, unknown>;

// --- Relation inference helpers (#240) ---

/** @internal */
type FindTableKeyByName<
  TSchema extends TablesRelationalConfig,
  TTableName extends string,
> = {
  [K in keyof TSchema]: TSchema[K]["dbName"] extends TTableName ? K : never;
}[keyof TSchema];

/** @internal */
type LookupTableConfig<
  TFullSchema extends Record<string, unknown>,
  TTable,
> = TTable extends Table<infer TTableConfig>
  ? FindTableKeyByName<
      ExtractTablesWithRelations<TFullSchema>,
      TTableConfig["name"]
    > extends infer TKey extends keyof ExtractTablesWithRelations<TFullSchema>
    ? ExtractTablesWithRelations<TFullSchema>[TKey]
    : never
  : never;

export type InferQueryResult<
  TFullSchema extends Record<string, unknown>,
  TTable,
  TConfig,
> = [TFullSchema] extends [Record<string, never>]
  ? InferRow<TTable>
  : LookupTableConfig<TFullSchema, TTable> extends infer TTableConfig extends TableRelationalConfig
    ? BuildQueryResult<
        ExtractTablesWithRelations<TFullSchema>,
        TTableConfig,
        TConfig extends Record<string, unknown> ? TConfig : true
      >
    : InferRow<TTable>;

// --- Operation ---

export type Operation<TResult> = {
  permissions: PermissionDescriptor[];
  run: (params?: Record<string, unknown>) => Promise<TResult>;
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
  | {
      ttl?: string;
      staleWhileRevalidate?: string;
      tags?: string[];
    };

// --- DB Config ---

export type DbConfig<TSchema extends Record<string, unknown> = Record<string, unknown>> = {
  d1: D1Database;
  schema: TSchema;
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

export type CursorParams = { type: "cursor"; cursor: string | null; limit: number };
export type OffsetParams = { type: "offset"; page: number; limit: number };
export type PaginateParams = CursorParams | OffsetParams;
export type CursorPage<T> = { items: T[]; nextCursor: string | null };
export type OffsetPage<T> = { items: T[]; total: number; page: number; totalPages: number };

export type PaginateOptions = {
  columns?: Record<string, boolean>;
  where?: unknown;
  orderBy?: unknown;
  cursorColumns?: unknown[];
  orderDirection?: "asc" | "desc";
  with?: Record<string, unknown>;
  cache?: QueryCacheOptions;
};

// --- Transaction result ---

export type TransactionResult<T> = {
  result: T;
  meta: {
    changes: number;
    writeResults: D1Result[];
  };
};

// --- Transaction handle ---

export type Tx<TSchema extends Record<string, unknown> = Record<string, never>> = {
  query: <TTable extends DrizzleTable>(table: TTable) => QueryBuilder<TTable, TSchema>;
  insert: <TTable extends DrizzleTable>(table: TTable) => InsertBuilder<TTable>;
  update: <TTable extends DrizzleTable>(table: TTable) => UpdateBuilder<TTable>;
  delete: <TTable extends DrizzleTable>(table: TTable) => DeleteBuilder<TTable>;
  transaction: <T>(callback: (tx: Tx<TSchema>) => Promise<T>) => Promise<T>;
};

// --- Db type ---

export type Db<TSchema extends Record<string, unknown> = Record<string, never>> = {
  query: <TTable extends DrizzleTable>(table: TTable) => QueryBuilder<TTable, TSchema>;
  insert: <TTable extends DrizzleTable>(table: TTable) => InsertBuilder<TTable>;
  update: <TTable extends DrizzleTable>(table: TTable) => UpdateBuilder<TTable>;
  delete: <TTable extends DrizzleTable>(table: TTable) => DeleteBuilder<TTable>;
  unsafe: () => Db<TSchema>;
  batch: (operations: Operation<unknown>[]) => Operation<unknown[]>;
  transaction: <T>(callback: (tx: Tx<TSchema>) => Promise<T>) => Promise<T>;
  cache: { invalidate: (options: { tags?: string[]; tables?: string[] }) => Promise<void> };
  clearLookupCache: () => void;
};

// --- QueryBuilder ---

export type QueryBuilder<
  TTable extends DrizzleTable = DrizzleTable,
  TSchema extends Record<string, unknown> = Record<string, never>,
> = {
  findMany: <TConfig extends FindManyOptions = Record<string, never>, TRow = InferQueryResult<TSchema, TTable, TConfig>>(
    options?: TConfig,
  ) => Operation<TRow[]>;
  findFirst: <TConfig extends FindFirstOptions = Record<string, never>, TRow = InferQueryResult<TSchema, TTable, TConfig>>(
    options?: TConfig,
  ) => Operation<TRow | undefined>;
  paginate: <TRow = InferRow<TTable>>(
    params: CursorParams | OffsetParams,
    options?: PaginateOptions,
  ) => Operation<CursorPage<TRow>> | Operation<OffsetPage<TRow>>;
};

// --- Mutation builders ---

export type InsertBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  values: (values: Record<string, unknown>) => InsertReturningBuilder<TTable>;
};

export type InsertReturningBuilder<TTable extends DrizzleTable = DrizzleTable> =
  Operation<void> & { returning: () => Operation<InferRow<TTable>> };

export type UpdateBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  set: (values: Record<string, unknown>) => UpdateWhereBuilder<TTable>;
};

export type UpdateWhereBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  where: (condition: unknown) => UpdateReturningBuilder<TTable>;
};

export type UpdateReturningBuilder<TTable extends DrizzleTable = DrizzleTable> =
  Operation<void> & { returning: () => Operation<InferRow<TTable>> };

export type DeleteBuilder<TTable extends DrizzleTable = DrizzleTable> = {
  where: (condition: unknown) => DeleteReturningBuilder<TTable>;
};

export type DeleteReturningBuilder<TTable extends DrizzleTable = DrizzleTable> =
  Operation<void> & { returning: () => Operation<InferRow<TTable>> };
