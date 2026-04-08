import { describe, it, expect, vi } from "vitest";
import { createAdminAction } from "../action.js";
import type {
  AdminConfig,
  AdminTableMeta,
  RowActionContext,
} from "../types.js";
import { eq } from "drizzle-orm";
import {
  mockAdminUser,
  mockAuthConfig,
  mockDb,
  mockDbWithError,
  posts,
  testTableMetas,
  formData,
  testSchema,
} from "./helpers.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(
  overrides?: Partial<AdminConfig>,
): AdminConfig {
  return {
    db: vi.fn().mockReturnValue(mockDb()),
    auth: mockAuthConfig(),
    schema: testSchema,
    ...overrides,
  };
}

async function callAction(
  config: AdminConfig,
  fd: FormData,
  tableMetas?: AdminTableMeta[],
) {
  const metas = tableMetas ?? testTableMetas();
  const action = createAdminAction(config, metas);
  const request = new Request("http://localhost/admin", {
    method: "POST",
    body: fd,
  });
  return action(request);
}

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

describe("auth guard", () => {
  it("throws 403 when hasRole returns false", async () => {
    const auth = mockAuthConfig({ hasRole: vi.fn().mockReturnValue(false) });
    const config = makeConfig({ auth });

    try {
      await callAction(config, formData({ _action: "create" }));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const res = err as Response;
      expect(res.status).toBe(403);
    }
  });

  it("uses custom requiredRole when configured", async () => {
    const auth = mockAuthConfig({ hasRole: vi.fn().mockReturnValue(true) });
    const config = makeConfig({ auth, requiredRole: "superadmin" });

    await callAction(config, formData({ _action: "create", _table: "posts", title: "t", content: "c", author_id: "u1" }));

    expect(auth.hasRole).toHaveBeenCalledWith(
      expect.objectContaining({ id: "admin-1" }),
      "superadmin",
    );
  });
});

// ---------------------------------------------------------------------------
// Missing / unknown _action
// ---------------------------------------------------------------------------

describe("missing/unknown _action", () => {
  it('returns { error: "Missing _action field." } when _action missing', async () => {
    const config = makeConfig();
    const result = await callAction(config, formData({}));
    expect(result).toEqual({ error: "Missing _action field." });
  });

  it('returns error for unknown action', async () => {
    const config = makeConfig();
    const result = await callAction(config, formData({ _action: "fly" }));
    expect(result).toEqual({ error: 'Unknown action: "fly".' });
  });
});

// ---------------------------------------------------------------------------
// Create action
// ---------------------------------------------------------------------------

