import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ClientDescriptor, ActionPermissionsMap } from "../types.js";

// Mock state
let mockLoaderData: Record<string, unknown> = {};
const mockSubmit = vi.fn();
let mockFetcherState = "idle";
let mockFetcherData: unknown = undefined;

vi.mock("react-router", () => ({
  useLoaderData: () => mockLoaderData,
  useFetcher: () => ({
    state: mockFetcherState,
    data: mockFetcherData,
    submit: mockSubmit,
  }),
}));

// Import after mocks are set up
const { useActions } = await import("../client/use-actions.js");

function makeDescriptor(names: string[]): ClientDescriptor {
  return {
    _brand: "ActionClientDescriptor" as const,
    actionNames: names,
    permissionsKey: "_actionPermissions",
  };
}

describe("useActions", () => {
  beforeEach(() => {
    mockLoaderData = {};
    mockFetcherState = "idle";
    mockFetcherData = undefined;
    mockSubmit.mockClear();
  });

  it("returns an object keyed by action names from descriptor", () => {
    const descriptor = makeDescriptor(["create", "delete"]);
    const actions = useActions(descriptor);

    expect(Object.keys(actions)).toEqual(["create", "delete"]);
    expect(typeof actions.create).toBe("function");
    expect(typeof actions.delete).toBe("function");
  });

  it("each action returns a hook result with permitted, invisible, reason, submit, pending, data, error", () => {
    const descriptor = makeDescriptor(["publish"]);
    const actions = useActions(descriptor);
    const result = actions.publish();

    expect(result).toHaveProperty("permitted");
    expect(result).toHaveProperty("invisible");
    expect(result).toHaveProperty("reason");
    expect(result).toHaveProperty("submit");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("error");
    expect(typeof result.submit).toBe("function");
  });

  it("reads permissions from _actionPermissions in loader data", () => {
    const permissions: ActionPermissionsMap = {
      delete: { permitted: false, invisible: false, reason: "Not allowed" },
    };
    mockLoaderData = { _actionPermissions: permissions };

    const descriptor = makeDescriptor(["delete"]);
    const actions = useActions(descriptor);
    const result = actions.delete();

    expect(result.permitted).toBe(false);
    expect(result.invisible).toBe(false);
    expect(result.reason).toBe("Not allowed");
  });

  it("defaults to permitted: true when no permissions in loader data", () => {
    mockLoaderData = {};

    const descriptor = makeDescriptor(["create"]);
    const actions = useActions(descriptor);
    const result = actions.create();

    expect(result.permitted).toBe(true);
    expect(result.invisible).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("defaults to permitted: true for actions not listed in permissions", () => {
    mockLoaderData = {
      _actionPermissions: {
        delete: { permitted: false, invisible: true, reason: "No access" },
      },
    };

    const descriptor = makeDescriptor(["create", "delete"]);
    const actions = useActions(descriptor);

    expect(actions.create().permitted).toBe(true);
    expect(actions.delete().permitted).toBe(false);
    expect(actions.delete().invisible).toBe(true);
  });

  it("submit() calls fetcher.submit with formData containing _action and input fields", () => {
    const descriptor = makeDescriptor(["update"]);
    const actions = useActions(descriptor);
    const result = actions.update({ title: "Hello", count: 42 });

    result.submit();

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const [formData, options] = mockSubmit.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("_action")).toBe("update");
    expect(formData.get("title")).toBe("Hello");
    expect(formData.get("count")).toBe("42");
    expect(options).toEqual({ method: "POST" });
  });

  it("submit() without input only sets _action", () => {
    const descriptor = makeDescriptor(["reset"]);
    const actions = useActions(descriptor);
    const result = actions.reset();

    result.submit();

    const [formData] = mockSubmit.mock.calls[0];
    expect(formData.get("_action")).toBe("reset");
  });

  it("pending reflects fetcher state", () => {
    mockFetcherState = "submitting";

    const descriptor = makeDescriptor(["save"]);
    const actions = useActions(descriptor);
    const result = actions.save();

    expect(result.pending).toBe(true);
  });

  it("pending is false when fetcher is idle", () => {
    mockFetcherState = "idle";

    const descriptor = makeDescriptor(["save"]);
    const actions = useActions(descriptor);
    const result = actions.save();

    expect(result.pending).toBe(false);
  });

  it("data comes from fetcher data", () => {
    mockFetcherData = { success: true };

    const descriptor = makeDescriptor(["save"]);
    const actions = useActions(descriptor);
    const result = actions.save();

    expect(result.data).toEqual({ success: true });
  });

  it("skips null and undefined values in input", () => {
    const descriptor = makeDescriptor(["update"]);
    const actions = useActions(descriptor);
    const result = actions.update({ title: "Hello", extra: null });

    result.submit();

    const [formData] = mockSubmit.mock.calls[0];
    expect(formData.get("_action")).toBe("update");
    expect(formData.get("title")).toBe("Hello");
    expect(formData.has("extra")).toBe(false);
  });
});
