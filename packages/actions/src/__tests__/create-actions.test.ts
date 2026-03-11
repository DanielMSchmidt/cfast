import { describe, it, expect, vi } from "vitest";
import { createActions, checkPermissionStatus } from "../create-actions.js";
import type { ActionContext, RequestArgs } from "../types.js";
import type { Db } from "@cfast/db";
import type { Grant } from "@cfast/permissions";
import { createMockOperation, createFormDataRequest } from "./helpers.js";

const mockTable = { _: { name: "posts" } };
const otherTable = { _: { name: "comments" } };

function makeGetContext(grants: Grant[] = []) {
  return async (_args: RequestArgs): Promise<ActionContext<{ id: string }>> => ({
    db: {} as Db,
    user: { id: "user-1" },
    grants,
  });
}

describe("createActions", () => {
  it("returns createAction and composeActions", () => {
    const { createAction, composeActions } = createActions({
      getContext: makeGetContext(),
    });

    expect(typeof createAction).toBe("function");
    expect(typeof composeActions).toBe("function");
  });

  it("createAction returns object with action, loader, client, buildOperation", () => {
    const { createAction } = createActions({
      getContext: makeGetContext(),
    });

    const def = createAction((db, _input: { title: string }, _ctx) => ({
      permissions: [{ action: "create" as const, table: mockTable }],
      run: async () => ({ id: "1" }),
    }));

    expect(typeof def.action).toBe("function");
    expect(typeof def.loader).toBe("function");
    expect(def.client).toBeDefined();
    expect(typeof def.buildOperation).toBe("function");
  });

  it("client._brand is ActionClientDescriptor", () => {
    const { createAction } = createActions({
      getContext: makeGetContext(),
    });

    const def = createAction((_db, _input: Record<string, never>, _ctx) => ({
      permissions: [],
      run: async () => null,
    }));

    expect(def.client._brand).toBe("ActionClientDescriptor");
  });

  it("client has actionNames and permissionsKey", () => {
    const { createAction } = createActions({
      getContext: makeGetContext(),
    });

    const def = createAction((_db, _input: Record<string, never>, _ctx) => ({
      permissions: [],
      run: async () => null,
    }));

    expect(def.client.actionNames.length).toBe(1);
    expect(def.client.permissionsKey).toBe("_actionPermissions");
  });
});

describe("single action .action() handler", () => {
  it("parses formData input and passes it to operationsFn", async () => {
    const operationsFn = vi.fn((_db: Db, input: { title: string }, _ctx: ActionContext<{ id: string }>) =>
      createMockOperation({ id: "new-1" }),
    );

    const { createAction } = createActions({ getContext: makeGetContext() });
    const def = createAction(operationsFn);

    const request = createFormDataRequest({ title: "Hello World" });
    await def.action({ request, params: {} });

    expect(operationsFn).toHaveBeenCalledOnce();
    const receivedInput = operationsFn.mock.calls[0][1];
    expect(receivedInput).toEqual({ title: "Hello World" });
  });

  it("calls getContext with the request args", async () => {
    const getContext = vi.fn(makeGetContext());
    const { createAction } = createActions({ getContext });
    const def = createAction((_db, _input: { title: string }, _ctx) =>
      createMockOperation({ id: "1" }),
    );

    const args: RequestArgs = {
      request: createFormDataRequest({ title: "test" }),
      params: { slug: "hello" },
    };
    await def.action(args);

    expect(getContext).toHaveBeenCalledOnce();
    expect(getContext.mock.calls[0][0]).toBe(args);
  });

  it("calls operation.run and returns its result", async () => {
    const expectedResult = { id: "created-42", title: "My Post" };
    const { createAction } = createActions({ getContext: makeGetContext() });
    const def = createAction((_db, _input: { title: string }, _ctx) =>
      createMockOperation(expectedResult),
    );

    const result = await def.action({
      request: createFormDataRequest({ title: "My Post" }),
      params: {},
    });

    expect(result).toEqual(expectedResult);
  });

  it("consumes the request body (formData) during action execution", async () => {
    const { createAction } = createActions({ getContext: makeGetContext() });
    const def = createAction((_db, _input: { title: string }, _ctx) =>
      createMockOperation({ ok: true }),
    );

    const request = createFormDataRequest({ title: "test" });
    await def.action({ request, params: {} });

    // After action reads formData, the original request body is consumed
    // This verifies the implementation reads the body
    await expect(request.formData()).rejects.toThrow();
  });
});

