# @cfast/admin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete auto-generated admin UI from Drizzle schema with CRUD, dashboard, user management, and impersonation.

**Architecture:** Single React Router route with client-side sub-routing via search params. `createAdmin({ db, auth, schema })` returns `{ loader, action, Component }`. Loader parses `?view=posts&page=1` params and returns a discriminated union. All data flows through `@cfast/db` (permission-aware). All rendering delegates to `@cfast/ui` and `@cfast/forms` components.

**Tech Stack:** TypeScript, React 19, React Router v7, Drizzle ORM (SQLite/D1), MUI Joy UI, `@cfast/db`, `@cfast/auth`, `@cfast/ui`, `@cfast/forms`, `@cfast/pagination`, `@cfast/permissions`

---

### Task 1: Export createAutoForm from @cfast/forms

AutoForm already exists (`packages/forms/src/auto-form.tsx`) but `createAutoForm` is not exported from the package index.

**Files:**
- Modify: `packages/forms/src/index.ts`

**Step 1: Add the export**

```typescript
export { introspectTable } from "./introspect";
export { createResolver } from "./resolver";
export { createFormPlugin } from "./plugin";
export { createAutoForm } from "./auto-form";
export { v } from "./validate";

export type {
  ValidationRules,
  FieldDefinition,
  FieldConfig,
  FieldComponentProps,
  FormPlugin,
  FormPluginComponents,
  FormWrapperProps,
  SubmitButtonProps,
  InputType,
} from "./types";
```

**Step 2: Verify build**

Run: `pnpm --filter @cfast/forms build`
Expected: Success, `createAutoForm` in dist/index.js

**Step 3: Commit**

```bash
git add packages/forms/src/index.ts
git commit -m "feat(forms): export createAutoForm from package index"
```

---

### Task 2: Admin types

**Files:**
- Create: `packages/admin/src/types.ts`

**Step 1: Write the type definitions**

```typescript
import type { ComponentType } from "react";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "@cfast/db";
import type { FieldConfig } from "@cfast/forms";

// --- Auth interface (decoupled from @cfast/auth internals) ---

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  isImpersonating?: boolean;
  realUser?: { id: string; name: string };
};

export type AdminAuthConfig = {
  requireUser: (request: Request) => Promise<{ user: AdminUser; grants: unknown[] }>;
  hasRole: (user: AdminUser, role: string) => boolean;
  getRoles: (userId: string) => Promise<string[]>;
  setRole: (userId: string, role: string) => Promise<void>;
  removeRole: (userId: string, role: string) => Promise<void>;
  setRoles: (userId: string, roles: string[]) => Promise<void>;
  impersonate: (adminId: string, targetId: string, request: Request) => Promise<Response>;
  stopImpersonation: (request: Request) => Promise<Response>;
};

// --- DB factory ---

export type CreateDbFn = (
  grants: unknown[],
  user: { id: string } | null,
) => Db;

// --- Table config ---

export type TableOverrides = {
  label?: string;
  listColumns?: string[];
  searchable?: string[];
  defaultSort?: { column: string; direction: "asc" | "desc" };
  fields?: Record<string, FieldConfig>;
  actions?: {
    row?: RowAction[];
    table?: TableAction[];
  };
  exclude?: boolean;
};

export type RowAction = {
  label: string;
  action: (id: string, formData: FormData) => Promise<unknown>;
  confirm?: string;
  variant?: "danger" | "default";
};

export type TableAction = {
  label: string;
  handler: (selectedIds: string[]) => Promise<unknown>;
};

// --- User management ---

export type UserManagementConfig = {
  displayFields?: string[];
  assignableRoles?: string[];
};

// --- Dashboard ---

export type DashboardWidget =
  | { type: "count"; table: string; label: string; where?: Record<string, unknown> }
  | { type: "recent"; table: string; label: string; limit?: number };

export type DashboardConfig = {
  widgets?: DashboardWidget[];
};

// --- Main config ---

export type AdminConfig = {
  db: CreateDbFn;
  auth: AdminAuthConfig;
  schema: Record<string, SQLiteTable>;
  tables?: Record<string, TableOverrides>;
  users?: UserManagementConfig;
  dashboard?: DashboardConfig;
  basePath?: string;
  requiredRole?: string;
};

// --- Introspected schema ---

export type AdminColumnConfig = {
  name: string;
  label: string;
  dataType: string;
  columnType: string;
  required: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  enumValues?: string[];
  referencesTable?: string;
  referencesColumn?: string;
};

export type AdminTableMeta = {
  name: string;
  label: string;
  drizzleTable: SQLiteTable;
  columns: AdminColumnConfig[];
  primaryKey: string;
  searchableColumns: string[];
  listColumns: string[];
  defaultSort: { column: string; direction: "asc" | "desc" };
  overrides: TableOverrides;
};

// --- Loader data (discriminated union) ---

export type DashboardStat = {
  label: string;
  value: number;
};

export type RecentItem = {
  table: string;
  label: string;
  items: Record<string, unknown>[];
  columns: string[];
};

export type AdminLoaderData =
  | {
      view: "dashboard";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      stats: DashboardStat[];
      recentItems: RecentItem[];
    }
  | {
      view: "list";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      items: Record<string, unknown>[];
      total: number;
      page: number;
      totalPages: number;
      columns: AdminColumnConfig[];
      searchable: string[];
      sort: { column: string; direction: string };
      search: string;
    }
  | {
      view: "detail";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      item: Record<string, unknown>;
      columns: AdminColumnConfig[];
    }
  | {
      view: "create";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      columns: AdminColumnConfig[];
    }
  | {
      view: "edit";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      tableName: string;
      tableLabel: string;
      item: Record<string, unknown>;
      columns: AdminColumnConfig[];
    }
  | {
      view: "users";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      items: Array<AdminUser & { createdAt?: string }>;
      total: number;
      page: number;
      totalPages: number;
      search: string;
      assignableRoles: string[];
    }
  | {
      view: "user-detail";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      targetUser: AdminUser & { createdAt?: string };
      assignableRoles: string[];
    }
  | {
      view: "error";
      user: AdminUser;
      tables: Array<{ name: string; label: string }>;
      message: string;
    };

// --- Action result ---

export type AdminActionResult =
  | { success: string }
  | { error: string }
  | { fieldErrors: Record<string, string> };
```

**Step 2: Typecheck**

Run: `pnpm --filter @cfast/admin typecheck`
Expected: Pass (types only, no implementation needed)

**Step 3: Commit**

```bash
git add packages/admin/src/types.ts
git commit -m "feat(admin): add type definitions"
```

---

### Task 3: Schema introspection

**Files:**
- Create: `packages/admin/src/introspect.ts`
- Create: `packages/admin/src/__tests__/introspect.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { introspectSchema } from "../introspect";

describe("introspectSchema", () => {
  it("introspects a simple table", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
      views: integer("views"),
    });

    const result = introspectSchema({ posts });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("posts");
    expect(result[0].label).toBe("Posts");
    expect(result[0].primaryKey).toBe("id");
    expect(result[0].columns).toHaveLength(3);
    expect(result[0].columns[0]).toMatchObject({
      name: "id",
      label: "Id",
      isPrimaryKey: true,
    });
    expect(result[0].columns[1]).toMatchObject({
      name: "title",
      label: "Title",
      required: true,
    });
  });

  it("auto-excludes auth tables", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
    });
    const session = sqliteTable("session", {
      id: text("id").primaryKey(),
    });
    const verification = sqliteTable("verification", {
      id: text("id").primaryKey(),
    });

    const result = introspectSchema({ posts, session, verification });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("posts");
  });

  it("applies table overrides", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
      content: text("content"),
      createdAt: text("created_at"),
    });

    const result = introspectSchema(
      { posts },
      {
        posts: {
          label: "Blog Posts",
          listColumns: ["title", "createdAt"],
          searchable: ["title", "content"],
          defaultSort: { column: "createdAt", direction: "desc" },
        },
      },
    );

    expect(result[0].label).toBe("Blog Posts");
    expect(result[0].listColumns).toEqual(["title", "createdAt"]);
    expect(result[0].searchableColumns).toEqual(["title", "content"]);
    expect(result[0].defaultSort).toEqual({ column: "createdAt", direction: "desc" });
  });

  it("respects exclude: true", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
    });
    const secrets = sqliteTable("secrets", {
      id: text("id").primaryKey(),
    });

    const result = introspectSchema(
      { posts, secrets },
      { secrets: { exclude: true } },
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("posts");
  });

  it("detects enum columns", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
      status: text("status", { enum: ["draft", "published"] }).notNull(),
    });

    const result = introspectSchema({ posts });
    const statusCol = result[0].columns.find((c) => c.name === "status");

    expect(statusCol?.enumValues).toEqual(["draft", "published"]);
  });

  it("defaults listColumns to all non-pk columns", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
      content: text("content"),
    });

    const result = introspectSchema({ posts });
    expect(result[0].listColumns).toEqual(["title", "content"]);
  });

  it("defaults searchable to first text column", () => {
    const posts = sqliteTable("posts", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
      views: integer("views"),
    });

    const result = introspectSchema({ posts });
    expect(result[0].searchableColumns).toEqual(["title"]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/admin test`
