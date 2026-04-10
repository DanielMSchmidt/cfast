import type { DrizzleTable } from "@cfast/permissions";
import type { Db, InferRow } from "./types";
import { createSeedEngine } from "./seed-generator";
import type { SeedRunOptions, ColumnSeedFn, TableSeedConfig } from "./seed-generator";
import { columnSeedMap, tableSeedMap } from "./seed-generator";

// ---------------------------------------------------------------------------
// Module augmentation: add `.seed()` to Drizzle column builders
// ---------------------------------------------------------------------------

declare module "drizzle-orm/sqlite-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SQLiteColumnBuilder<T, TRuntimeConfig, TTypeConfig, TExtraConfig> {
    /**
     * Attaches a seed generator function to this column.
     *
     * @example
     * ```ts
     * title: text("title").seed(f => f.lorem.sentence()),
     * ```
     */
    seed(fn: ColumnSeedFn): this;
  }
}

// ---------------------------------------------------------------------------
// Prototype patching: `.seed()` on column builders
// ---------------------------------------------------------------------------
//
// This side-effect runs when `@cfast/db/seed` is imported. It patches
// `SQLiteColumnBuilder.prototype` so every SQLite column builder instance
// gains a `.seed()` method that writes to the shared `columnSeedMap`.

import { SQLiteColumnBuilder } from "drizzle-orm/sqlite-core/columns/common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(SQLiteColumnBuilder.prototype as any).seed = function (fn: ColumnSeedFn) {
  // Store on the builder's config object (survives the builder->column transform)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (this as any).config;
  if (config && typeof config === "object") {
    columnSeedMap.set(config as object, fn);
  }
  // Also store on the object itself as fallback
  columnSeedMap.set(this as object, fn);
  return this;
};

// ---------------------------------------------------------------------------
// Table-level `.seed()` via `table()` wrapper
// ---------------------------------------------------------------------------
//
// Drizzle tables are plain objects (not class instances), so we can't patch
// a prototype. Instead we export a `table()` wrapper that calls
// `sqliteTable()` and adds a `.seed()` method to the returned object.

import { sqliteTable } from "drizzle-orm/sqlite-core";
import type {
  SQLiteColumnBuilderBase,
  SQLiteTableExtraConfigValue,
} from "drizzle-orm/sqlite-core";
import type { BuildColumns } from "drizzle-orm/column-builder";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core/table";

/**
 * Type representing a Drizzle table with an added `.seed()` method.
 * The `.seed()` method returns the same table reference for chaining.
 */
export type SeedableTable<T> = T & {
  seed(config: TableSeedConfig): SeedableTable<T>;
};

/**
 * Creates a SQLite table with a `.seed()` method for configuring
 * seed generation. Drop-in replacement for `sqliteTable()` from
 * `drizzle-orm/sqlite-core`.
 *
 * @example
 * ```ts
 * import { table } from "@cfast/db/seed";
 *
 * const posts = table("posts", {
 *   title: text("title").seed(f => f.lorem.sentence()),
 *   authorId: text("author_id").references(() => users.id),
 * }).seed({ count: 5, per: users });
 * ```
 */
export function table<
  TTableName extends string,
  TColumnsMap extends Record<string, SQLiteColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
  extraConfig?: (
    self: BuildColumns<TTableName, TColumnsMap, "sqlite">,
  ) => SQLiteTableExtraConfigValue[],
): SeedableTable<
  SQLiteTableWithColumns<{
    name: TTableName;
    schema: undefined;
    columns: BuildColumns<TTableName, TColumnsMap, "sqlite">;
    dialect: "sqlite";
  }>
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = sqliteTable(name, columns, extraConfig as any) as any;
  t.seed = (config: TableSeedConfig) => {
    tableSeedMap.set(t as DrizzleTable, config);
    return t;
  };
  return t;
}

// ---------------------------------------------------------------------------
// Re-exports from seed-generator
// ---------------------------------------------------------------------------

export {
  seedConfig,
  tableSeed,
  createSeedEngine,
  createSingleTableSeed,
  extractForeignKeys,
  topologicalSort,
  findPrimaryKeyColumn,
  isTable,
  columnSeedMap,
  tableSeedMap,
} from "./seed-generator";
export type {
  Faker,
  SeedContext,
  ColumnSeedFn,
  TableSeedConfig,
  SeedRunOptions,
} from "./seed-generator";

/**
 * One-liner seed: introspects the schema from the `db` instance, generates
 * realistic data via the bundled `@faker-js/faker`, and inserts it.
 *
 * @example
 * ```ts
 * import { seed } from "@cfast/db/seed";
 * await seed(db);
 * ```
 *
 * @param db - A {@link Db} instance created via `createDb()`.
 * @param options - Optional {@link SeedRunOptions} (e.g. `{ transcript: "./seed.sql" }`).
 */
export async function seed(
  db: Db,
  options?: SeedRunOptions,
): Promise<void> {
  const engine = createSeedEngine(db._schema);
  await engine.run(db, options);
}