describe("composed .action() handler", () => {
  function setupComposed(grants: Grant[] = []) {
    const createFn = vi.fn((_db: Db, _input: { title: string }, _ctx: ActionContext<{ id: string }>) =>
      createMockOperation({ id: "new-1" }),
    );
    const deleteFn = vi.fn((_db: Db, _input: { id: string }, _ctx: ActionContext<{ id: string }>) =>
      createMockOperation(null),
    );

    const { createAction, composeActions } = createActions({
      getContext: makeGetContext(grants),
    });

    const create = createAction(createFn);
    const remove = createAction(deleteFn);
    const composed = composeActions({ create, remove });

    return { composed, createFn, deleteFn };
  }

  it("dispatches to correct handler based on _action formData field", async () => {
    const { composed, createFn, deleteFn } = setupComposed();

    const request = createFormDataRequest({ _action: "create", title: "Hello" });
    await composed.action({ request, params: {} });

    expect(createFn).toHaveBeenCalledOnce();
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it("dispatches to the other handler when _action changes", async () => {
    const { composed, createFn, deleteFn } = setupComposed();

    const request = createFormDataRequest({ _action: "remove", id: "42" });
    await composed.action({ request, params: {} });

    expect(deleteFn).toHaveBeenCalledOnce();
    expect(createFn).not.toHaveBeenCalled();
  });

  it("throws Error for unknown _action value", async () => {
    const { composed } = setupComposed();

    const request = createFormDataRequest({ _action: "unknown" });
    await expect(
      composed.action({ request, params: {} }),
    ).rejects.toThrow('Unknown action: "unknown"');
  });

  it("throws Error when _action is missing", async () => {
    const { composed } = setupComposed();

    const request = createFormDataRequest({ title: "no action field" });
    await expect(
      composed.action({ request, params: {} }),
    ).rejects.toThrow("Unknown action");
  });
});

describe("single .loader() wrapper", () => {
  it("calls the wrapped loader and returns its data plus _actionPermissions", async () => {
    const grants: Grant[] = [{ action: "create", subject: mockTable }];
    const { createAction } = createActions({ getContext: makeGetContext(grants) });

    const def = createAction((_db, _input: { title: string }, _ctx) => ({
      permissions: [{ action: "create" as const, table: mockTable }],
      run: async () => ({ id: "1" }),
    }));

    const wrappedLoader = def.loader(async (_args) => ({
      posts: [{ id: "1", title: "Test" }],
    }));

    const result = await wrappedLoader({
      request: new Request("https://test.example.com"),
      params: {},
    });

    expect(result.posts).toEqual([{ id: "1", title: "Test" }]);
    expect(result._actionPermissions).toBeDefined();
  });

  it("_actionPermissions has the correct action ID key with permission status", async () => {
    const grants: Grant[] = [{ action: "create", subject: mockTable }];
    const { createAction } = createActions({ getContext: makeGetContext(grants) });

    const def = createAction((_db, _input: { title: string }, _ctx) => ({
      permissions: [{ action: "create" as const, table: mockTable }],
      run: async () => ({ id: "1" }),
    }));

    const wrappedLoader = def.loader(async () => ({ data: "test" }));
    const result = await wrappedLoader({
      request: new Request("https://test.example.com"),
      params: {},
    });

    const permKeys = Object.keys(result._actionPermissions);
    expect(permKeys).toHaveLength(1);
    // The key should be the auto-generated action ID (action_N)
    expect(permKeys[0]).toMatch(/^action_\d+$/);
    expect(result._actionPermissions[permKeys[0]].permitted).toBe(true);
  });
});

describe("composed .loader() wrapper", () => {
  it("injects permissions for ALL actions keyed by name", async () => {
    const grants: Grant[] = [
      { action: "create", subject: mockTable },
      { action: "delete", subject: mockTable },
    ];
    const { createAction, composeActions } = createActions({
      getContext: makeGetContext(grants),
    });

    const create = createAction((_db, _input: { title: string }, _ctx) => ({
      permissions: [{ action: "create" as const, table: mockTable }],
      run: async () => ({ id: "1" }),
    }));

    const remove = createAction((_db, _input: { id: string }, _ctx) => ({
      permissions: [{ action: "delete" as const, table: mockTable }],
      run: async () => null,
    }));

    const composed = composeActions({ create, remove });
    const wrappedLoader = composed.loader(async () => ({ items: [] }));

    const result = await wrappedLoader({
      request: new Request("https://test.example.com"),
      params: {},
    });

    expect(result.items).toEqual([]);
    // Keys should be the action names ("create", "remove"), not action IDs
    expect(result._actionPermissions).toHaveProperty("create");
    expect(result._actionPermissions).toHaveProperty("remove");
    expect(result._actionPermissions.create.permitted).toBe(true);
    expect(result._actionPermissions.remove.permitted).toBe(true);
  });

  it("each action's permissions are correctly computed from its operation's descriptors", async () => {
    // Only grant create, not delete
    const grants: Grant[] = [{ action: "create", subject: mockTable }];
    const { createAction, composeActions } = createActions({
      getContext: makeGetContext(grants),
    });

    const create = createAction((_db, _input: { title: string }, _ctx) => ({
      permissions: [{ action: "create" as const, table: mockTable }],
      run: async () => ({ id: "1" }),
    }));

    const remove = createAction((_db, _input: { id: string }, _ctx) => ({
      permissions: [{ action: "delete" as const, table: mockTable }],
      run: async () => null,
    }));

    const composed = composeActions({ create, remove });
    const wrappedLoader = composed.loader(async () => ({ items: [] }));

    const result = await wrappedLoader({
      request: new Request("https://test.example.com"),
      params: {},
    });

    expect(result._actionPermissions.create.permitted).toBe(true);
    expect(result._actionPermissions.remove.permitted).toBe(false);
    expect(result._actionPermissions.remove.reason).toContain("delete on posts");
  });
});

describe("checkPermissionStatus", () => {
  it("returns permitted when no descriptors required", () => {
    const result = checkPermissionStatus([], []);
    expect(result.permitted).toBe(true);
    expect(result.invisible).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("returns permitted when grants satisfy descriptors", () => {
    const grants: Grant[] = [{ action: "create", subject: mockTable }];
    const descriptors = [{ action: "create" as const, table: mockTable }];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(true);
  });

  it("returns not permitted when grants do not match", () => {
    const grants: Grant[] = [{ action: "read", subject: mockTable }];
    const descriptors = [{ action: "create" as const, table: mockTable }];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("create on posts");
  });

  it("permitted when grants have manage action", () => {
    const grants: Grant[] = [{ action: "manage", subject: mockTable }];
    const descriptors = [{ action: "delete" as const, table: mockTable }];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(true);
  });

  it("permitted when grants have 'all' subject", () => {
    const grants: Grant[] = [{ action: "create", subject: "all" }];
    const descriptors = [{ action: "create" as const, table: otherTable }];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(true);
  });

  it("invisible is true when ALL descriptors are denied", () => {
    const grants: Grant[] = [];
    const descriptors = [
      { action: "create" as const, table: mockTable },
      { action: "read" as const, table: mockTable },
    ];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.invisible).toBe(true);
  });

  it("invisible is false when SOME descriptors are permitted", () => {
    const grants: Grant[] = [{ action: "read", subject: mockTable }];
    const descriptors = [
      { action: "create" as const, table: mockTable },
      { action: "read" as const, table: mockTable },
    ];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(false);
    expect(result.invisible).toBe(false);
  });

  it("manage action with 'all' subject permits everything", () => {
    const grants: Grant[] = [{ action: "manage", subject: "all" }];
    const descriptors = [
      { action: "create" as const, table: mockTable },
      { action: "delete" as const, table: otherTable },
    ];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(true);
  });
});

describe("composeActions", () => {
  it("returns composed action, loader, client, and actions", () => {
    const { createAction, composeActions } = createActions({
      getContext: makeGetContext(),
    });

    const create = createAction((_db, _input: { title: string }, _ctx) => ({
      permissions: [{ action: "create" as const, table: mockTable }],
      run: async () => ({ id: "1" }),
    }));

    const remove = createAction((_db, _input: { id: string }, _ctx) => ({
      permissions: [{ action: "delete" as const, table: mockTable }],
      run: async () => null,
    }));

    const composed = composeActions({ create, remove });

    expect(typeof composed.action).toBe("function");
    expect(typeof composed.loader).toBe("function");
    expect(composed.client._brand).toBe("ActionClientDescriptor");
    expect(composed.client.actionNames).toEqual(["create", "remove"]);
    expect(composed.actions).toEqual({ create, remove });
  });
});