Expected: FAIL — `introspectSchema` not found

**Step 3: Write the implementation**

```typescript
import { getTableColumns } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { AdminColumnConfig, AdminTableMeta, TableOverrides } from "./types";

const AUTO_EXCLUDED = new Set(["session", "account", "verification", "passkey"]);

function columnNameToLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tableNameToLabel(name: string): string {
  const label = columnNameToLabel(name);
  // Simple pluralization: if doesn't end with 's', add it
  return label.endsWith("s") ? label : label + "s";
}

function getTableNameFromDrizzle(table: SQLiteTable): string {
  const nameSymbol = Symbol.for("drizzle:Name");
  return (table as Record<string | symbol, unknown>)[nameSymbol] as string ?? "unknown";
}

function introspectColumns(table: SQLiteTable): AdminColumnConfig[] {
  const columns = getTableColumns(table);
  const result: AdminColumnConfig[] = [];

  for (const [key, column] of Object.entries(columns)) {
    const col = column as unknown as {
      dataType: string;
      columnType: string;
      notNull: boolean;
      hasDefault: boolean;
      primary: boolean;
      enumValues?: readonly string[] | string[];
    };

    result.push({
      name: key,
      label: columnNameToLabel(column.name),
      dataType: col.dataType,
      columnType: col.columnType,
      required: col.notNull,
      hasDefault: col.hasDefault,
      isPrimaryKey: col.primary,
      enumValues: col.enumValues ? [...col.enumValues] : undefined,
    });
  }

  return result;
}

export function introspectSchema(
  schema: Record<string, SQLiteTable>,
  tableOverrides?: Record<string, TableOverrides>,
): AdminTableMeta[] {
  const tables: AdminTableMeta[] = [];

  for (const [key, drizzleTable] of Object.entries(schema)) {
    const tableName = getTableNameFromDrizzle(drizzleTable);

    // Check explicit exclude
    if (tableOverrides?.[key]?.exclude) continue;

    // Auto-exclude auth tables
    if (AUTO_EXCLUDED.has(tableName)) continue;

    const overrides = tableOverrides?.[key] ?? {};
    const columns = introspectColumns(drizzleTable);
    const primaryKey = columns.find((c) => c.isPrimaryKey)?.name ?? columns[0]?.name ?? "id";

    // Default listColumns: all non-primary-key columns
    const listColumns = overrides.listColumns ??
      columns.filter((c) => !c.isPrimaryKey).map((c) => c.name);

    // Default searchable: first text-type column
    const searchableColumns = overrides.searchable ??
      columns
        .filter((c) => c.dataType === "string" && !c.isPrimaryKey)
        .slice(0, 1)
        .map((c) => c.name);

    // Default sort: primary key descending
    const defaultSort = overrides.defaultSort ?? { column: primaryKey, direction: "desc" as const };

    tables.push({
      name: key,
      label: overrides.label ?? tableNameToLabel(key),
      drizzleTable,
      columns,
      primaryKey,
      searchableColumns,
      listColumns,
      defaultSort,
      overrides,
    });
  }

  return tables;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @cfast/admin test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/admin/src/introspect.ts packages/admin/src/__tests__/introspect.test.ts
git commit -m "feat(admin): add schema introspection"
```

---

### Task 4: URL param utilities

**Files:**
- Create: `packages/admin/src/utils.ts`
- Create: `packages/admin/src/__tests__/utils.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import { parseAdminParams, buildAdminUrl } from "../utils";

describe("parseAdminParams", () => {
  it("returns dashboard view by default", () => {
    const url = new URL("http://localhost/admin");
    expect(parseAdminParams(url)).toEqual({ view: "dashboard" });
  });

  it("parses table list view", () => {
    const url = new URL("http://localhost/admin?view=posts&page=2&sort=title&dir=asc&search=hello");
    expect(parseAdminParams(url)).toEqual({
      view: "list",
      table: "posts",
      page: 2,
      sort: "title",
      dir: "asc",
      search: "hello",
    });
  });

  it("parses table detail view", () => {
    const url = new URL("http://localhost/admin?view=posts&id=abc123");
    expect(parseAdminParams(url)).toEqual({
      view: "detail",
      table: "posts",
      id: "abc123",
    });
  });

  it("parses create view", () => {
    const url = new URL("http://localhost/admin?view=posts&mode=create");
    expect(parseAdminParams(url)).toEqual({
      view: "create",
      table: "posts",
    });
  });

  it("parses edit view", () => {
    const url = new URL("http://localhost/admin?view=posts&id=abc123&mode=edit");
    expect(parseAdminParams(url)).toEqual({
      view: "edit",
      table: "posts",
      id: "abc123",
    });
  });

  it("parses user list view", () => {
    const url = new URL("http://localhost/admin?view=_users&page=3&search=jane");
    expect(parseAdminParams(url)).toEqual({
      view: "users",
      page: 3,
      search: "jane",
    });
  });

  it("parses user detail view", () => {
    const url = new URL("http://localhost/admin?view=_users&id=user1");
    expect(parseAdminParams(url)).toEqual({
      view: "user-detail",
      id: "user1",
    });
  });

  it("defaults page to 1", () => {
    const url = new URL("http://localhost/admin?view=posts");
    expect(parseAdminParams(url)).toEqual({
      view: "list",
      table: "posts",
      page: 1,
      sort: undefined,
      dir: undefined,
      search: "",
    });
  });
});

describe("buildAdminUrl", () => {
  it("builds dashboard url", () => {
    expect(buildAdminUrl({ view: "dashboard" })).toBe("?view=dashboard");
  });

  it("builds list url with params", () => {
    expect(buildAdminUrl({ view: "list", table: "posts", page: 2 })).toBe(
      "?view=posts&page=2",
    );
  });

  it("builds detail url", () => {
    expect(buildAdminUrl({ view: "detail", table: "posts", id: "abc" })).toBe(
      "?view=posts&id=abc",
    );
  });

  it("builds create url", () => {
    expect(buildAdminUrl({ view: "create", table: "posts" })).toBe(
      "?view=posts&mode=create",
    );
  });

  it("builds edit url", () => {
    expect(buildAdminUrl({ view: "edit", table: "posts", id: "abc" })).toBe(
      "?view=posts&id=abc&mode=edit",
    );
  });

  it("builds users url", () => {
    expect(buildAdminUrl({ view: "users", page: 2, search: "jane" })).toBe(
      "?view=_users&page=2&search=jane",
    );
  });

  it("builds user detail url", () => {
    expect(buildAdminUrl({ view: "user-detail", id: "u1" })).toBe(
      "?view=_users&id=u1",
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/admin test`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
export type ParsedParams =
  | { view: "dashboard" }
  | { view: "list"; table: string; page: number; sort: string | undefined; dir: string | undefined; search: string }
  | { view: "detail"; table: string; id: string }
  | { view: "create"; table: string }
  | { view: "edit"; table: string; id: string }
  | { view: "users"; page: number; search: string }
  | { view: "user-detail"; id: string };

