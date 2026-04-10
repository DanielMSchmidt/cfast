/**
 * Schema-driven seed generator for `@cfast/db`.
 *
 * Introspects Drizzle schema metadata (column types, foreign keys, primary keys)
 * to auto-generate realistic test data using `@faker-js/faker` as a peer
 * dependency. Supports:
 *
 * - Column-level `.seed()` overrides via `seedConfig()` wrapper
 * - Table-level `.seed()` overrides via `tableSeed()` wrapper (count, per)
 * - Automatic FK resolution from generated parent rows
 * - `per` relational generation (N children per parent row)
 * - `ctx` API for parent access, ref, index, and all
 * - Topological sort for correct insert order
 * - Many-to-many deduplication
 * - Auth table detection for realistic emails
 * - SQL transcript generation
 *
 * @module seed-generator
 */

import { getTableColumns, getTableName } from "drizzle-orm";
import type { Table, Column } from "drizzle-orm";
import type { DrizzleTable } from "@cfast/permissions";
import type { Db } from "./types";

// ---------------------------------------------------------------------------
// Internal type helpers
// ---------------------------------------------------------------------------

/**
 * Casts a DrizzleTable to a form that `getTableColumns` / `getTableName`
 * accept. We know at runtime these are real Drizzle tables (validated by
 * `isTable()`), but the `DrizzleTable` alias from `@cfast/permissions` is
 * typed as a broad `object` which doesn't satisfy Drizzle's narrower
 * `Table<TableConfig<...>>` constraint.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = Table<any>;

function asTable(t: DrizzleTable): AnyTable {
  return t as unknown as AnyTable;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumn = Column<any, any, any>;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Faker instance type -- matches `@faker-js/faker`'s default export. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Faker = any;

/**
 * Context passed to column-level seed functions as the second argument.
 */
export type SeedContext = {
  /** The parent row when `per` is used on the table. `undefined` for root tables. */
  parent: Record<string, unknown> | undefined;
  /** Pick a random existing row from any table already seeded. */
  ref: (table: DrizzleTable) => Record<string, unknown>;
  /** Zero-based position within the current batch (per-parent or global). */
  index: number;
  /** All generated rows for the given table (available after that table is seeded). */
  all: (table: DrizzleTable) => Record<string, unknown>[];
};

/** Column-level seed function. Receives faker instance and optional context. */
export type ColumnSeedFn = (faker: Faker, ctx: SeedContext) => unknown;

/** Table-level seed config attached via `tableSeed()`. */
export type TableSeedConfig = {
  /** Total count (or per-parent count when `per` is set). */
  count: number;
  /** Generate `count` rows per row in this parent table. */
  per?: DrizzleTable;
};

/** Options for `db.seed().run()`. */
export type SeedRunOptions = {
  /** If provided, write the equivalent SQL INSERT statements to this path. */
  transcript?: string;
};

// ---------------------------------------------------------------------------
// Side-channel storage (WeakMap-based)
// ---------------------------------------------------------------------------

/**
 * Stores column-level seed functions keyed by the column builder's `config`
 * object. Drizzle shares the same `config` reference between the builder
 * (what the user passes to `sqliteTable(...)`) and the built column (what
 * `getTableColumns()` returns), so we can look up the seed fn from either
 * side. This avoids the builder-vs-column identity mismatch.
 */
const columnSeedMap = new WeakMap<object, ColumnSeedFn>();
const tableSeedMap = new WeakMap<DrizzleTable, TableSeedConfig>();

/**
 * Resolves the seed function for a built column by checking the shared
 * `config` object in the WeakMap.
 */
function getColumnSeedFn(
  col: AnyColumn,
): ColumnSeedFn | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (col as any).config;
  if (config) {
    const fn = columnSeedMap.get(config as object);
    if (fn) return fn;
  }
  // Fallback: try the column object itself
  return columnSeedMap.get(col);
}

