import { describe, it, expect, vi } from "vitest";
import { createAdminLoader } from "../loader.js";
import type {
  AdminConfig,
  AdminLoaderData,
} from "../types.js";
import {
  mockAuthConfig,
  mockDb,
  testTableMetas,
  testSchema,
  mockAdminUser,
} from "./helpers.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides?: Partial<AdminConfig>): AdminConfig {
  return {
    db: vi.fn().mockReturnValue(mockDb()),
    auth: mockAuthConfig(),
    schema: testSchema,
    ...overrides,
  };
}

async function callLoader(
  config: AdminConfig,
  urlPath: string,
): Promise<AdminLoaderData> {
  const tableMetas = await testTableMetas();
  const loader = createAdminLoader(config, tableMetas);
  const request = new Request(new URL(urlPath, "http://localhost"));
  return loader(request);
}

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

describe("auth guard", () => {
  it("throws redirect (302 to '/') when hasRole returns false", async () => {
    const auth = mockAuthConfig({ hasRole: vi.fn().mockReturnValue(false) });
    const config = makeConfig({ auth });

    try {
      await callLoader(config, "/admin");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const res = err as Response;
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/");
    }
  });

  it("uses custom requiredRole when configured", async () => {
    const auth = mockAuthConfig({ hasRole: vi.fn().mockReturnValue(true) });
    const config = makeConfig({ auth, requiredRole: "superadmin" });

    await callLoader(config, "/admin");

    expect(auth.hasRole).toHaveBeenCalledWith(
      expect.objectContaining({ id: "admin-1" }),
      "superadmin",
    );
  });

  it("calls auth.requireUser with the request", async () => {
    const auth = mockAuthConfig();
    const config = makeConfig({ auth });

    await callLoader(config, "/admin");

    expect(auth.requireUser).toHaveBeenCalledWith(expect.any(Request));
  });
});

// ---------------------------------------------------------------------------
// Dashboard view
// ---------------------------------------------------------------------------

describe("dashboard view", () => {
  it("returns dashboard view when no params", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin");
    expect(result.view).toBe("dashboard");
  });

  it("returns dashboard for ?view=dashboard", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=dashboard");
    expect(result.view).toBe("dashboard");
  });

  it("includes user info", async () => {
    const user = mockAdminUser({ name: "Test Admin" });
    const auth = mockAuthConfig({
      requireUser: vi.fn().mockResolvedValue({ user, grants: [] }),
    });
    const config = makeConfig({ auth });

    const result = await callLoader(config, "/admin");
    expect(result.user).toEqual(user);
  });

  it("includes tables list (excluding users/user table from sidebar)", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin");

    if (result.view !== "dashboard") throw new Error("expected dashboard");

    // The sidebar tables should NOT include 'users'
    const tableNames = result.tables.map((t) => t.name);
    expect(tableNames).toContain("posts");
    expect(tableNames).not.toContain("users");
    expect(tableNames).not.toContain("user");
  });

  it("includes stats for each table", async () => {
    const postRows = [
      { id: "p1", title: "Post 1" },
      { id: "p2", title: "Post 2" },
    ];
    const userRows = [{ id: "u1", name: "User 1" }];
    const db = mockDb({ posts: postRows, users: userRows });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin");

    if (result.view !== "dashboard") throw new Error("expected dashboard");

    // Default dashboard counts all tables in tableMetas (posts + users)
    expect(result.stats.length).toBeGreaterThanOrEqual(2);
    const postsCount = result.stats.find((s) => s.label.toLowerCase().includes("post"));
    expect(postsCount).toBeDefined();
    expect(postsCount!.value).toBe(2);
  });

  it("includes recent items from first table", async () => {
    const postRows = [
      { id: "p1", title: "Post 1" },
      { id: "p2", title: "Post 2" },
    ];
    const db = mockDb({ posts: postRows });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin");

    if (result.view !== "dashboard") throw new Error("expected dashboard");

    expect(result.recentItems.length).toBeGreaterThanOrEqual(1);
    // First table meta alphabetically is "posts"
    expect(result.recentItems[0].table).toBe("posts");
  });
});