export function parseAdminParams(url: URL): ParsedParams {
  const view = url.searchParams.get("view");
  const id = url.searchParams.get("id");
  const mode = url.searchParams.get("mode");

  if (!view || view === "dashboard") {
    return { view: "dashboard" };
  }

  if (view === "_users") {
    if (id) {
      return { view: "user-detail", id };
    }
    return {
      view: "users",
      page: Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10)),
      search: url.searchParams.get("search") ?? "",
    };
  }

  // Table views
  const table = view;

  if (mode === "create") {
    return { view: "create", table };
  }

  if (id && mode === "edit") {
    return { view: "edit", table, id };
  }

  if (id) {
    return { view: "detail", table, id };
  }

  return {
    view: "list",
    table,
    page: Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10)),
    sort: url.searchParams.get("sort") ?? undefined,
    dir: url.searchParams.get("dir") ?? undefined,
    search: url.searchParams.get("search") ?? "",
  };
}

export type BuildUrlParams =
  | { view: "dashboard" }
  | { view: "list"; table: string; page?: number; sort?: string; dir?: string; search?: string }
  | { view: "detail"; table: string; id: string }
  | { view: "create"; table: string }
  | { view: "edit"; table: string; id: string }
  | { view: "users"; page?: number; search?: string }
  | { view: "user-detail"; id: string };

