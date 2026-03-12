import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { getTableColumns, getTableName } from "drizzle-orm";
import type {
  AdminColumnConfig,
  AdminTableMeta,
  TableOverrides,
} from "./types.js";

/**
 * Auth-related tables that are auto-excluded from the admin UI.
 * These tables are managed by @cfast/auth and should not be editable directly.
 */
const AUTO_EXCLUDED_TABLES = new Set([
  "session",
  "account",
  "verification",
  "passkey",
]);

/**
 * Convert a snake_case or camelCase name to Title Case with pluralization.
 *
 * Examples:
 *   "blog_post" -> "Blog Posts"
 *   "user" -> "Users"
 *   "category" -> "Categories"
 */
export function tableNameToLabel(name: string): string {
  // Split on underscores and camelCase boundaries
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .split("_")
    .filter(Boolean);

  if (words.length === 0) return name;

  // Title-case each word
  const titled = words.map(
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );

  // Pluralize the last word
  const lastIndex = titled.length - 1;
  titled[lastIndex] = pluralize(titled[lastIndex]);

  return titled.join(" ");
}

/**
 * Simple English pluralization. Covers the common cases
 * that appear in database table names.
 */
function pluralize(word: string): string {
  // Words already ending in a common plural suffix — don't double-pluralize
  const lower = word.toLowerCase();
  if (
    lower.endsWith("es") ||
    lower.endsWith("ies") ||
    (lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("us"))
  ) {
    return word;
  }
  if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z")) {
    return word + "es";
  }
  if (word.endsWith("sh") || word.endsWith("ch")) {
    return word + "es";
  }
  if (
    word.endsWith("y") &&
    word.length > 1 &&
    !isVowel(word.charAt(word.length - 2))
  ) {
    return word.slice(0, -1) + "ies";
  }
  return word + "s";
}

function isVowel(ch: string): boolean {
  return "aeiouAEIOU".includes(ch);
}

/**
 * Convert a column name to a human-readable label.
 *
 * Examples:
 *   "created_at" -> "Created At"
 *   "userId" -> "User Id"
 */
export function columnNameToLabel(name: string): string {
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .split("_")
    .filter(Boolean);

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Introspect a Drizzle schema and produce AdminTableMeta for each visible table.
 *
 * Auto-excludes auth-related tables (session, account, verification, passkey)
 * unless explicitly included via table overrides.
 *
 * Applies user-provided overrides for labels, columns, sorting, etc.
 */
export function introspectSchema(
  schema: Record<string, SQLiteTable>,
  tableOverrides?: Record<string, TableOverrides>,
): AdminTableMeta[] {
  const result: AdminTableMeta[] = [];

  for (const [_key, table] of Object.entries(schema)) {
    const tableName = getTableName(table);
    const overrides = tableOverrides?.[tableName] ?? {};

    // Skip explicitly excluded tables
    if (overrides.exclude === true) {
      continue;
    }

    // Auto-exclude auth tables (unless user provides overrides that don't exclude)
    if (AUTO_EXCLUDED_TABLES.has(tableName) && !tableOverrides?.[tableName]) {
      continue;
    }

    const columns = introspectColumns(table);
    if (columns.length === 0) continue;

    const primaryKey =
      columns.find((c) => c.isPrimaryKey)?.name ?? columns[0].name;

    // Determine searchable columns: override or first text column
    const searchableColumns =
      overrides.searchable ??
      defaultSearchableColumns(columns);

    // Determine list columns: override or all non-PK columns
    const listColumns =
      overrides.listColumns ??
      columns.filter((c) => !c.isPrimaryKey).map((c) => c.name);

    // Determine sort: override or primary key descending
    const defaultSort = overrides.defaultSort ?? {
      column: primaryKey,
      direction: "desc" as const,
    };

    // Label: override or auto-generated from table name
    const label = overrides.label ?? tableNameToLabel(tableName);

    result.push({
      name: tableName,
      label,
      drizzleTable: table,
      columns,
      primaryKey,
      searchableColumns,
      listColumns,
      defaultSort,
      overrides,
    });
  }

  // Sort tables alphabetically by name for stable ordering
  result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}

/**
 * Extract column metadata from a Drizzle SQLiteTable.
 */
function introspectColumns(table: SQLiteTable): AdminColumnConfig[] {
  const drizzleColumns = getTableColumns(table);
  const tableConfig = getTableConfig(table);
  const foreignKeys = tableConfig.foreignKeys;

  // Build a map of column name -> foreign key reference
  const refMap = new Map<
    string,
    { table: string; column: string }
  >();

  for (const fk of foreignKeys) {
    const ref = fk.reference();
    const localColumns = ref.columns;
    const foreignColumns = ref.foreignColumns;
    const foreignTable = ref.foreignTable;
    const foreignTableName = getTableName(foreignTable);

    for (let i = 0; i < localColumns.length; i++) {
      const localCol = localColumns[i];
      const foreignCol = foreignColumns[i];
      if (localCol && foreignCol) {
        refMap.set(localCol.name, {
          table: foreignTableName,
          column: foreignCol.name,
        });
      }
    }
  }

  const result: AdminColumnConfig[] = [];

  for (const [_fieldName, col] of Object.entries(drizzleColumns)) {
    const ref = refMap.get(col.name);
    const columnConfig: AdminColumnConfig = {
      name: col.name,
      label: columnNameToLabel(col.name),
      dataType: col.dataType,
      columnType: col.columnType,
      required: col.notNull && !col.hasDefault,
      hasDefault: col.hasDefault,
      isPrimaryKey: col.primary,
    };

    if (col.enumValues && col.enumValues.length > 0) {
      columnConfig.enumValues = [...col.enumValues];
    }

    if (ref) {
      columnConfig.referencesTable = ref.table;
      columnConfig.referencesColumn = ref.column;
    }

    result.push(columnConfig);
  }

  return result;
}

/**
 * Default searchable columns: the first text-type column, if any.
 */
function defaultSearchableColumns(columns: AdminColumnConfig[]): string[] {
  const textCol = columns.find((c) => c.dataType === "string");
  return textCol ? [textCol.name] : [];
}