// ---------------------------------------------------------------------------
// Dashboard with configured widgets
// ---------------------------------------------------------------------------

describe("dashboard with configured widgets", () => {
  it("uses configured count widgets", async () => {
    const postRows = [
      { id: "p1", title: "A" },
      { id: "p2", title: "B" },
      { id: "p3", title: "C" },
    ];
    const db = mockDb({ posts: postRows });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      dashboard: {
        widgets: [{ type: "count", table: "posts", label: "Total Posts" }],
      },
    });

    const result = await callLoader(config, "/admin");

    if (result.view !== "dashboard") throw new Error("expected dashboard");
    expect(result.stats).toEqual([{ label: "Total Posts", value: 3 }]);
  });

  it("uses configured recent widgets", async () => {
    const postRows = [
      { id: "p1", title: "A" },
      { id: "p2", title: "B" },
    ];
    const db = mockDb({ posts: postRows });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      dashboard: {
        widgets: [
          { type: "recent", table: "posts", label: "Latest Posts", limit: 3 },
        ],
      },
    });

    const result = await callLoader(config, "/admin");

    if (result.view !== "dashboard") throw new Error("expected dashboard");
    expect(result.recentItems).toHaveLength(1);
    expect(result.recentItems[0].label).toBe("Latest Posts");
    expect(result.recentItems[0].table).toBe("posts");
  });

  it("skips widgets for unknown tables", async () => {
    const db = mockDb({ posts: [{ id: "p1" }] });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      dashboard: {
        widgets: [
          { type: "count", table: "nonexistent", label: "Nope" },
          { type: "count", table: "posts", label: "Posts" },
        ],
      },
    });

    const result = await callLoader(config, "/admin");

    if (result.view !== "dashboard") throw new Error("expected dashboard");
    // The nonexistent table widget is skipped
    expect(result.stats).toEqual([{ label: "Posts", value: 1 }]);
  });
});

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

describe("list view", () => {
  it("returns list view for table param", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=posts");
    expect(result.view).toBe("list");
  });

  it("returns error for unknown table", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=nonexistent");
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("nonexistent");
    }
  });

  it("includes pagination data (page from URL)", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=posts&page=3");
    if (result.view !== "list") throw new Error("expected list");
    expect(result.page).toBe(3);
  });

  it("includes sort data (sort + dir from URL)", async () => {
    const config = makeConfig();
    const result = await callLoader(
      config,
      "/admin?view=posts&sort=title&dir=asc",
    );
    if (result.view !== "list") throw new Error("expected list");
    expect(result.sort.column).toBe("title");
    expect(result.sort.direction).toBe("asc");
  });

  it("uses default sort when no sort param (PK desc)", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=posts");
    if (result.view !== "list") throw new Error("expected list");
    // Default sort is PK descending
    expect(result.sort.column).toBe("id");
    expect(result.sort.direction).toBe("desc");
  });

  it("passes search to response", async () => {
    const config = makeConfig();
    const result = await callLoader(
      config,
      "/admin?view=posts&search=hello",
    );
    if (result.view !== "list") throw new Error("expected list");
    expect(result.search).toBe("hello");
  });

  it("includes column metadata", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=posts");
    if (result.view !== "list") throw new Error("expected list");
    expect(result.columns.length).toBeGreaterThan(0);
    const colNames = result.columns.map((c) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("title");
  });

  it("includes items from db query", async () => {
    const postRows = [
      { id: "p1", title: "A", content: "x", author_id: "u1", published: false, views: 0 },
      { id: "p2", title: "B", content: "y", author_id: "u1", published: true, views: 5 },
    ];
    const db = mockDb({ posts: postRows });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin?view=posts");
    if (result.view !== "list") throw new Error("expected list");
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------

describe("detail view", () => {
  it("returns detail with item data", async () => {
    const postRows = [
      { id: "p1", title: "Post 1", content: "Body" },
    ];
    const db = mockDb({ posts: postRows });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin?view=posts&id=p1");
    expect(result.view).toBe("detail");
    if (result.view === "detail") {
      expect(result.item).toEqual(postRows[0]);
      expect(result.tableName).toBe("posts");
    }
  });

  it("returns error when record not found", async () => {
    const db = mockDb({ posts: [] });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin?view=posts&id=missing");
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("missing");
    }
  });

  it("returns error for unknown table", async () => {
    const config = makeConfig();
    const result = await callLoader(config, "/admin?view=nonexistent&id=1");
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("nonexistent");
    }
  });
});