export function buildAdminUrl(params: BuildUrlParams): string {
  const sp = new URLSearchParams();

  switch (params.view) {
    case "dashboard":
      sp.set("view", "dashboard");
      break;
    case "list":
      sp.set("view", params.table);
      if (params.page && params.page > 1) sp.set("page", String(params.page));
      if (params.sort) sp.set("sort", params.sort);
      if (params.dir) sp.set("dir", params.dir);
      if (params.search) sp.set("search", params.search);
      break;
    case "detail":
      sp.set("view", params.table);
      sp.set("id", params.id);
      break;
    case "create":
      sp.set("view", params.table);
      sp.set("mode", "create");
      break;
    case "edit":
      sp.set("view", params.table);
      sp.set("id", params.id);
      sp.set("mode", "edit");
      break;
    case "users":
      sp.set("view", "_users");
      if (params.page && params.page > 1) sp.set("page", String(params.page));
      if (params.search) sp.set("search", params.search);
      break;
    case "user-detail":
      sp.set("view", "_users");
      sp.set("id", params.id);
      break;
  }

  return `?${sp.toString()}`;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @cfast/admin test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/admin/src/utils.ts packages/admin/src/__tests__/utils.test.ts
git commit -m "feat(admin): add URL param parsing utilities"
```

---

### Task 5: Loader factory

**Files:**
- Create: `packages/admin/src/loader.ts`

**Step 1: Write the loader factory**

```typescript
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { getTableColumns } from "drizzle-orm";
import { eq, like, or, desc, asc, count } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { AdminConfig, AdminLoaderData, AdminTableMeta, DashboardStat, RecentItem } from "./types";
import { parseAdminParams } from "./utils";

const PAGE_SIZE = 20;

export function createAdminLoader(
  config: AdminConfig,
  tableMetas: AdminTableMeta[],
) {
  const tablesByName = new Map(tableMetas.map((t) => [t.name, t]));
  const requiredRole = config.requiredRole ?? "admin";
  const tableNavItems = tableMetas.map((t) => ({ name: t.name, label: t.label }));

  return async function loader({ request }: LoaderFunctionArgs): Promise<AdminLoaderData> {
    const { user, grants } = await config.auth.requireUser(request);

    if (!config.auth.hasRole(user, requiredRole)) {
      throw redirect("/");
    }

    const db = config.db(grants, user);
    const url = new URL(request.url);
    const params = parseAdminParams(url);

    switch (params.view) {
      case "dashboard": {
        const stats: DashboardStat[] = [];
        const recentItems: RecentItem[] = [];

        if (config.dashboard?.widgets) {
          for (const widget of config.dashboard.widgets) {
            const meta = tablesByName.get(widget.table);
            if (!meta) continue;

            if (widget.type === "count") {
              const result = await db.query(meta.drizzleTable).findMany({
                columns: {},
              });
              stats.push({ label: widget.label, value: result.length });
            } else if (widget.type === "recent") {
              const items = await db.query(meta.drizzleTable).findMany({
                limit: widget.limit ?? 5,
                orderBy: desc((meta.drizzleTable as Record<string, unknown>)[meta.defaultSort.column] as never),
              }) as Record<string, unknown>[];
              recentItems.push({
                table: widget.table,
                label: widget.label,
                items,
                columns: meta.listColumns.slice(0, 4),
              });
            }
          }
        } else {
          // Default: count each table + recent from first table
          for (const meta of tableMetas) {
            const result = await db.query(meta.drizzleTable).findMany({ columns: {} });
            stats.push({ label: meta.label, value: result.length });
          }
          if (tableMetas.length > 0) {
            const first = tableMetas[0];
            const items = await db.query(first.drizzleTable).findMany({
              limit: 5,
              orderBy: desc((first.drizzleTable as Record<string, unknown>)[first.defaultSort.column] as never),
            }) as Record<string, unknown>[];
            recentItems.push({
              table: first.name,
              label: `Recent ${first.label}`,
              items,
              columns: first.listColumns.slice(0, 4),
            });
          }
        }

        return { view: "dashboard", user, tables: tableNavItems, stats, recentItems };
      }

      case "list": {
        const meta = tablesByName.get(params.table);
        if (!meta) {
          return { view: "error", user, tables: tableNavItems, message: `Table "${params.table}" not found` };
        }

        const sortCol = params.sort ?? meta.defaultSort.column;
        const sortDir = params.dir ?? meta.defaultSort.direction;
        const offset = (params.page - 1) * PAGE_SIZE;

        const tableRef = meta.drizzleTable as Record<string, unknown>;
        const orderByCol = tableRef[sortCol] as never;
        const orderByExpr = orderByCol
          ? (sortDir === "asc" ? asc(orderByCol) : desc(orderByCol))
          : undefined;

        // Build search condition
        let whereCondition: unknown;
        if (params.search && meta.searchableColumns.length > 0) {
          const conditions = meta.searchableColumns.map((col) => {
            const colRef = tableRef[col] as never;
            return colRef ? like(colRef, `%${params.search}%`) : undefined;
          }).filter(Boolean) as never[];
          if (conditions.length === 1) {
            whereCondition = conditions[0];
          } else if (conditions.length > 1) {
            whereCondition = or(...conditions);
          }
        }

        const items = await db.query(meta.drizzleTable).findMany({
          where: whereCondition,
          orderBy: orderByExpr,
          limit: PAGE_SIZE,
          offset,
        }) as Record<string, unknown>[];

        // Count total
        const allItems = await db.query(meta.drizzleTable).findMany({
          where: whereCondition,
          columns: {},
        }) as Record<string, unknown>[];
        const total = allItems.length;

        return {
          view: "list",
          user,
          tables: tableNavItems,
          tableName: meta.name,
          tableLabel: meta.label,
          items,
          total,
          page: params.page,
          totalPages: Math.ceil(total / PAGE_SIZE),
          columns: meta.columns,
          searchable: meta.searchableColumns,
          sort: { column: sortCol, direction: sortDir },
          search: params.search,
        };
      }

      case "detail": {
        const meta = tablesByName.get(params.table);
        if (!meta) {
          return { view: "error", user, tables: tableNavItems, message: `Table "${params.table}" not found` };
        }

        const tableRef = meta.drizzleTable as Record<string, unknown>;
        const pkCol = tableRef[meta.primaryKey] as never;
        const item = await db.query(meta.drizzleTable).findFirst({
          where: eq(pkCol, params.id),
        }) as Record<string, unknown> | undefined;

        if (!item) {
          return { view: "error", user, tables: tableNavItems, message: "Record not found" };
        }

        return {
          view: "detail",
          user,
          tables: tableNavItems,
          tableName: meta.name,
          tableLabel: meta.label,
          item,
          columns: meta.columns,
        };
      }

      case "create": {
        const meta = tablesByName.get(params.table);
        if (!meta) {
          return { view: "error", user, tables: tableNavItems, message: `Table "${params.table}" not found` };
        }

        return {
          view: "create",
          user,
          tables: tableNavItems,
          tableName: meta.name,
          tableLabel: meta.label,
          columns: meta.columns,
        };
      }

      case "edit": {
        const meta = tablesByName.get(params.table);
        if (!meta) {
          return { view: "error", user, tables: tableNavItems, message: `Table "${params.table}" not found` };
        }

        const tableRef = meta.drizzleTable as Record<string, unknown>;
        const pkCol = tableRef[meta.primaryKey] as never;
        const item = await db.query(meta.drizzleTable).findFirst({
          where: eq(pkCol, params.id),
        }) as Record<string, unknown> | undefined;

        if (!item) {
          return { view: "error", user, tables: tableNavItems, message: "Record not found" };
        }

        return {
          view: "edit",
          user,
          tables: tableNavItems,
          tableName: meta.name,
          tableLabel: meta.label,
          item,
          columns: meta.columns,
        };
      }

      case "users": {
        // User management queries go through unsafe since users table may have different permission rules
        const usersTable = findUsersTable(config.schema);
        if (!usersTable) {
          return { view: "error", user, tables: tableNavItems, message: "Users table not found in schema" };
        }

        const usersRef = usersTable as Record<string, unknown>;
        const offset = (params.page - 1) * PAGE_SIZE;

        let whereCondition: unknown;
        if (params.search) {
          const nameCol = usersRef["name"] as never;
          const emailCol = usersRef["email"] as never;
          const conditions = [
            nameCol ? like(nameCol, `%${params.search}%`) : undefined,
            emailCol ? like(emailCol, `%${params.search}%`) : undefined,
          ].filter(Boolean) as never[];
          if (conditions.length > 0) {
            whereCondition = or(...conditions);
          }
        }

        const createdAtCol = usersRef["createdAt"] as never;
        const rawUsers = await db.unsafe().query(usersTable).findMany({
          where: whereCondition,
          orderBy: createdAtCol ? desc(createdAtCol) : undefined,
          limit: PAGE_SIZE,
          offset,
        }) as Record<string, unknown>[];

        const allUsers = await db.unsafe().query(usersTable).findMany({
          where: whereCondition,
          columns: {},
        }) as Record<string, unknown>[];
        const total = allUsers.length;

        // Fetch roles for each user
        const items = await Promise.all(
          rawUsers.map(async (u) => {
            const roles = await config.auth.getRoles(u["id"] as string);
            return {
              id: u["id"] as string,
              email: (u["email"] as string) ?? "",
              name: (u["name"] as string) ?? "",
              avatarUrl: (u["avatarUrl"] as string | null) ?? null,
              roles,
              createdAt: u["createdAt"] as string | undefined,
            };
          }),
        );

        return {
          view: "users",
          user,
          tables: tableNavItems,
          items,
          total,
          page: params.page,
          totalPages: Math.ceil(total / PAGE_SIZE),
          search: params.search,
          assignableRoles: config.users?.assignableRoles ?? [],
        };
      }

      case "user-detail": {
        const usersTable = findUsersTable(config.schema);
        if (!usersTable) {
          return { view: "error", user, tables: tableNavItems, message: "Users table not found in schema" };
        }

        const usersRef = usersTable as Record<string, unknown>;
        const idCol = usersRef["id"] as never;
        const raw = await db.unsafe().query(usersTable).findFirst({
          where: eq(idCol, params.id),
        }) as Record<string, unknown> | undefined;

        if (!raw) {
          return { view: "error", user, tables: tableNavItems, message: "User not found" };
        }

        const roles = await config.auth.getRoles(raw["id"] as string);

        return {
          view: "user-detail",
          user,
          tables: tableNavItems,
          targetUser: {
            id: raw["id"] as string,
            email: (raw["email"] as string) ?? "",
            name: (raw["name"] as string) ?? "",
            avatarUrl: (raw["avatarUrl"] as string | null) ?? null,
            roles,
            createdAt: raw["createdAt"] as string | undefined,
          },
          assignableRoles: config.users?.assignableRoles ?? [],
        };
      }
    }
  };
}

function findUsersTable(schema: Record<string, SQLiteTable>): SQLiteTable | undefined {
  // Look for a table named "user" or "users" in the schema
  const nameSymbol = Symbol.for("drizzle:Name");
  for (const table of Object.values(schema)) {
    const name = (table as Record<string | symbol, unknown>)[nameSymbol] as string;
    if (name === "user" || name === "users") return table;
  }
  return undefined;
}
```

**Step 2: Typecheck**

Run: `pnpm --filter @cfast/admin typecheck`
Expected: Pass

**Step 3: Commit**

```bash
git add packages/admin/src/loader.ts
git commit -m "feat(admin): add loader factory"
```

---

### Task 6: Action factory

**Files:**
- Create: `packages/admin/src/action.ts`

**Step 1: Write the action factory**

```typescript
import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import type { AdminConfig, AdminTableMeta, AdminActionResult } from "./types";

export function createAdminAction(
  config: AdminConfig,
  tableMetas: AdminTableMeta[],
) {
  const tablesByName = new Map(tableMetas.map((t) => [t.name, t]));
  const requiredRole = config.requiredRole ?? "admin";
  const basePath = config.basePath ?? "/admin";

  return async function action({ request }: ActionFunctionArgs): Promise<AdminActionResult | Response> {
    const { user, grants } = await config.auth.requireUser(request);

    if (!config.auth.hasRole(user, requiredRole)) {
      throw redirect("/");
    }

    const db = config.db(grants, user);
    const formData = await request.formData();
    const actionType = formData.get("_action") as string;
    const tableName = formData.get("_table") as string | null;
    const recordId = formData.get("_id") as string | null;

    switch (actionType) {
      case "create": {
        if (!tableName) return { error: "Missing table name" };
        const meta = tablesByName.get(tableName);
        if (!meta) return { error: `Table "${tableName}" not found` };

        const values = extractFormValues(formData, meta);
        await db.insert(meta.drizzleTable).values(values).run({});

        return { success: `${meta.label.replace(/s$/, "")} created successfully` };
      }

      case "update": {
        if (!tableName || !recordId) return { error: "Missing table name or record ID" };
        const meta = tablesByName.get(tableName);
        if (!meta) return { error: `Table "${tableName}" not found` };

        const values = extractFormValues(formData, meta);
        const tableRef = meta.drizzleTable as Record<string, unknown>;
        const pkCol = tableRef[meta.primaryKey] as never;

        await db.update(meta.drizzleTable).set(values).where(eq(pkCol, recordId)).run({});

        return { success: `${meta.label.replace(/s$/, "")} updated successfully` };
      }

      case "delete": {
        if (!tableName || !recordId) return { error: "Missing table name or record ID" };
        const meta = tablesByName.get(tableName);
        if (!meta) return { error: `Table "${tableName}" not found` };

        const tableRef = meta.drizzleTable as Record<string, unknown>;
        const pkCol = tableRef[meta.primaryKey] as never;

        await db.delete(meta.drizzleTable).where(eq(pkCol, recordId)).run({});

        return { success: `${meta.label.replace(/s$/, "")} deleted successfully` };
      }

      case "setRole": {
        const userId = formData.get("userId") as string;
        const role = formData.get("role") as string;
        if (!userId || !role) return { error: "Missing userId or role" };
        await config.auth.setRole(userId, role);
        return { success: `Role "${role}" assigned` };
      }

      case "removeRole": {
        const userId = formData.get("userId") as string;
        const role = formData.get("role") as string;
        if (!userId || !role) return { error: "Missing userId or role" };
        await config.auth.removeRole(userId, role);
        return { success: `Role "${role}" removed` };
      }

      case "impersonate": {
        const targetId = formData.get("targetId") as string;
        if (!targetId) return { error: "Missing target user ID" };
        if (targetId === user.id) return { error: "Cannot impersonate yourself" };
        return config.auth.impersonate(user.id, targetId, request);
      }

      case "stopImpersonation": {
        return config.auth.stopImpersonation(request);
      }

      case "custom": {
        const actionName = formData.get("_actionName") as string;
        if (!tableName || !actionName) return { error: "Missing action details" };
        const meta = tablesByName.get(tableName);
        if (!meta) return { error: `Table "${tableName}" not found` };

        const rowActions = meta.overrides.actions?.row ?? [];
        const handler = rowActions.find((a) => a.label === actionName);
        if (handler && recordId) {
          await handler.action(recordId, formData);
          return { success: `Action "${actionName}" completed` };
        }

        const tableActions = meta.overrides.actions?.table ?? [];
        const tableHandler = tableActions.find((a) => a.label === actionName);
        if (tableHandler) {
          const selectedIds = formData.getAll("_selectedIds") as string[];
          await tableHandler.handler(selectedIds);
          return { success: `Action "${actionName}" completed` };
        }

        return { error: `Action "${actionName}" not found` };
      }

      default:
        return { error: `Unknown action: ${actionType}` };
    }
  };
}

function extractFormValues(
  formData: FormData,
  meta: AdminTableMeta,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const skipKeys = new Set(["_action", "_table", "_id", "_actionName", "_selectedIds"]);

  for (const col of meta.columns) {
    if (col.isPrimaryKey) continue;
    const raw = formData.get(col.name);
    if (raw === null) continue;

    if (col.dataType === "number") {
      values[col.name] = Number(raw);
    } else if (col.columnType === "SQLiteBoolean") {
      values[col.name] = raw === "true" || raw === "on";
    } else {
      values[col.name] = raw;
    }
  }

  return values;
}
```

**Step 2: Typecheck**

Run: `pnpm --filter @cfast/admin typecheck`
Expected: Pass

**Step 3: Commit**

```bash
git add packages/admin/src/action.ts
git commit -m "feat(admin): add action factory"
```

---

### Task 7: Admin components — Sidebar

**Files:**
- Create: `packages/admin/src/components/sidebar.tsx`

**Step 1: Write the sidebar component**

```tsx
import { Link, useSearchParams } from "react-router";
import Sheet from "@mui/joy/Sheet";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";

type SidebarProps = {
  tables: Array<{ name: string; label: string }>;
};

export function AdminSidebar({ tables }: SidebarProps) {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") ?? "dashboard";

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography level="h4">Admin</Typography>
      </Box>

      <List
        sx={{
          "--ListItem-radius": "8px",
          "--List-padding": "8px",
          "--List-gap": "4px",
        }}
      >
        <ListItem>
          <ListItemButton
            component={Link}
            to="?"
            selected={currentView === "dashboard" || !currentView}
          >
            Dashboard
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        {tables.map((table) => (
          <ListItem key={table.name}>
            <ListItemButton
              component={Link}
              to={`?view=${table.name}`}
              selected={currentView === table.name}
            >
              {table.label}
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemButton
            component={Link}
            to="?view=_users"
            selected={currentView === "_users"}
          >
            Users
          </ListItemButton>
        </ListItem>
      </List>
    </Sheet>
  );
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/sidebar.tsx
git commit -m "feat(admin): add sidebar component"
```

---

### Task 8: Admin components — Dashboard

**Files:**
- Create: `packages/admin/src/components/dashboard.tsx`

**Step 1: Write the dashboard component**

```tsx
import { Link } from "react-router";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Table from "@mui/joy/Table";
import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import type { DashboardStat, RecentItem } from "../types";

type DashboardViewProps = {
  stats: DashboardStat[];
  recentItems: RecentItem[];
};

export function DashboardView({ stats, recentItems }: DashboardViewProps) {
  return (
    <Stack spacing={3}>
      <Typography level="h2">Dashboard</Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.label} variant="outlined">
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              {stat.label}
            </Typography>
            <Typography level="h2">{stat.value}</Typography>
          </Card>
        ))}
      </Box>

      {recentItems.map((section) => (
        <Card key={section.table} variant="outlined">
          <Typography level="title-lg" sx={{ mb: 1 }}>
            {section.label}
          </Typography>
          <Table hoverRow>
            <thead>
              <tr>
                {section.columns.map((col) => (
                  <th key={col}>{columnToLabel(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, i) => (
                <tr key={i}>
                  {section.columns.map((col) => (
                    <td key={col}>
                      {formatValue(item[col])}
                    </td>
                  ))}
                </tr>
              ))}
              {section.items.length === 0 && (
                <tr>
                  <td colSpan={section.columns.length}>
                    <Typography
                      level="body-sm"
                      sx={{ textAlign: "center", py: 2, color: "neutral.500" }}
                    >
                      No items yet
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      ))}
    </Stack>
  );
}

function columnToLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/dashboard.tsx
git commit -m "feat(admin): add dashboard component"
```

---

### Task 9: Admin components — Table list view

**Files:**
- Create: `packages/admin/src/components/table-list.tsx`

**Step 1: Write the component**

```tsx
import { Link, Form, useSubmit, useSearchParams } from "react-router";
import Table from "@mui/joy/Table";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import { useConfirm } from "@cfast/ui";
import type { AdminColumnConfig, AdminActionResult } from "../types";
import { buildAdminUrl } from "../utils";

type TableListViewProps = {
  tableName: string;
  tableLabel: string;
  items: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
  columns: AdminColumnConfig[];
  searchable: string[];
  sort: { column: string; direction: string };
  search: string;
  primaryKey: string;
  actionResult?: AdminActionResult | null;
};

export function TableListView({
  tableName,
  tableLabel,
  items,
  total,
  page,
  totalPages,
  columns,
  searchable,
  sort,
  search,
  primaryKey,
  actionResult,
}: TableListViewProps) {
  const submit = useSubmit();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();

  // Only show non-pk columns that are in listColumns or all if not configured
  const displayColumns = columns.filter((c) => !c.isPrimaryKey);

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: "Delete Record",
      description: "Are you sure you want to delete this record? This action cannot be undone.",
      variant: "danger",
    });
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("_action", "delete");
    formData.set("_table", tableName);
    formData.set("_id", String(id));
    submit(formData, { method: "post" });
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography level="h2">{tableLabel}</Typography>
        <Button
          component={Link}
          to={buildAdminUrl({ view: "create", table: tableName })}
          variant="solid"
        >
          Create
        </Button>
      </Stack>

      {actionResult && "error" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "danger.softBg", color: "danger.plainColor" }}>
          <Typography level="body-sm">{actionResult.error}</Typography>
        </Box>
      )}
      {actionResult && "success" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "success.softBg", color: "success.plainColor" }}>
          <Typography level="body-sm">{actionResult.success}</Typography>
        </Box>
      )}

      {searchable.length > 0 && (
        <Form method="get">
          {/* Preserve current view param */}
          <input type="hidden" name="view" value={tableName} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Input
              name="search"
              placeholder={`Search ${tableLabel.toLowerCase()}...`}
              defaultValue={search}
              sx={{ maxWidth: 400, flex: 1 }}
            />
            <Button type="submit" variant="outlined">Search</Button>
            {search && (
              <Button
                component={Link}
                to={buildAdminUrl({ view: "list", table: tableName })}
                variant="plain"
                color="neutral"
              >
                Clear
              </Button>
            )}
          </Stack>
        </Form>
      )}

      <Typography level="body-sm" sx={{ color: "neutral.500" }}>
        {total} record{total !== 1 ? "s" : ""} found
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Table hoverRow>
          <thead>
            <tr>
              {displayColumns.map((col) => (
                <th key={col.name}>
                  <Link
                    to={buildAdminUrl({
                      view: "list",
                      table: tableName,
                      page: 1,
                      sort: col.name,
                      dir: sort.column === col.name && sort.direction === "asc" ? "desc" : "asc",
                      search: search || undefined,
                    })}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {col.label}
                    {sort.column === col.name && (sort.direction === "asc" ? " ↑" : " ↓")}
                  </Link>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const id = String(item[primaryKey]);
              return (
                <tr key={id}>
                  {displayColumns.map((col) => (
                    <td key={col.name}>
                      {col.name === displayColumns[0]?.name ? (
                        <Link to={buildAdminUrl({ view: "detail", table: tableName, id })}>
                          {formatCellValue(item[col.name], col)}
                        </Link>
                      ) : (
                        formatCellValue(item[col.name], col)
                      )}
                    </td>
                  ))}
                  <td>
                    <Stack direction="row" spacing={1}>
                      <Button
                        component={Link}
                        to={buildAdminUrl({ view: "edit", table: tableName, id })}
                        size="sm"
                        variant="outlined"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        onClick={() => handleDelete(id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={displayColumns.length + 1}>
                  <Typography level="body-sm" sx={{ textAlign: "center", py: 2, color: "neutral.500" }}>
                    No records found
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Box>

      {totalPages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          {page > 1 && (
            <Button
              component={Link}
              to={buildAdminUrl({
                view: "list",
                table: tableName,
                page: page - 1,
                sort: sort.column,
                dir: sort.direction,
                search: search || undefined,
              })}
              variant="outlined"
              size="sm"
            >
              Previous
            </Button>
          )}
          <Typography level="body-sm">
            Page {page} of {totalPages}
          </Typography>
          {page < totalPages && (
            <Button
              component={Link}
              to={buildAdminUrl({
                view: "list",
                table: tableName,
                page: page + 1,
                sort: sort.column,
                dir: sort.direction,
                search: search || undefined,
              })}
              variant="outlined"
              size="sm"
            >
              Next
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

function formatCellValue(value: unknown, col: AdminColumnConfig): string {
  if (value === null || value === undefined) return "—";
  if (col.enumValues) return String(value);
  if (col.columnType === "SQLiteBoolean" || typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/table-list.tsx
git commit -m "feat(admin): add table list view component"
```

---

### Task 10: Admin components — Table detail view

**Files:**
- Create: `packages/admin/src/components/table-detail.tsx`

**Step 1: Write the component**

```tsx
import { Link, useSubmit } from "react-router";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Card from "@mui/joy/Card";
import Box from "@mui/joy/Box";
import { useConfirm } from "@cfast/ui";
import type { AdminColumnConfig } from "../types";
import { buildAdminUrl } from "../utils";

type TableDetailViewProps = {
  tableName: string;
  tableLabel: string;
  item: Record<string, unknown>;
  columns: AdminColumnConfig[];
  primaryKey: string;
};

export function TableDetailView({
  tableName,
  tableLabel,
  item,
  columns,
  primaryKey,
}: TableDetailViewProps) {
  const submit = useSubmit();
  const confirm = useConfirm();
  const id = String(item[primaryKey]);
  const singularLabel = tableLabel.replace(/s$/, "");

  async function handleDelete() {
    const confirmed = await confirm({
      title: `Delete ${singularLabel}`,
      description: `Are you sure you want to delete this ${singularLabel.toLowerCase()}? This action cannot be undone.`,
      variant: "danger",
    });
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("_action", "delete");
    formData.set("_table", tableName);
    formData.set("_id", id);
    submit(formData, { method: "post" });
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.5}>
          <Typography level="body-sm">
            <Link to={buildAdminUrl({ view: "list", table: tableName })}>
              {tableLabel}
            </Link>
            {" / "}
            {id}
          </Typography>
          <Typography level="h2">{singularLabel} Detail</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to={buildAdminUrl({ view: "edit", table: tableName, id })}
            variant="outlined"
          >
            Edit
          </Button>
          <Button
            variant="soft"
            color="danger"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: 2,
          }}
        >
          {columns.map((col) => (
            <Box key={col.name} sx={{ display: "contents" }}>
              <Typography level="body-sm" fontWeight="lg" sx={{ color: "neutral.600" }}>
                {col.label}
              </Typography>
              <Typography level="body-md">
                {formatDetailValue(item[col.name], col)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Stack>
  );
}

function formatDetailValue(value: unknown, col: AdminColumnConfig): string {
  if (value === null || value === undefined) return "—";
  if (col.columnType === "SQLiteBoolean" || typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/table-detail.tsx
git commit -m "feat(admin): add table detail view component"
```

---

### Task 11: Admin components — Table form (create/edit)

**Files:**
- Create: `packages/admin/src/components/table-form.tsx`

**Step 1: Write the component**

```tsx
import { Link, useSubmit } from "react-router";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { AutoForm } from "@cfast/forms/joy";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { AdminColumnConfig, AdminActionResult } from "../types";
import { buildAdminUrl } from "../utils";

type TableFormViewProps = {
  tableName: string;
  tableLabel: string;
  mode: "create" | "edit";
  drizzleTable: SQLiteTable;
  item?: Record<string, unknown>;
  columns: AdminColumnConfig[];
  primaryKey: string;
  actionResult?: AdminActionResult | null;
};

export function TableFormView({
  tableName,
  tableLabel,
  mode,
  drizzleTable,
  item,
  columns,
  primaryKey,
  actionResult,
}: TableFormViewProps) {
  const submit = useSubmit();
  const singularLabel = tableLabel.replace(/s$/, "");
  const title = mode === "create" ? `Create ${singularLabel}` : `Edit ${singularLabel}`;

  // Exclude primary key and auto-timestamp columns in create mode
  const excludeFields = mode === "create"
    ? columns
        .filter((c) => c.isPrimaryKey || (c.hasDefault && /created|updated/i.test(c.name)))
        .map((c) => c.name)
    : columns
        .filter((c) => c.hasDefault && /created|updated/i.test(c.name))
        .map((c) => c.name);

  function handleSubmit(values: Record<string, unknown>) {
    const formData = new FormData();
    formData.set("_action", mode === "create" ? "create" : "update");
    formData.set("_table", tableName);
    if (mode === "edit" && item) {
      formData.set("_id", String(item[primaryKey]));
    }
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    }
    submit(formData, { method: "post" });
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography level="body-sm">
          <Link to={buildAdminUrl({ view: "list", table: tableName })}>
            {tableLabel}
          </Link>
          {mode === "edit" && item && (
            <>
              {" / "}
              <Link to={buildAdminUrl({ view: "detail", table: tableName, id: String(item[primaryKey]) })}>
                {String(item[primaryKey])}
              </Link>
            </>
          )}
          {" / "}
          {mode === "create" ? "Create" : "Edit"}
        </Typography>
        <Typography level="h2">{title}</Typography>
      </Stack>

      {actionResult && "error" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "danger.softBg", color: "danger.plainColor" }}>
          <Typography level="body-sm">{actionResult.error}</Typography>
        </Box>
      )}
      {actionResult && "success" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "success.softBg", color: "success.plainColor" }}>
          <Typography level="body-sm">{actionResult.success}</Typography>
        </Box>
      )}

      <Box sx={{ maxWidth: 600 }}>
        <AutoForm
          table={drizzleTable}
          mode={mode}
          data={mode === "edit" ? item : undefined}
          onSubmit={handleSubmit}
          exclude={excludeFields}
        />
      </Box>
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/table-form.tsx
git commit -m "feat(admin): add table form view component"
```

---

### Task 12: Admin components — User list view

**Files:**
- Create: `packages/admin/src/components/user-list.tsx`

**Step 1: Write the component**

```tsx
import { Link, Form, useSubmit } from "react-router";
import Table from "@mui/joy/Table";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { RoleBadge } from "@cfast/ui/joy";
import type { AdminUser, AdminActionResult } from "../types";
import { buildAdminUrl } from "../utils";

type UserListViewProps = {
  items: Array<AdminUser & { createdAt?: string }>;
  total: number;
  page: number;
  totalPages: number;
  search: string;
  currentUser: AdminUser;
  actionResult?: AdminActionResult | null;
};

export function UserListView({
  items,
  total,
  page,
  totalPages,
  search,
  currentUser,
  actionResult,
}: UserListViewProps) {
  const submit = useSubmit();

  function handleImpersonate(targetId: string) {
    const formData = new FormData();
    formData.set("_action", "impersonate");
    formData.set("targetId", targetId);
    submit(formData, { method: "post" });
  }

  return (
    <Stack spacing={3}>
      <Typography level="h2">Users</Typography>

      {actionResult && "error" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "danger.softBg", color: "danger.plainColor" }}>
          <Typography level="body-sm">{actionResult.error}</Typography>
        </Box>
      )}
      {actionResult && "success" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "success.softBg", color: "success.plainColor" }}>
          <Typography level="body-sm">{actionResult.success}</Typography>
        </Box>
      )}

      <Form method="get">
        <input type="hidden" name="view" value="_users" />
        <Stack direction="row" spacing={1} alignItems="center">
          <Input
            name="search"
            placeholder="Search by name or email..."
            defaultValue={search}
            sx={{ maxWidth: 400, flex: 1 }}
          />
          <Button type="submit" variant="outlined">Search</Button>
          {search && (
            <Button
              component={Link}
              to={buildAdminUrl({ view: "users" })}
              variant="plain"
              color="neutral"
            >
              Clear
            </Button>
          )}
        </Stack>
      </Form>

      <Typography level="body-sm" sx={{ color: "neutral.500" }}>
        {total} user{total !== 1 ? "s" : ""} found
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Table hoverRow>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={buildAdminUrl({ view: "user-detail", id: u.id })}>
                    {u.name || "—"}
                  </Link>
                </td>
                <td>{u.email}</td>
                <td>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {u.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                    {u.roles.length === 0 && (
                      <Typography level="body-sm" sx={{ color: "neutral.500" }}>No roles</Typography>
                    )}
                  </Stack>
                </td>
                <td>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </td>
                <td>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      to={buildAdminUrl({ view: "user-detail", id: u.id })}
                      size="sm"
                      variant="outlined"
                    >
                      View
                    </Button>
                    {u.id !== currentUser.id && (
                      <Button
                        size="sm"
                        variant="soft"
                        color="warning"
                        onClick={() => handleImpersonate(u.id)}
                      >
                        Impersonate
                      </Button>
                    )}
                  </Stack>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <Typography level="body-sm" sx={{ textAlign: "center", py: 2, color: "neutral.500" }}>
                    No users found
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Box>

      {totalPages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          {page > 1 && (
            <Button
              component={Link}
              to={buildAdminUrl({ view: "users", page: page - 1, search: search || undefined })}
              variant="outlined"
              size="sm"
            >
              Previous
            </Button>
          )}
          <Typography level="body-sm">Page {page} of {totalPages}</Typography>
          {page < totalPages && (
            <Button
              component={Link}
              to={buildAdminUrl({ view: "users", page: page + 1, search: search || undefined })}
              variant="outlined"
              size="sm"
            >
              Next
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/user-list.tsx
git commit -m "feat(admin): add user list view component"
```

---

### Task 13: Admin components — User detail view

**Files:**
- Create: `packages/admin/src/components/user-detail.tsx`

**Step 1: Write the component**

```tsx
import { Link, useSubmit } from "react-router";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Card from "@mui/joy/Card";
import Box from "@mui/joy/Box";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useState } from "react";
import { RoleBadge, AvatarWithInitials } from "@cfast/ui/joy";
import type { AdminUser, AdminActionResult } from "../types";
import { buildAdminUrl } from "../utils";

type UserDetailViewProps = {
  targetUser: AdminUser & { createdAt?: string };
  assignableRoles: string[];
  currentUser: AdminUser;
  actionResult?: AdminActionResult | null;
};

export function UserDetailView({
  targetUser,
  assignableRoles,
  currentUser,
  actionResult,
}: UserDetailViewProps) {
  const submit = useSubmit();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Roles that can still be assigned (not already assigned)
  const availableRoles = assignableRoles.filter(
    (r) => !targetUser.roles.includes(r),
  );

  function handleAddRole() {
    if (!selectedRole) return;
    const formData = new FormData();
    formData.set("_action", "setRole");
    formData.set("userId", targetUser.id);
    formData.set("role", selectedRole);
    submit(formData, { method: "post" });
    setSelectedRole(null);
  }

  function handleRemoveRole(role: string) {
    const formData = new FormData();
    formData.set("_action", "removeRole");
    formData.set("userId", targetUser.id);
    formData.set("role", role);
    submit(formData, { method: "post" });
  }

  function handleImpersonate() {
    const formData = new FormData();
    formData.set("_action", "impersonate");
    formData.set("targetId", targetUser.id);
    submit(formData, { method: "post" });
  }

  function handleStopImpersonation() {
    const formData = new FormData();
    formData.set("_action", "stopImpersonation");
    submit(formData, { method: "post" });
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography level="body-sm">
          <Link to={buildAdminUrl({ view: "users" })}>Users</Link>
          {" / "}
          {targetUser.name || targetUser.email}
        </Typography>
        <Typography level="h2">User Detail</Typography>
      </Stack>

      {actionResult && "error" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "danger.softBg", color: "danger.plainColor" }}>
          <Typography level="body-sm">{actionResult.error}</Typography>
        </Box>
      )}
      {actionResult && "success" in actionResult && (
        <Box sx={{ p: 1.5, borderRadius: "sm", bgcolor: "success.softBg", color: "success.plainColor" }}>
          <Typography level="body-sm">{actionResult.success}</Typography>
        </Box>
      )}

      {/* Profile card */}
      <Card variant="outlined">
        <Stack direction="row" spacing={2} alignItems="center">
          <AvatarWithInitials
            src={targetUser.avatarUrl}
            name={targetUser.name || targetUser.email}
            size="lg"
          />
          <Stack spacing={0.5}>
            <Typography level="h4">{targetUser.name || "—"}</Typography>
            <Typography level="body-md">{targetUser.email}</Typography>
            {targetUser.createdAt && (
              <Typography level="body-sm" sx={{ color: "neutral.500" }}>
                Joined {new Date(targetUser.createdAt).toLocaleDateString()}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Role management */}
      <Card variant="outlined">
        <Typography level="title-lg" sx={{ mb: 2 }}>Roles</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {targetUser.roles.map((role) => (
            <Stack key={role} direction="row" spacing={0.5} alignItems="center">
              <RoleBadge role={role} />
              <Button
                size="sm"
                variant="plain"
                color="danger"
                onClick={() => handleRemoveRole(role)}
                sx={{ minWidth: "auto", px: 0.5 }}
              >
                ×
              </Button>
            </Stack>
          ))}
          {targetUser.roles.length === 0 && (
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>No roles assigned</Typography>
          )}
        </Stack>

        {availableRoles.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Select
              placeholder="Add role..."
              value={selectedRole}
              onChange={(_, val) => setSelectedRole(val)}
              sx={{ minWidth: 200 }}
            >
              {availableRoles.map((role) => (
                <Option key={role} value={role}>{role}</Option>
              ))}
            </Select>
            <Button
              variant="outlined"
              size="sm"
              onClick={handleAddRole}
              disabled={!selectedRole}
            >
              Add Role
            </Button>
          </Stack>
        )}
      </Card>

      {/* Impersonation */}
      {targetUser.id !== currentUser.id && (
        <Card variant="outlined">
          <Typography level="title-lg" sx={{ mb: 1 }}>Impersonation</Typography>
          <Typography level="body-sm" sx={{ mb: 2, color: "neutral.500" }}>
            View the application as this user. All actions will be logged.
          </Typography>
          {currentUser.isImpersonating ? (
            <Button variant="soft" color="warning" onClick={handleStopImpersonation}>
              Stop Current Impersonation
            </Button>
          ) : (
            <Button variant="soft" color="warning" onClick={handleImpersonate}>
              Impersonate {targetUser.name || targetUser.email}
            </Button>
          )}
        </Card>
      )}
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/user-detail.tsx
git commit -m "feat(admin): add user detail view component"
```

---

### Task 14: Admin root component

**Files:**
- Create: `packages/admin/src/components/admin-root.tsx`

**Step 1: Write the root component**

```tsx
import { useLoaderData, useActionData } from "react-router";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { ImpersonationBanner, ConfirmProvider } from "@cfast/ui/joy";
import type { AdminLoaderData, AdminActionResult, AdminTableMeta } from "../types";
import { AdminSidebar } from "./sidebar";
import { DashboardView } from "./dashboard";
import { TableListView } from "./table-list";
import { TableDetailView } from "./table-detail";
import { TableFormView } from "./table-form";
import { UserListView } from "./user-list";
import { UserDetailView } from "./user-detail";

type AdminRootProps = {
  tableMetas: AdminTableMeta[];
};

export function createAdminComponent(tableMetas: AdminTableMeta[]) {
  const tableMetasByName = new Map(tableMetas.map((t) => [t.name, t]));

  return function AdminRoot() {
    const data = useLoaderData() as AdminLoaderData;
    const actionResult = useActionData() as AdminActionResult | undefined;

    return (
      <ConfirmProvider>
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          {data.user.isImpersonating && <ImpersonationBanner />}

          <AdminSidebar tables={data.tables} />

          <Box component="main" sx={{ flex: 1, p: 3, overflow: "auto" }}>
            <AdminContent
              data={data}
              actionResult={actionResult}
              tableMetasByName={tableMetasByName}
            />
          </Box>
        </Box>
      </ConfirmProvider>
    );
  };
}

function AdminContent({
  data,
  actionResult,
  tableMetasByName,
}: {
  data: AdminLoaderData;
  actionResult?: AdminActionResult;
  tableMetasByName: Map<string, AdminTableMeta>;
}) {
  switch (data.view) {
    case "dashboard":
      return <DashboardView stats={data.stats} recentItems={data.recentItems} />;

    case "list": {
      const meta = tableMetasByName.get(data.tableName);
      return (
        <TableListView
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          items={data.items}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          columns={data.columns}
          searchable={data.searchable}
          sort={data.sort}
          search={data.search}
          primaryKey={meta?.primaryKey ?? "id"}
          actionResult={actionResult}
        />
      );
    }

    case "detail": {
      const meta = tableMetasByName.get(data.tableName);
      return (
        <TableDetailView
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          item={data.item}
          columns={data.columns}
          primaryKey={meta?.primaryKey ?? "id"}
        />
      );
    }

    case "create": {
      const meta = tableMetasByName.get(data.tableName);
      if (!meta) return <ErrorView message={`Table "${data.tableName}" not found`} />;
      return (
        <TableFormView
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          mode="create"
          drizzleTable={meta.drizzleTable}
          columns={data.columns}
          primaryKey={meta.primaryKey}
          actionResult={actionResult}
        />
      );
    }

    case "edit": {
      const meta = tableMetasByName.get(data.tableName);
      if (!meta) return <ErrorView message={`Table "${data.tableName}" not found`} />;
      return (
        <TableFormView
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          mode="edit"
          drizzleTable={meta.drizzleTable}
          item={data.item}
          columns={data.columns}
          primaryKey={meta.primaryKey}
          actionResult={actionResult}
        />
      );
    }

    case "users":
      return (
        <UserListView
          items={data.items}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          search={data.search}
          currentUser={data.user}
          actionResult={actionResult}
        />
      );

    case "user-detail":
      return (
        <UserDetailView
          targetUser={data.targetUser}
          assignableRoles={data.assignableRoles}
          currentUser={data.user}
          actionResult={actionResult}
        />
      );

    case "error":
      return <ErrorView message={data.message} />;
  }
}

function ErrorView({ message }: { message: string }) {
  return (
    <Stack spacing={2} sx={{ py: 4 }}>
      <Typography level="h3" color="danger">Error</Typography>
      <Typography level="body-md">{message}</Typography>
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add packages/admin/src/components/admin-root.tsx
git commit -m "feat(admin): add root admin component"
```

---

### Task 15: Main entry — createAdmin()

**Files:**
- Modify: `packages/admin/src/index.ts`

**Step 1: Write the main entry**

```typescript
import type { AdminConfig } from "./types";
import { introspectSchema } from "./introspect";
import { createAdminLoader } from "./loader";
import { createAdminAction } from "./action";
import { createAdminComponent } from "./components/admin-root";

export function createAdmin(config: AdminConfig) {
  const tableMetas = introspectSchema(config.schema, config.tables);
  const loader = createAdminLoader(config, tableMetas);
  const action = createAdminAction(config, tableMetas);
  const Component = createAdminComponent(tableMetas);

  return { loader, action, Component };
}

export type { AdminConfig, AdminAuthConfig, TableOverrides, UserManagementConfig, DashboardConfig, DashboardWidget, RowAction, TableAction, CreateDbFn, AdminUser } from "./types";
```

**Step 2: Typecheck**

Run: `pnpm --filter @cfast/admin typecheck`
Expected: Pass

**Step 3: Build**

Run: `pnpm --filter @cfast/admin build`
Expected: Success

**Step 4: Commit**

```bash
git add packages/admin/src/index.ts
git commit -m "feat(admin): add createAdmin() main entry point"
```

---

### Task 16: Update package.json dependencies

**Files:**
- Modify: `packages/admin/package.json`

**Step 1: Add missing dependencies**

The existing `package.json` already has `@cfast/*` workspace dependencies. Add the MUI Joy peer dependencies and react-router:

```json
{
  "name": "@cfast/admin",
  "version": "0.0.1",
  "description": "Auto-generated admin UI from your Drizzle schema with role management and impersonation",
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
    "@mui/joy": "^5.0.0-beta.48",
    "drizzle-orm": "^0.44.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0"
  },
  "dependencies": {
    "@cfast/actions": "workspace:*",
    "@cfast/auth": "workspace:*",
    "@cfast/db": "workspace:*",
    "@cfast/forms": "workspace:*",
    "@cfast/pagination": "workspace:*",
    "@cfast/permissions": "workspace:*",
    "@cfast/ui": "workspace:*"
  },
  "devDependencies": {
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "@mui/joy": "^5.0.0-beta.48",
    "@testing-library/jest-dom": "^6",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "drizzle-orm": "^0.44.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

**Step 2: Install dependencies**

Run: `pnpm install`
Expected: Lockfile updated, no errors

**Step 3: Commit**

```bash
git add packages/admin/package.json pnpm-lock.yaml
git commit -m "chore(admin): update dependencies"
```

---

### Task 17: Verify full build

**Step 1: Build all packages**

Run: `pnpm build`
Expected: All packages build successfully, including `@cfast/admin`

**Step 2: Run admin tests**

Run: `pnpm --filter @cfast/admin test`
Expected: introspect and utils tests pass

**Step 3: Typecheck all**

Run: `pnpm typecheck`
Expected: No type errors

**Step 4: Fix any build/type issues that arise**

If there are issues, fix them. Common issues:
- Missing type imports
- JSX runtime config in tsconfig
- Drizzle ORM type narrowing

---

### Task 18: Update example app

**Files:**
- Modify: `examples/team-blog-after/app/routes/admin.tsx`

Replace the manual admin with `createAdmin()`:

**Step 1: Update the admin route**

```typescript
import { createAdmin } from "@cfast/admin";
import { createDbClient } from "~/db/client";
import { createCfDb } from "~/db/cfast.server";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import * as schema from "~/db/schema";

const admin = createAdmin({
  db: (grants, user) => createCfDb(/* need env */) ,
  // ... exact wiring depends on how the example app exposes auth/db
  // This task should be adapted during implementation based on the example app's actual setup
});
```

> **Note:** The exact wiring of the example app depends on how `createCfDb`, `requireAuthContext`, etc. are structured. During implementation, read the example app helpers and adapt accordingly. The key files to check:
> - `examples/team-blog-after/app/auth.helpers.server.ts`
> - `examples/team-blog-after/app/db/cfast.server.ts`
> - `examples/team-blog-after/app/db/client.ts`
> - `examples/team-blog-after/app/db/schema.ts`

The goal is to replace the 7 manual admin route files with a single route using `createAdmin()`.

**Step 2: Remove old admin routes**

Delete:
- `examples/team-blog-after/app/routes/admin.posts.tsx`
- `examples/team-blog-after/app/routes/admin.users.tsx`
- `examples/team-blog-after/app/routes/admin._index.tsx`
- `examples/team-blog-after/app/routes/admin.users.$id.tsx`
- `examples/team-blog-after/app/routes/admin.impersonate.$id.tsx`
- `examples/team-blog-after/app/routes/admin.stop-impersonation.tsx`

**Step 3: Commit**

```bash
git add examples/team-blog-after/app/routes/
git commit -m "feat(example): replace manual admin with @cfast/admin"
```

---

### Task 19: Run quality agents

**Step 1: Run API reviewer**

Run agent: `.claude/agents/api-reviewer.md` (Sonnet) on `packages/admin/src/index.ts`

**Step 2: Run workers-compat check**

Run agent: `.claude/agents/workers-compat.md` (Haiku) on `packages/admin/`

**Step 3: Run package-boundary check**

Run agent: `.claude/agents/package-boundary.md` (Haiku) on `packages/admin/`

**Step 4: Run readme-sync**

Run agent: `.claude/agents/readme-sync.md` (Sonnet) — verify admin implementation matches README

**Step 5: Run example-sync**

Run agent: `.claude/agents/example-sync.md` (Sonnet) — verify example app uses latest APIs

**Step 6: Fix any issues found by agents and commit**