/**
 * A single seed entry -- every row in `rows` is inserted into `table` at seed
 * time. Row shape is inferred from the Drizzle table so typos in column names
 * are caught by `tsc` instead of failing at runtime when `INSERT` rejects
 * the statement.
 *
 * @typeParam TTable - The Drizzle table reference (e.g. `typeof usersTable`).
 */
export type SeedEntry<TTable extends DrizzleTable = DrizzleTable> = {
  /**
   * The Drizzle table to insert into. Must be imported from your schema
   * (`import { users } from "~/db/schema"`) rather than passed as a string
   * so the helper can infer row types and forward the reference to
   * `db.insert()`.
   */
  table: TTable;
  /**
   * Rows to insert. The row shape is inferred from the table's
   * `$inferSelect` -- making a typo in a column name is a compile-time error.
   *
   * Entries are inserted in the order they appear, which lets you control
   * foreign-key ordering just by ordering your `entries` array
   * (`{ users }` before `{ posts }`, etc.).
   */
  rows: readonly InferRow<TTable>[];
};

/**
 * Configuration passed to {@link defineSeed}.
 */
export type SeedConfig = {
  /**
   * Ordered list of seed entries. Each entry is flushed as a batched insert
   * in list order, so place parent tables (users, orgs) before child tables
   * (posts, memberships) that reference them via foreign keys.
   */
  entries: readonly SeedEntry[];
};

/**
 * The compiled seed returned by {@link defineSeed}.
 *
 * Holds a frozen copy of the entry list so runner callers can introspect
 * what would be seeded, plus a `run(db)` method that actually executes the
 * inserts against a real {@link Db} instance.
 */
export type Seed = {
  /** The frozen list of entries this seed will insert, in order. */
  readonly entries: readonly SeedEntry[];
  /**
   * Executes every entry against the given {@link Db} in the order they were
   * declared. Uses `db.unsafe()` internally so seed scripts don't need
   * their own grants plumbing -- seeding is a system task by definition.
   *
   * Entries with an empty `rows` array are skipped so callers can leave
   * placeholder entries in the config without crashing the seed.
   *
   * @param db - A {@link Db} instance, typically created once at the top
   *   of a `scripts/seed.ts` file via `createDb({...})`.
   */
  run: (db: Db) => Promise<void>;
};

/**
 * Declares a database seed in a portable, type-safe way.
 *
 * The canonical replacement for hand-rolled `scripts/seed.ts` files that
 * called `db.mutate("tablename")` (a method that never existed) or reached
 * straight into raw Drizzle. Use the scaffolded `scripts/seed.ts` in a
 * `create-cfast` project for a ready-made example.
 *
 * @example
 * ```ts
 * // scripts/seed.ts
 * import { defineSeed, createDb } from "@cfast/db";
 * import * as schema from "~/db/schema";
 *
 * const seed = defineSeed({
 *   entries: [
 *     {
 *       table: schema.users,
 *       rows: [
 *         { id: "u-1", email: "ada@example.com", name: "Ada" },
 *         { id: "u-2", email: "grace@example.com", name: "Grace" },
 *       ],
 *     },
 *     {
 *       table: schema.posts,
 *       rows: [
 *         { id: "p-1", authorId: "u-1", title: "Hello" },
 *       ],
 *     },
 *   ],
 * });
 *
 * // In a worker/runner that already has a real D1 binding:
 * const db = createDb({ d1, schema, grants: [], user: null });
 * await seed.run(db);
 * ```
 *
 * @param config - The {@link SeedConfig} with the ordered list of entries.
 * @returns A {@link Seed} with a `.run(db)` executor.
 */
export function defineSeed(config: SeedConfig): Seed {
  const entries = Object.freeze(
    config.entries.map((entry) => ({
      table: entry.table,
      rows: Object.freeze([...entry.rows]),
    })),
  ) as readonly SeedEntry[];

  return {
    entries,
    async run(db: Db): Promise<void> {
      // Seeding is a system task -- there is no authenticated user and no
      // grants to apply. Hop through `db.unsafe()` so permission checks
      // don't reject `INSERT` statements that would otherwise need a
      // write grant for the anonymous role.
      const unsafeDb = db.unsafe();
      for (const entry of entries) {
        if (entry.rows.length === 0) continue;
        // `@cfast/db`'s `InsertBuilder.values()` takes a single row at a
        // time. We batch them into one atomic `db.batch([...])` per table
        // so a failed insert rolls back the rest of the entry, and we
        // still only pay one round-trip to D1 per table instead of one
        // per row.
        const ops = entry.rows.map((row) =>
          unsafeDb
            .insert(entry.table)
            .values(row as unknown as Record<string, unknown>),
        );
        if (ops.length === 1) {
          await ops[0]!.run({});
        } else {
          await unsafeDb.batch(ops).run({});
        }
      }
    },
  };
}