// ---------------------------------------------------------------------------
// Create view
// ---------------------------------------------------------------------------

describe("create view", () => {
  it("returns create view with columns metadata", async () => {
    const config = makeConfig();
    const result = await callLoader(
      config,
      "/admin?view=posts&mode=create",
    );
    expect(result.view).toBe("create");
    if (result.view === "create") {
      expect(result.columns.length).toBeGreaterThan(0);
      expect(result.tableName).toBe("posts");
    }
  });

  it("returns error for unknown table", async () => {
    const config = makeConfig();
    const result = await callLoader(
      config,
      "/admin?view=nonexistent&mode=create",
    );
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("nonexistent");
    }
  });
});

// ---------------------------------------------------------------------------
// Edit view
// ---------------------------------------------------------------------------

describe("edit view", () => {
  it("returns edit view with record and columns", async () => {
    const postRows = [
      { id: "p1", title: "Post 1", content: "Body" },
    ];
    const db = mockDb({ posts: postRows });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(
      config,
      "/admin?view=posts&id=p1&mode=edit",
    );
    expect(result.view).toBe("edit");
    if (result.view === "edit") {
      expect(result.item).toEqual(postRows[0]);
      expect(result.columns.length).toBeGreaterThan(0);
      expect(result.tableName).toBe("posts");
    }
  });

  it("returns error when record not found", async () => {
    const db = mockDb({ posts: [] });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(
      config,
      "/admin?view=posts&id=missing&mode=edit",
    );
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("missing");
    }
  });

  it("returns error for unknown table", async () => {
    const config = makeConfig();
    const result = await callLoader(
      config,
      "/admin?view=nonexistent&id=1&mode=edit",
    );
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("nonexistent");
    }
  });
});

// ---------------------------------------------------------------------------
// User list view
// ---------------------------------------------------------------------------