describe("create action", () => {
  it("returns error when _table missing", async () => {
    const config = makeConfig();
    const result = await callAction(config, formData({ _action: "create" }));
    expect(result).toEqual({ error: "Missing _table field." });
  });

  it("returns error when table not found", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "create", _table: "nonexistent" }),
    );
    expect(result).toEqual({ error: 'Table "nonexistent" not found.' });
  });

  it("inserts record and returns success", async () => {
    const db = mockDb();
    const insertSpy = vi.spyOn(db, "insert");
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callAction(
      config,
      formData({
        _action: "create",
        _table: "posts",
        title: "Hello",
        content: "World",
        author_id: "user-1",
      }),
    );

    expect(result).toEqual({ success: "Created new Posts record." });
    expect(insertSpy).toHaveBeenCalled();
  });

  it("skips primary key columns in form values", async () => {
    const db = mockDb();
    let capturedValues: Record<string, unknown> | undefined;
    const origInsert = db.insert.bind(db);
    (db as Record<string, unknown>).insert = vi.fn((table: unknown) => {
      const builder = origInsert(table as Parameters<typeof origInsert>[0]);
      const origValues = builder.values;
      builder.values = (vals: Record<string, unknown>) => {
        capturedValues = vals;
        return origValues(vals);
      };
      return builder;
    });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    await callAction(
      config,
      formData({
        _action: "create",
        _table: "posts",
        id: "should-be-skipped",
        title: "Test",
        content: "Body",
        author_id: "user-1",
      }),
    );

    expect(capturedValues).toBeDefined();
    expect(capturedValues).not.toHaveProperty("id");
    expect(capturedValues).toHaveProperty("title", "Test");
  });

  it('coerces boolean fields ("true" -> true)', async () => {
    const db = mockDb();
    let capturedValues: Record<string, unknown> | undefined;
    const origInsert = db.insert.bind(db);
    (db as Record<string, unknown>).insert = vi.fn((table: unknown) => {
      const builder = origInsert(table as Parameters<typeof origInsert>[0]);
      const origValues = builder.values;
      builder.values = (vals: Record<string, unknown>) => {
        capturedValues = vals;
        return origValues(vals);
      };
      return builder;
    });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    await callAction(
      config,
      formData({
        _action: "create",
        _table: "posts",
        title: "Test",
        content: "Body",
        author_id: "user-1",
        published: "true",
      }),
    );

    expect(capturedValues).toBeDefined();
    expect(capturedValues!.published).toBe(true);
  });

  it('coerces number fields ("42" -> 42)', async () => {
    const db = mockDb();
    let capturedValues: Record<string, unknown> | undefined;
    const origInsert = db.insert.bind(db);
    (db as Record<string, unknown>).insert = vi.fn((table: unknown) => {
      const builder = origInsert(table as Parameters<typeof origInsert>[0]);
      const origValues = builder.values;
      builder.values = (vals: Record<string, unknown>) => {
        capturedValues = vals;
        return origValues(vals);
      };
      return builder;
    });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    await callAction(
      config,
      formData({
        _action: "create",
        _table: "posts",
        title: "Test",
        content: "Body",
        author_id: "user-1",
        views: "42",
      }),
    );

    expect(capturedValues).toBeDefined();
    expect(capturedValues!.views).toBe(42);
  });

  it("sets null for empty optional fields", async () => {
    const db = mockDb();
    let capturedValues: Record<string, unknown> | undefined;
    const origInsert = db.insert.bind(db);
    (db as Record<string, unknown>).insert = vi.fn((table: unknown) => {
      const builder = origInsert(table as Parameters<typeof origInsert>[0]);
      const origValues = builder.values;
      builder.values = (vals: Record<string, unknown>) => {
        capturedValues = vals;
        return origValues(vals);
      };
      return builder;
    });
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    await callAction(
      config,
      formData({
        _action: "create",
        _table: "posts",
        title: "Test",
        content: "",
        author_id: "user-1",
      }),
    );

    expect(capturedValues).toBeDefined();
    // content has a default ("") so it's not required — empty string should become null
    expect(capturedValues!.content).toBeNull();
  });

  it("returns error message on db failure", async () => {
    const db = mockDbWithError("insert failed");
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callAction(
      config,
      formData({
        _action: "create",
        _table: "posts",
        title: "Test",
        content: "Body",
        author_id: "user-1",
      }),
    );

    expect(result).toEqual({ error: "insert failed" });
  });
});

// ---------------------------------------------------------------------------
// Update action
// ---------------------------------------------------------------------------

describe("update action", () => {
  it("returns error when _table missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "update", _id: "1" }),
    );
    expect(result).toEqual({ error: "Missing _table field." });
  });

  it("returns error when _id missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "update", _table: "posts" }),
    );
    expect(result).toEqual({ error: "Missing _id field." });
  });

  it("returns error for unknown table", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "update", _table: "nonexistent", _id: "1" }),
    );
    expect(result).toEqual({ error: 'Table "nonexistent" not found.' });
  });

  it("updates record and returns success", async () => {
    const db = mockDb();
    const updateSpy = vi.spyOn(db, "update");
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callAction(
      config,
      formData({
        _action: "update",
        _table: "posts",
        _id: "post-1",
        title: "Updated",
      }),
    );

    expect(result).toEqual({ success: "Updated Posts record." });
    expect(updateSpy).toHaveBeenCalled();
  });

  it("returns error on db failure", async () => {
    const db = mockDbWithError("update failed");
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callAction(
      config,
      formData({
        _action: "update",
        _table: "posts",
        _id: "post-1",
        title: "Updated",
      }),
    );

    expect(result).toEqual({ error: "update failed" });
  });
});

// ---------------------------------------------------------------------------
// Delete action
// ---------------------------------------------------------------------------

describe("delete action", () => {
  it("returns error when _table missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "delete", _id: "1" }),
    );
    expect(result).toEqual({ error: "Missing _table field." });
  });

  it("returns error when _id missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "delete", _table: "posts" }),
    );
    expect(result).toEqual({ error: "Missing _id field." });
  });

  it("deletes record and returns success", async () => {
    const db = mockDb();
    const deleteSpy = vi.spyOn(db, "delete");
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callAction(
      config,
      formData({
        _action: "delete",
        _table: "posts",
        _id: "post-1",
      }),
    );

    expect(result).toEqual({ success: "Deleted Posts record." });
    expect(deleteSpy).toHaveBeenCalled();
  });

  it("returns error on db failure", async () => {
    const db = mockDbWithError("delete failed");
    const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

    const result = await callAction(
      config,
      formData({
        _action: "delete",
        _table: "posts",
        _id: "post-1",
      }),
    );

    expect(result).toEqual({ error: "delete failed" });
  });
});

