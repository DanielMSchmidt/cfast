import { describe, it, expect, vi } from "vitest";
import { parseInput, extractActionName } from "../parse-input.js";
import { createActions } from "../create-actions.js";
import type { ActionContext, RequestArgs } from "../types.js";
import type { Db } from "@cfast/db";
import type { Grant } from "@cfast/permissions";
import { createMockOperation, createFormDataRequest, createJsonRequest } from "./helpers.js";

function makeGetContext(grants: Grant[] = []) {
  return async (_args: RequestArgs) => ({
    db: {} as Db,
    user: { id: "user-1" },
    grants,
  });
}

describe("parseInput", () => {
  it("parses input from URL-encoded formData", async () => {
    const request = createFormDataRequest({ title: "Hello", slug: "hello" });
    const input = await parseInput(request);
    expect(input).toEqual({ title: "Hello", slug: "hello" });
  });

  it("parses input from JSON body", async () => {
    const request = createJsonRequest({ title: "Hello", slug: "hello" });
    const input = await parseInput(request);
    expect(input).toEqual({ title: "Hello", slug: "hello" });
  });

  it("strips _action field from formData input", async () => {
    const request = createFormDataRequest({ _action: "create", title: "Hello" });
    const input = await parseInput(request);
    expect(input).toEqual({ title: "Hello" });
    expect(input).not.toHaveProperty("_action");
  });

  it("strips _action field from JSON input", async () => {
    const request = createJsonRequest({ _action: "create", title: "Hello" });
    const input = await parseInput(request);
    expect(input).toEqual({ title: "Hello" });
    expect(input).not.toHaveProperty("_action");
  });

  it("handles JSON body with nested objects", async () => {
    const request = createJsonRequest({
      title: "Hello",
      metadata: { tags: ["a", "b"], draft: true },
    });
    const input = await parseInput(request);
    expect(input).toEqual({
      title: "Hello",
      metadata: { tags: ["a", "b"], draft: true },
    });
  });

  it("does not consume the original request body", async () => {
    const request = createFormDataRequest({ title: "test" });
    await parseInput(request);
    // Original request body should still be readable
    const formData = await request.formData();
    expect(formData.get("title")).toBe("test");
  });
});

describe("extractActionName", () => {
  it("extracts _action from formData", async () => {
    const request = createFormDataRequest({ _action: "create", title: "Hello" });
    const name = await extractActionName(request);
    expect(name).toBe("create");
  });

  it("extracts _action from JSON body", async () => {
    const request = createJsonRequest({ _action: "delete", id: "42" });
    const name = await extractActionName(request);
    expect(name).toBe("delete");
  });

  it("returns null when _action is missing from formData", async () => {
    const request = createFormDataRequest({ title: "Hello" });
    const name = await extractActionName(request);
    expect(name).toBeNull();
  });

  it("returns null when _action is missing from JSON", async () => {
    const request = createJsonRequest({ title: "Hello" });
    const name = await extractActionName(request);
    expect(name).toBeNull();
  });
});

describe("composed action dispatches from JSON", () => {
  function setupComposed() {
    const createFn = vi.fn(
      (_db: Db, _input: { title: string }, _ctx: ActionContext<{ id: string }>) =>
        createMockOperation({ id: "new-1" }),
    );
    const deleteFn = vi.fn(
      (_db: Db, _input: { id: string }, _ctx: ActionContext<{ id: string }>) =>
        createMockOperation(null),
    );

    const { createAction, composeActions } = createActions({
      getContext: makeGetContext(),
    });

    const create = createAction(createFn);
    const remove = createAction(deleteFn);
    const composed = composeActions({ create, remove });

    return { composed, createFn, deleteFn };
  }

  it("dispatches correctly from JSON body _action", async () => {
    const { composed, createFn, deleteFn } = setupComposed();

    const request = createJsonRequest({ _action: "create", title: "Hello" });
    await composed.action({ request, params: {} });

    expect(createFn).toHaveBeenCalledOnce();
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it("dispatches correctly from formData _action", async () => {
    const { composed, createFn, deleteFn } = setupComposed();

    const request = createFormDataRequest({ _action: "remove", id: "42" });
    await composed.action({ request, params: {} });

    expect(deleteFn).toHaveBeenCalledOnce();
    expect(createFn).not.toHaveBeenCalled();
  });

  it("single action parses JSON input correctly", async () => {
    const operationsFn = vi.fn(
      (_db: Db, _input: { title: string; tags: string[] }, _ctx: ActionContext<{ id: string }>) =>
        createMockOperation({ id: "new-1" }),
    );

    const { createAction } = createActions({ getContext: makeGetContext() });
    const def = createAction(operationsFn);

    const request = createJsonRequest({ title: "Hello", tags: ["a", "b"] });
    await def.action({ request, params: {} });

    expect(operationsFn).toHaveBeenCalledOnce();
    const receivedInput = operationsFn.mock.calls[0][1];
    expect(receivedInput).toEqual({ title: "Hello", tags: ["a", "b"] });
  });
});