describe("user list view", () => {
  it("returns user list with role enrichment", async () => {
    const userRows = [
      { id: "u1", email: "a@test.com", name: "Alice", avatar_url: null, created_at: "2024-01-01" },
      { id: "u2", email: "b@test.com", name: "Bob", avatar_url: null, created_at: "2024-01-02" },
    ];
    const auth = mockAuthConfig({
      getRoles: vi.fn().mockResolvedValue(["editor"]),
    });
    const db = mockDb({ users: userRows });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      auth,
    });

    const result = await callLoader(config, "/admin?view=_users");
    expect(result.view).toBe("users");
    if (result.view === "users") {
      expect(result.items).toHaveLength(2);
      // getRoles is called per user
      expect(auth.getRoles).toHaveBeenCalledTimes(2);
      expect(auth.getRoles).toHaveBeenCalledWith("u1");
      expect(auth.getRoles).toHaveBeenCalledWith("u2");
      // Each user should have the enriched roles
      expect(result.items[0].roles).toEqual(["editor"]);
    }
  });

  it("includes assignableRoles from config", async () => {
    const userRows = [
      { id: "u1", email: "a@test.com", name: "Alice", avatar_url: null },
    ];
    const db = mockDb({ users: userRows });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      users: { assignableRoles: ["admin", "editor", "viewer"] },
    });

    const result = await callLoader(config, "/admin?view=_users");
    if (result.view !== "users") throw new Error("expected users");
    expect(result.assignableRoles).toEqual(["admin", "editor", "viewer"]);
  });

  it("defaults assignableRoles to empty array", async () => {
    const userRows = [
      { id: "u1", email: "a@test.com", name: "Alice", avatar_url: null },
    ];
    const db = mockDb({ users: userRows });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin?view=_users");
    if (result.view !== "users") throw new Error("expected users");
    expect(result.assignableRoles).toEqual([]);
  });

  it("passes search and page to response", async () => {
    const db = mockDb({ users: [] });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(
      config,
      "/admin?view=_users&page=2&search=jane",
    );
    if (result.view !== "users") throw new Error("expected users");
    expect(result.page).toBe(2);
    expect(result.search).toBe("jane");
  });

  it("returns error when users table not in schema", async () => {
    // Use a schema without any users table
    const { sqliteTable, text } = await import("drizzle-orm/sqlite-core");
    const articles = sqliteTable("articles", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });
    const schemaWithoutUsers = { articles };
    const metas = await (await import("../introspect.js")).introspectSchema(
      schemaWithoutUsers,
    );
    const config: AdminConfig = {
      db: vi.fn().mockReturnValue(mockDb()),
      auth: mockAuthConfig(),
      schema: schemaWithoutUsers,
    };
    const loader = createAdminLoader(config, metas);
    const request = new Request(
      new URL("/admin?view=_users", "http://localhost"),
    );
    const result = await loader(request);
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("Users table not found");
    }
  });
});

// ---------------------------------------------------------------------------
// User detail view
// ---------------------------------------------------------------------------

describe("user detail view", () => {
  it("returns user detail with roles", async () => {
    const userRows = [
      { id: "u1", email: "a@test.com", name: "Alice", avatar_url: null, created_at: "2024-01-01" },
    ];
    const auth = mockAuthConfig({
      getRoles: vi.fn().mockResolvedValue(["admin", "editor"]),
    });
    const db = mockDb({ users: userRows });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      auth,
    });

    const result = await callLoader(config, "/admin?view=_users&id=u1");
    expect(result.view).toBe("user-detail");
    if (result.view === "user-detail") {
      expect(result.targetUser.id).toBe("u1");
      expect(result.targetUser.email).toBe("a@test.com");
      expect(result.targetUser.roles).toEqual(["admin", "editor"]);
    }
  });

  it("returns error when user not found", async () => {
    const db = mockDb({ users: [] });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callLoader(config, "/admin?view=_users&id=missing");
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("missing");
    }
  });

  it("returns error when users table not in schema", async () => {
    const { sqliteTable, text } = await import("drizzle-orm/sqlite-core");
    const articles = sqliteTable("articles", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });
    const schemaWithoutUsers = { articles };
    const metas = await (await import("../introspect.js")).introspectSchema(
      schemaWithoutUsers,
    );
    const config: AdminConfig = {
      db: vi.fn().mockReturnValue(mockDb()),
      auth: mockAuthConfig(),
      schema: schemaWithoutUsers,
    };
    const loader = createAdminLoader(config, metas);
    const request = new Request(
      new URL("/admin?view=_users&id=u1", "http://localhost"),
    );
    const result = await loader(request);
    expect(result.view).toBe("error");
    if (result.view === "error") {
      expect(result.message).toContain("Users table not found");
    }
  });

  it("includes assignableRoles", async () => {
    const userRows = [
      { id: "u1", email: "a@test.com", name: "Alice", avatar_url: null },
    ];
    const db = mockDb({ users: userRows });
    const config = makeConfig({
      db: vi.fn().mockReturnValue(db),
      users: { assignableRoles: ["admin", "editor"] },
    });

    const result = await callLoader(config, "/admin?view=_users&id=u1");
    if (result.view !== "user-detail") throw new Error("expected user-detail");
    expect(result.assignableRoles).toEqual(["admin", "editor"]);
  });
});
