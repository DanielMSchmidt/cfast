import { describe, it, expect } from "vitest";
import { createActions, checkPermissionStatus } from "../create-actions.js";
import type { ActionContext, RequestArgs } from "../types.js";
import type { Db } from "@cfast/db";
import type { Grant } from "@cfast/permissions";

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

  it("manage action matches any action", () => {
    const grants: Grant[] = [{ action: "manage", subject: mockTable }];
    const descriptors = [{ action: "delete" as const, table: mockTable }];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(true);
  });

  it("'all' subject matches any table", () => {
    const grants: Grant[] = [{ action: "create", subject: "all" }];
    const descriptors = [{ action: "create" as const, table: otherTable }];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(true);
  });

  it("invisible is true when all descriptors are denied", () => {
    const grants: Grant[] = [];
    const descriptors = [
      { action: "create" as const, table: mockTable },
      { action: "read" as const, table: mockTable },
    ];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.invisible).toBe(true);
  });

  it("invisible is false when only some descriptors are denied", () => {
    const grants: Grant[] = [{ action: "read", subject: mockTable }];
    const descriptors = [
      { action: "create" as const, table: mockTable },
      { action: "read" as const, table: mockTable },
    ];

    const result = checkPermissionStatus(grants, descriptors);
    expect(result.permitted).toBe(false);
    expect(result.invisible).toBe(false);
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