// ---------------------------------------------------------------------------
// setRole action
// ---------------------------------------------------------------------------

describe("setRole action", () => {
  it("returns error when _id missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "setRole", role: "editor" }),
    );
    expect(result).toEqual({ error: "Missing _id field." });
  });

  it("returns error when role missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "setRole", _id: "user-1" }),
    );
    expect(result).toEqual({ error: "Missing role field." });
  });

  it("calls auth.setRole and returns success", async () => {
    const auth = mockAuthConfig();
    const config = makeConfig({ auth });

    const result = await callAction(
      config,
      formData({ _action: "setRole", _id: "user-1", role: "editor" }),
    );

    expect(result).toEqual({ success: 'Role "editor" added to user.' });
    expect(auth.setRole).toHaveBeenCalledWith("user-1", "editor");
  });

  it("returns error when auth.setRole throws", async () => {
    const auth = mockAuthConfig({
      setRole: vi.fn().mockRejectedValue(new Error("role conflict")),
    });
    const config = makeConfig({ auth });

    const result = await callAction(
      config,
      formData({ _action: "setRole", _id: "user-1", role: "editor" }),
    );

    expect(result).toEqual({ error: "role conflict" });
  });
});

// ---------------------------------------------------------------------------
// removeRole action
// ---------------------------------------------------------------------------

describe("removeRole action", () => {
  it("returns error when _id missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "removeRole", role: "editor" }),
    );
    expect(result).toEqual({ error: "Missing _id field." });
  });

  it("returns error when role missing", async () => {
    const config = makeConfig();
    const result = await callAction(
      config,
      formData({ _action: "removeRole", _id: "user-1" }),
    );
    expect(result).toEqual({ error: "Missing role field." });
  });

  it("calls auth.removeRole and returns success", async () => {
    const auth = mockAuthConfig();
    const config = makeConfig({ auth });

    const result = await callAction(
      config,
      formData({ _action: "removeRole", _id: "user-1", role: "editor" }),
    );

    expect(result).toEqual({ success: 'Role "editor" removed from user.' });
    expect(auth.removeRole).toHaveBeenCalledWith("user-1", "editor");
  });
});

// ---------------------------------------------------------------------------
// impersonate action
// ---------------------------------------------------------------------------

describe("impersonate action", () => {
  it("calls auth.impersonate with admin id and target id", async () => {
    const auth = mockAuthConfig();
    const config = makeConfig({ auth });

    const result = await callAction(
      config,
      formData({ _action: "impersonate", _id: "target-1" }),
    );

    expect(result).toBeInstanceOf(Response);
    expect(auth.impersonate).toHaveBeenCalledWith(
      "admin-1",
      "target-1",
      expect.any(Request),
    );
  });

  it("throws 400 when _id missing", async () => {
    const config = makeConfig();

    try {
      await callAction(config, formData({ _action: "impersonate" }));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const res = err as Response;
      expect(res.status).toBe(400);
    }
  });
});

// ---------------------------------------------------------------------------
// stopImpersonation action
// ---------------------------------------------------------------------------

describe("stopImpersonation action", () => {
  it("calls auth.stopImpersonation", async () => {
    const auth = mockAuthConfig();
    const config = makeConfig({ auth });

    const result = await callAction(
      config,
      formData({ _action: "stopImpersonation" }),
    );

    expect(result).toBeInstanceOf(Response);
    expect(auth.stopImpersonation).toHaveBeenCalledWith(expect.any(Request));
  });
});

// ---------------------------------------------------------------------------
// Custom action
// ---------------------------------------------------------------------------

