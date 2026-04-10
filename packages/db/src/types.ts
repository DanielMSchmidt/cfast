import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import type {
  BuildQueryResult,
  ExtractTablesWithRelations,
  TableRelationalConfig,
  TablesRelationalConfig,
  Table,
} from "drizzle-orm";

// --- _can annotation ---

/**
 * The four CRUD actions used as keys in `_can` annotations.
 *
 * Matches the `CrudAction` type from `@cfast/permissions`. Redefined here
 * so `@cfast/db` does not import a runtime dependency from permissions just
 * for a type alias.
 */
export type CrudAction = "read" | "create" | "update" | "delete";

/**
 * Augments a row type with a `_can` object containing per-action booleans.
 *
 * Every query result from `findMany` / `findFirst` includes `_can` when the
 * `Db` was created with grants and a user. Each CRUD action maps to `true`
 * (permitted for this row), `false` (denied), or a row-dependent boolean
 * when the grant has a `where` clause.
 */
export type WithCan<T> = T & {
  _can: Record<CrudAction, boolean>;
};

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
  /**
   * Runs a callback inside a transaction with atomic commit-or-rollback semantics.
   *
   * All writes (`tx.insert`/`tx.update`/`tx.delete`) recorded inside the callback
   * are deferred and flushed together as a single atomic `db.batch([...])` when
   * the callback returns successfully. If the callback throws, pending writes are
   * discarded and the error is re-thrown — nothing reaches D1.
   *
   * Reads (`tx.query(...)`) execute eagerly so the caller can branch on their
   * results. **D1 does not provide snapshot isolation across async code**, so
   * reads inside a transaction can see concurrent writes. For concurrency-safe
   * read-modify-write (e.g. stock decrement), combine the transaction with a
   * relative SQL update and a WHERE guard:
   *
   * ```ts
   * await db.transaction(async (tx) => {
   *   // The WHERE guard ensures the decrement only applies when stock is
   *   // still >= qty at commit time. Two concurrent transactions cannot
   *   // both oversell because D1's atomic batch re-evaluates the WHERE.
   *   await tx.update(products)
   *     .set({ stock: sql`stock - ${qty}` })
   *     .where(and(eq(products.id, pid), gte(products.stock, qty)))
   *     .run();
   *   return tx.insert(orders).values({ productId: pid, qty }).returning().run();
   * });
   * ```
   *
   * Nested `db.transaction()` calls inside the callback are flattened into the
   * parent's pending queue so everything still commits atomically.
   *
   * @typeParam T - The return type of the callback.
   * @param callback - The transaction body. Receives a `tx` handle with
   *   `query`/`insert`/`update`/`delete` methods (no `unsafe`, `batch`, or
   *   `cache` — those are intentionally off-limits inside a transaction).
   * @returns A {@link TransactionResult} containing the callback's return value
   *   and transaction metadata (`meta.changes`, `meta.writeResults`), or rejects
   *   with whatever the callback threw (after rolling back pending writes).
   */
  transaction: <T>(callback: (tx: Tx<TSchema>) => Promise<T>) => Promise<TransactionResult<T>>;
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
  /**
   * Clears the per-instance `with` lookup cache so that the next query
   * re-runs every grant lookup function.
   *
   * In production this is rarely needed because each request gets a fresh
   * `Db` via `createDb()`. In tests that reuse a single `Db` across grant
   * mutations (e.g. inserting a new friendship and then querying recipes),
   * call this after the mutation to avoid stale lookup results.
   *
   * For finer-grained control, wrap each logical request in
   * {@link runWithLookupCache} instead -- that scopes the cache via
   * `AsyncLocalStorage` so it is automatically discarded at scope exit.
   *
   * @example
   * ```ts
   * const db = createDb({ ... });
   * await db.query(recipes).findMany().run(); // populates lookup cache
   * await db.insert(friendGrants).values({ ... }).run(); // adds new grant
   * db.clearLookupCache(); // drop stale lookups
   * await db.query(recipes).findMany().run(); // sees new grant
   * ```
   */
  clearLookupCache: () => void;
  /**
   * The Drizzle schema this Db was created with. Exposed for the seed engine
   * so `seed(db)` can introspect tables without a separate schema import.
   * @internal
   */
  readonly _schema: Record<string, unknown>;
};

// --- QueryBuilder ---

export type QueryBuilder<
  TTable extends DrizzleTable = DrizzleTable,
  TSchema extends Record<string, unknown> = Record<string, never>,
> = {
  findMany: <TConfig extends FindManyOptions = Record<string, never>, TRow = InferQueryResult<TSchema, TTable, TConfig>>(
    options?: TConfig,
  ) => Operation<WithCan<TRow>[]>;
  findFirst: <TConfig extends FindFirstOptions = Record<string, never>, TRow = InferQueryResult<TSchema, TTable, TConfig>>(
    options?: TConfig,
  ) => Operation<WithCan<TRow> | undefined>;
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