/**
 * Attaches a seed generator function to a Drizzle column.
 *
 * The column object is returned unmodified so this can be used inline in
 * schema definitions without breaking Drizzle types.
 *
 * @example
 * ```ts
 * const posts = sqliteTable("posts", {
 *   title: seedConfig(text("title"), f => f.lorem.sentence()),
 * });
 * ```
 */
export function seedConfig<T>(column: T, fn: ColumnSeedFn): T {
  // Store on the builder's config object (survives the builder->column transform)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (column as any).config;
  if (config && typeof config === "object") {
    columnSeedMap.set(config as object, fn);
  }
  // Also store on the object itself as fallback
  columnSeedMap.set(column as object, fn);
  return column;
}

/**
 * Attaches table-level seed config (count, per) to a Drizzle table.
 *
 * @example
 * ```ts
 * const posts = tableSeed(
 *   sqliteTable("posts", { ... }),
 *   { count: 5, per: users },
 * );
 * ```
 */
export function tableSeed<T extends DrizzleTable>(
  table: T,
  config: TableSeedConfig,
): T {
  tableSeedMap.set(table, config);
  return table;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** FK info extracted from Drizzle's internal symbol. */
type FkInfo = {
  /** Column name in the current table (SQL name). */
  columnName: string;
  /** JS key of the column in the current table. */
  columnKey: string;
  /** Referenced table (Drizzle object). */
  foreignTable: DrizzleTable;
  /** Referenced column name (SQL name). */
  foreignColumnName: string;
};

/** Extracts all inline foreign key definitions from a Drizzle table. */
function extractForeignKeys(table: DrizzleTable): FkInfo[] {
  const fkSymbol = Object.getOwnPropertySymbols(table).find((s) =>
    s.toString().includes("InlineForeignKeys"),
  );
  if (!fkSymbol) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fks = (table as any)[fkSymbol] as any[];
  const columns = getTableColumns(asTable(table));
  const sqlNameToKey = new Map<string, string>();
  for (const [key, col] of Object.entries(columns)) {
    sqlNameToKey.set((col as AnyColumn).name, key);
  }

  const result: FkInfo[] = [];
  for (const fk of fks) {
    if (typeof fk?.reference !== "function") continue;
    const ref = fk.reference();
    if (!ref?.foreignTable || !ref.foreignColumns?.length || !ref.columns?.length) continue;
    const colSqlName = (ref.columns[0] as AnyColumn).name;
    result.push({
      columnName: colSqlName,
      columnKey: sqlNameToKey.get(colSqlName) ?? colSqlName,
      foreignTable: ref.foreignTable as DrizzleTable,
      foreignColumnName: (ref.foreignColumns[0] as AnyColumn).name,
    });
  }
  return result;
}

/** Returns the JS key for the primary key column(s). Only supports single PK. */
function findPrimaryKeyColumn(
  table: DrizzleTable,
): { key: string; column: AnyColumn } | undefined {
  const columns = getTableColumns(asTable(table));
  for (const [key, col] of Object.entries(columns)) {
    if ((col as AnyColumn).primary) {
      return { key, column: col as AnyColumn };
    }
  }
  return undefined;
}

/** Generate a value based on column type when no seed function is provided. */
function generateDefaultValue(
  col: AnyColumn,
  faker: Faker,
  isPk: boolean,
  isNullable: boolean,
): unknown {
  // Primary keys get UUIDs
  if (isPk) return faker.string.uuid();

  // Nullable columns get null ~10% of the time
  if (isNullable && faker.number.int({ min: 0, max: 9 }) === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { dataType, columnType } = col as any;

  if (columnType === "SQLiteBoolean" || dataType === "boolean") {
    return faker.datatype.boolean();
  }
  if (columnType === "SQLiteTimestamp" || dataType === "date") {
    return faker.date.recent();
  }
  if (columnType === "SQLiteReal") {
    return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
  }
  if (columnType === "SQLiteInteger" || dataType === "number") {
    return faker.number.int({ min: 0, max: 10000 });
  }
  if (columnType === "SQLiteText" || dataType === "string") {
    return faker.lorem.words(3);
  }
  // Blob/buffer -- return raw string for Workers compatibility
  if (dataType === "buffer") {
    return faker.string.alphanumeric(16);
  }

  return faker.lorem.words(2);
}

/**
 * Known auth table names from `@cfast/auth`. When we detect a table named
 * "users" in the schema, we generate realistic `rolename@example.com` emails.
 */
const AUTH_TABLE_NAME = "users";

function isAuthUsersTable(table: DrizzleTable): boolean {
  return getTableName(asTable(table)) === AUTH_TABLE_NAME;
}

function generateAuthEmail(faker: Faker, index: number): string {
  const roles = ["admin", "user", "editor", "viewer", "moderator"];
  if (index < roles.length) {
    return `${roles[index]}@example.com`;
  }
  return faker.internet.email().toLowerCase();
}

// ---------------------------------------------------------------------------
// Topological sort
// ---------------------------------------------------------------------------

/**
 * Topologically sorts tables so parents are seeded before children.
 * Uses Kahn's algorithm. Respects both FK and `per` dependencies.
 */
function topologicalSort(
  tables: DrizzleTable[],
  fkMap: Map<DrizzleTable, FkInfo[]>,
): DrizzleTable[] {
  const tableSet = new Set(tables);

  // Build adjacency: dep -> [tables that depend on it]
  const inDegree = new Map<DrizzleTable, number>();
  const dependents = new Map<DrizzleTable, Set<DrizzleTable>>();
  for (const t of tables) {
    if (!inDegree.has(t)) inDegree.set(t, 0);
    if (!dependents.has(t)) dependents.set(t, new Set());
  }

  for (const t of tables) {
    const fks = fkMap.get(t) ?? [];
    const deps = new Set<DrizzleTable>();

    // FK dependencies
    for (const fk of fks) {
      if (tableSet.has(fk.foreignTable) && fk.foreignTable !== t) {
        deps.add(fk.foreignTable);
      }
    }

    // `per` dependency
    const tConfig = tableSeedMap.get(t);
    if (tConfig?.per && tableSet.has(tConfig.per) && tConfig.per !== t) {
      deps.add(tConfig.per);
    }

    inDegree.set(t, deps.size);
    for (const dep of deps) {
      if (!dependents.has(dep)) dependents.set(dep, new Set());
      dependents.get(dep)!.add(t);
    }
  }

  const queue: DrizzleTable[] = [];
  for (const [t, deg] of inDegree) {
    if (deg === 0) queue.push(t);
  }

  const sorted: DrizzleTable[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const dep of dependents.get(current) ?? []) {
      const newDeg = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, newDeg);
      if (newDeg === 0) queue.push(dep);
    }
  }

  // If there's a cycle, append remaining tables at the end
  for (const t of tables) {
    if (!sorted.includes(t)) sorted.push(t);
  }

  return sorted;
}