describe("custom action", () => {
  function metasWithCustomAction(
    handler = vi.fn().mockResolvedValue(undefined),
  ): { metas: AdminTableMeta[]; handler: ReturnType<typeof vi.fn> } {
    const metas = testTableMetas({
      posts: {
        actions: {
          row: [{ label: "archive", action: handler }],
        },
      },
    });
    return { metas, handler };
  }

  it("returns error when _table missing", async () => {
    const config = makeConfig();
    const { metas } = metasWithCustomAction();
    const result = await callAction(
      config,
      formData({ _action: "custom", _actionName: "archive", _id: "1" }),
      metas,
    );
    expect(result).toEqual({ error: "Missing _table field." });
  });

  it("returns error when _actionName missing", async () => {
    const config = makeConfig();
    const { metas } = metasWithCustomAction();
    const result = await callAction(
      config,
      formData({ _action: "custom", _table: "posts", _id: "1" }),
      metas,
    );
    expect(result).toEqual({ error: "Missing _actionName field." });
  });

  it("returns error when _id missing", async () => {
    const config = makeConfig();
    const { metas } = metasWithCustomAction();
    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
      }),
      metas,
    );
    expect(result).toEqual({ error: "Missing _id field." });
  });

  it("returns error when table has no custom actions", async () => {
    const config = makeConfig();
    const metas = testTableMetas(); // no custom actions
    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "1",
      }),
      metas,
    );
    expect(result).toEqual({
      error: 'No custom actions defined for table "posts".',
    });
  });

  it("executes custom row action handler and returns success", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig();

    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    expect(result).toEqual({ success: 'Action "archive" completed.' });
    expect(handler).toHaveBeenCalledWith(
      "post-1",
      expect.any(FormData),
      expect.objectContaining({
        user: expect.objectContaining({ id: "admin-1" }),
        grants: expect.any(Array),
        db: expect.any(Object),
        request: expect.any(Request),
      }),
    );
  });

  it("passes the authenticated admin, scoped db, grants, and request on ctx", async () => {
    // Capture the ctx that the row action was invoked with so we can assert
    // on every field individually.
    let captured: RowActionContext | undefined;
    const handler = vi.fn(
      async (_id: string, _fd: FormData, ctx: RowActionContext) => {
        captured = ctx;
      },
    );
    const { metas } = metasWithCustomAction(handler);

    const adminUser = mockAdminUser({ id: "admin-42", email: "a@b.c" });
    const grants = [{ action: "read", table: "posts" }];
    const scopedDb = mockDb();
    const auth = mockAuthConfig({
      requireUser: vi
        .fn()
        .mockResolvedValue({ user: adminUser, grants }),
    });
    const dbFactory = vi.fn().mockReturnValue(scopedDb);
    const config = makeConfig({ auth, db: dbFactory });

    await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    // dbFactory is the `CreateDbFn` — called with (grants, user) per-request.
    expect(dbFactory).toHaveBeenCalledWith(grants, adminUser);

    // The ctx surfaced to the handler must be the scoped db + admin — not a bypass.
    expect(captured).toBeDefined();
    expect(captured!.user).toBe(adminUser);
    expect(captured!.grants).toBe(grants);
    expect(captured!.db).toBe(scopedDb);
    expect(captured!.request).toBeInstanceOf(Request);
  });

  it("scoped ctx.db rejects queries outside the admin's grants", async () => {
    // Simulate a permission-scoped db that throws when the acting user's
    // grants don't permit the operation — the same behaviour a real
    // `@cfast/db` instance produces when `grants` are too narrow.
    const scopedDb = mockDbWithError(
      "permission denied: missing grant for 'update posts'",
    );
    const auth = mockAuthConfig({
      requireUser: vi.fn().mockResolvedValue({
        user: mockAdminUser(),
        grants: [], // intentionally no grants
      }),
    });

    const handler = vi.fn(
      async (id: string, _fd: FormData, ctx: RowActionContext) => {
        // The handler tries an update the scoped db won't allow. In the
        // mock, this chain resolves to a promise that rejects with a
        // permission-denied error — the same shape a real `@cfast/db`
        // instance produces when `grants` are too narrow.
        await ctx.db
          .update(posts)
          .set({ published: true })
          .where(eq(posts.id, id))
          .run({});
        return { id };
      },
    );
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig({
      auth,
      db: vi.fn().mockReturnValue(scopedDb),
    });

    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    // The scoped db rejected the operation — no silent bypass.
    expect(result).toEqual({
      error: "permission denied: missing grant for 'update posts'",
    });
    expect(handler).toHaveBeenCalled();
  });

  it("exposes ctx.db.unsafe() as an explicit escape hatch for admin overrides", async () => {
    // When a row action genuinely needs to bypass grants (e.g. cross-tenant
    // bookkeeping), the handler must opt in via `ctx.db.unsafe()` — a
    // greppable, intention-revealing API — rather than receiving an
    // elevated db by default.
    const scopedDb = mockDb();
    const unsafeSpy = vi.spyOn(scopedDb, "unsafe");

    const handler = vi.fn(
      async (id: string, _fd: FormData, ctx: RowActionContext) => {
        const escape = ctx.db.unsafe();
        // Using the escape hatch should not throw.
        await escape
          .update(posts)
          .set({ published: true })
          .where(eq(posts.id, id))
          .run({});
      },
    );
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig({ db: vi.fn().mockReturnValue(scopedDb) });

    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    expect(result).toEqual({ success: 'Action "archive" completed.' });
    expect(unsafeSpy).toHaveBeenCalled();
  });

  it("returns error when action name not found", async () => {
    const { metas } = metasWithCustomAction();
    const config = makeConfig();

    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "nonexistent",
        _id: "1",
      }),
      metas,
    );

    expect(result).toEqual({
      error: 'Action "nonexistent" not found for table "posts".',
    });
  });

  it("returns error when custom action throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("action exploded"));
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig();

    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    expect(result).toEqual({ error: "action exploded" });
  });

  // ---------------------------------------------------------------------
  // Row action email client (#155)
  //
  // The RowActionContext must expose an optional `email` client so row
  // actions like "approve vendor" can send notifications through the
  // app's existing email pipeline. These tests pin:
  //
  //   1. `ctx.email` is undefined when no email config is provided.
  //   2. A direct client is passed through unchanged.
  //   3. A lazy getter is resolved per-request (not memoized at module
  //      scope) so Workers-native env binding patterns still work.
  //   4. The handler can call `ctx.email.send({...})` and the mock
  //      client records the exact payload.
  // ---------------------------------------------------------------------

  it("ctx.email is undefined when no email client is configured", async () => {
    let captured: RowActionContext | undefined;
    const handler = vi.fn(async (_id, _fd, ctx: RowActionContext) => {
      captured = ctx;
    });
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig(); // no email field

    await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    expect(captured).toBeDefined();
    expect(captured!.email).toBeUndefined();
  });

  it("ctx.email is the client passed in AdminConfig.email", async () => {
    const emailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg-123" }),
    };
    let captured: RowActionContext | undefined;
    const handler = vi.fn(async (_id, _fd, ctx: RowActionContext) => {
      captured = ctx;
    });
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig({ email: emailClient });

    await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );

    expect(captured!.email).toBe(emailClient);
  });

  it("ctx.email is resolved via the lazy getter form on every invocation", async () => {
    // The getter form exists so consumers can defer resolving Cloudflare
    // bindings until send time (`env.get()` inside a Worker). Each custom
    // action dispatch should go through the getter so per-request state
    // (e.g. APP_URL) is fresh.
    const emailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg-1" }),
    };
    const getter = vi.fn(() => emailClient);

    let captured: RowActionContext | undefined;
    const handler = vi.fn(async (_id, _fd, ctx: RowActionContext) => {
      captured = ctx;
    });
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig({ email: getter });

    // First dispatch.
    await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      }),
      metas,
    );
    expect(getter).toHaveBeenCalledTimes(1);
    expect(captured!.email).toBe(emailClient);

    // Second dispatch — the getter is called again, not memoized at
    // module scope. This matches the lazy env-binding pattern the email
    // package documents.
    await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-2",
      }),
      metas,
    );
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it("handler can send a notification through ctx.email", async () => {
    const emailClient = {
      send: vi.fn().mockResolvedValue({ id: "vendor-approved-msg" }),
    };
    const handler = vi.fn(async (id: string, _fd, ctx: RowActionContext) => {
      // Representative "approve vendor" flow: write to D1 (omitted in
      // the mock), then notify the vendor by email.
      await ctx.email!.send({
        to: "vendor@example.com",
        subject: "Your application has been approved",
        react: null, // real usage passes a React element
      });
      return { id };
    });
    const { metas } = metasWithCustomAction(handler);
    const config = makeConfig({ email: emailClient });

    const result = await callAction(
      config,
      formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "vendor-42",
      }),
      metas,
    );

    expect(result).toEqual({ success: 'Action "archive" completed.' });
    expect(emailClient.send).toHaveBeenCalledTimes(1);
    expect(emailClient.send).toHaveBeenCalledWith({
      to: "vendor@example.com",
      subject: "Your application has been approved",
      react: null,
    });
  });
});
