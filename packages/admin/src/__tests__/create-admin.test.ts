import { describe, it, expect, vi } from "vitest";
import type { AdminConfig } from "../types.js";
import { mockAuthConfig, mockDb, testSchema } from "./helpers.js";

// Mock the component factory to avoid pulling in React/MUI/Joy dependencies
vi.mock("../components/admin-root.js", () => ({
  createAdminComponent: vi.fn().mockReturnValue(function AdminRoot() {
    return null;
  }),
}));

// Import after mock is set up
const { createAdmin } = await import("../create-admin.js");

function makeConfig(overrides?: Partial<AdminConfig>): AdminConfig {
  return {
    db: vi.fn().mockReturnValue(mockDb()),
    auth: mockAuthConfig(),
    schema: testSchema,
    ...overrides,
  };
}

describe("createAdmin", () => {
  it("returns loader, action, and Component", async () => {
    const admin = await createAdmin(makeConfig());

    expect(admin).toHaveProperty("loader");
    expect(admin).toHaveProperty("action");
    expect(admin).toHaveProperty("Component");
    expect(typeof admin.loader).toBe("function");
    expect(typeof admin.action).toBe("function");
    expect(typeof admin.Component).toBe("function");
  });

  it("filters auto-excluded auth tables from introspection", async () => {
    const admin = await createAdmin(makeConfig());
    // session is in testSchema but auto-excluded — should not appear in sidebar
    const request = new Request("http://localhost/admin");
    const data = await admin.loader(request);
    if (data.view !== "dashboard") return;
    const tableNames = data.tables.map((t) => t.name);
    expect(tableNames).not.toContain("session");
  });

  it("applies table overrides during introspection", async () => {
    const admin = await createAdmin(
      makeConfig({ tables: { posts: { label: "Articles" } } }),
    );
    const request = new Request("http://localhost/admin?view=posts");
    const data = await admin.loader(request);
    if (data.view !== "list") return;
    expect(data.tableLabel).toBe("Articles");
  });

  it("loader and action share the same auth config", async () => {
    const auth = mockAuthConfig();
    const admin = await createAdmin(makeConfig({ auth }));

    await admin.loader(new Request("http://localhost/admin"));
    await admin.action(
      new Request("http://localhost/admin", {
        method: "POST",
        body: new URLSearchParams({ _action: "create", _table: "posts", title: "Hi" }),
      }),
    );

    expect(auth.requireUser).toHaveBeenCalledTimes(2);
  });
});