// ---------------------------------------------------------------------------
// Many-to-many deduplication
// ---------------------------------------------------------------------------

/**
 * Detects if a table has at least 2 FKs. If so, returns the FK column keys
 * for composite-key deduplication (prevents duplicate join rows).
 */
function getDeduplicationKeys(
  _table: DrizzleTable,
  fks: FkInfo[],
): string[] | null {
  if (fks.length >= 2) {
    return fks.map((f) => f.columnKey);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main seed engine
// ---------------------------------------------------------------------------

/**
 * Generates seed data for all tables in a schema using Drizzle column metadata
 * and a `@faker-js/faker` instance.
 *
 * @param schema - The full Drizzle schema (`import * as schema from "./schema"`).
 * @param faker - A `@faker-js/faker` Faker instance.
 * @returns An engine with `generate()` and `run(db)` methods.
 */
export function createSeedEngine(
  schema: Record<string, unknown>,
  faker: Faker,
) {
  // Discover all Drizzle tables in the schema
  const tables: DrizzleTable[] = [];
  for (const value of Object.values(schema)) {
    if (isTable(value)) {
      tables.push(value as DrizzleTable);
    }
  }

  // Build FK map
  const fkMap = new Map<DrizzleTable, FkInfo[]>();
  for (const table of tables) {
    fkMap.set(table, extractForeignKeys(table));
  }

  // Topologically sort
  const sorted = topologicalSort(tables, fkMap);

  return {
    tables: sorted,
    fkMap,

    /**
     * Generate rows for all tables (or a subset).
     * Returns a map of table -> rows[].
     */
    generate(
      tableOverrides?: Map<DrizzleTable, { count: number }>,
    ): Map<DrizzleTable, Record<string, unknown>[]> {
      const generated = new Map<DrizzleTable, Record<string, unknown>[]>();

      for (const table of sorted) {
        const config = tableOverrides?.get(table) ?? tableSeedMap.get(table);
        const fks = fkMap.get(table) ?? [];
        const columns = getTableColumns(asTable(table));
        const pk = findPrimaryKeyColumn(table);
        const isAuth = isAuthUsersTable(table);
        const dedupKeys = getDeduplicationKeys(table, fks);

        const count = config?.count ?? 10;
        const perTable = (config as TableSeedConfig | undefined)?.per;
        const parentRows = perTable ? (generated.get(perTable) ?? []) : [undefined];

        const allRows: Record<string, unknown>[] = [];
        const seenCombos = new Set<string>();

        let globalIndex = 0;
        for (const parentRow of parentRows) {
          for (let i = 0; i < count; i++) {
            const ctx: SeedContext = {
              parent: parentRow as Record<string, unknown> | undefined,
              ref: (t: DrizzleTable) => {
                const rows = generated.get(t);
                if (!rows || rows.length === 0) {
                  throw new Error(
                    `seedConfig ctx.ref(${getTableName(asTable(t))}): no rows generated yet`,
                  );
                }
                return rows[faker.number.int({ min: 0, max: rows.length - 1 })]!;
              },
              index: i,
              all: (t: DrizzleTable) => generated.get(t) ?? [],
            };

            const row: Record<string, unknown> = {};

            for (const [key, col] of Object.entries(columns)) {
              const colObj = col as AnyColumn;
              const isPk = pk?.key === key;
              const isNullable = !colObj.notNull;

              // Check for column-level seed config
              const customSeedFn = getColumnSeedFn(colObj);
              if (customSeedFn) {
                row[key] = customSeedFn(faker, ctx);
                continue;
              }

              // Check for FK -- resolve from generated parent
              const fk = fks.find((f) => f.columnKey === key);
              if (fk) {
                // If this is a `per` table and the FK points to the parent table
                if (
                  perTable &&
                  parentRow &&
                  getTableName(asTable(fk.foreignTable)) ===
                    getTableName(asTable(perTable))
                ) {
                  const foreignColumns = getTableColumns(asTable(fk.foreignTable));
                  const foreignKey = Object.entries(foreignColumns).find(
                    ([, c]) => (c as AnyColumn).name === fk.foreignColumnName,
                  );
                  if (foreignKey) {
                    row[key] = (parentRow as Record<string, unknown>)[foreignKey[0]];
                    continue;
                  }
                }

                // Otherwise, pick a random existing row from the referenced table
                const refRows = generated.get(fk.foreignTable);
                if (refRows && refRows.length > 0) {
                  const randomRef =
                    refRows[faker.number.int({ min: 0, max: refRows.length - 1 })]!;
                  const foreignColumns = getTableColumns(asTable(fk.foreignTable));
                  const foreignKey = Object.entries(foreignColumns).find(
                    ([, c]) => (c as AnyColumn).name === fk.foreignColumnName,
                  );
                  if (foreignKey) {
                    row[key] = randomRef[foreignKey[0]];
                    continue;
                  }
                }
              }

              // Auth users get special email handling
              if (isAuth && key === "email") {
                row[key] = generateAuthEmail(faker, globalIndex);
                continue;
              }
              if (isAuth && key === "name") {
                row[key] = faker.person.fullName();
                continue;
              }

              // Column has a $defaultFn -- skip, Drizzle will fill it
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const colAny = colObj as any;
              if (colAny.defaultFn || colAny.onUpdateFn) {
                continue;
              }

              // Column has a static default -- skip
              if (colAny.hasDefault && colAny.default !== undefined) {
                continue;
              }

              row[key] = generateDefaultValue(colObj, faker, isPk, isNullable);
            }

            // Many-to-many deduplication
            if (dedupKeys) {
              const comboKey = dedupKeys.map((k) => String(row[k])).join(":");
              if (seenCombos.has(comboKey)) continue;
              seenCombos.add(comboKey);
            }

            allRows.push(row);
            globalIndex++;
          }
        }

        generated.set(table, allRows);
      }

      return generated;
    },

    /**
     * Generate and insert seed data into the database.
     */
    async run(
      db: Db,
      options?: SeedRunOptions & {
        tableOverrides?: Map<DrizzleTable, { count: number }>;
      },
    ): Promise<Map<DrizzleTable, Record<string, unknown>[]>> {
      const generated = this.generate(options?.tableOverrides);
      const unsafeDb = db.unsafe();
      const transcriptLines: string[] = [];

      for (const table of sorted) {
        const rows = generated.get(table);
        if (!rows || rows.length === 0) continue;

        const tableName = getTableName(asTable(table));

        // Build SQL transcript if requested
        if (options?.transcript) {
          for (const row of rows) {
            const colNames = Object.keys(row);
            const values = colNames.map((k) => {
              const v = row[k];
              if (v === null) return "NULL";
              if (typeof v === "number" || typeof v === "boolean") return String(v);
              if (v instanceof Date) return `'${v.toISOString()}'`;
              return `'${String(v).replace(/'/g, "''")}'`;
            });
            transcriptLines.push(
              `INSERT INTO "${tableName}" (${colNames.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`,
            );
          }
        }

        // Insert rows
        const ops = rows.map((row) =>
          unsafeDb.insert(table).values(row as Record<string, unknown>),
        );
        if (ops.length === 1) {
          await ops[0]!.run({});
        } else {
          await unsafeDb.batch(ops).run({});
        }
      }

      // Write transcript if requested. Dynamic import + try/catch so the
      // module works in Workers (where node:fs is unavailable) and in Node
      // (scripts, tests) without a hard dependency.
      if (options?.transcript && transcriptLines.length > 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fs: any = await new Function(
            'return import("node:fs/promises")',
          )();
          await fs.writeFile(
            options.transcript,
            transcriptLines.join("\n") + "\n",
            "utf-8",
          );
        } catch {
          // In Workers environments, fs is unavailable -- silently skip.
        }
      }

      return generated;
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers for single-table seed
// ---------------------------------------------------------------------------

/**
 * Creates a single-table seed generator for use with `db.query(table).seed(n)`.
 */
export function createSingleTableSeed(
  schema: Record<string, unknown>,
  faker: Faker,
  table: DrizzleTable,
  count: number,
) {
  const engine = createSeedEngine(schema, faker);
  const overrides = new Map<DrizzleTable, { count: number }>();
  overrides.set(table, { count });

  // Set count to 0 for all other tables to avoid generating them
  for (const t of engine.tables) {
    if (t !== table && !overrides.has(t)) {
      overrides.set(t, { count: 0 });
    }
  }

  return {
    generate: () => engine.generate(overrides),
    run: (db: Db, options?: SeedRunOptions) =>
      engine.run(db, { ...options, tableOverrides: overrides }),
  };
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

/**
 * Checks if a value is a Drizzle table by looking for the IsDrizzleTable symbol.
 */
function isTable(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const symbols = Object.getOwnPropertySymbols(value);
  return symbols.some((s) => s.toString().includes("IsDrizzleTable"));
}

// Re-export for external use
export { extractForeignKeys, topologicalSort, findPrimaryKeyColumn, isTable };
