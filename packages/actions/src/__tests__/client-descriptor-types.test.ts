import { describe, it, expect, vi } from "vitest";
import type { ClientDescriptor } from "../types.js";

// Mock react-router to avoid requiring a real React context
vi.mock("react-router", () => ({
  useLoaderData: () => ({}),
  useFetcher: () => ({
    state: "idle",
    data: undefined,
    submit: vi.fn(),
  }),
}));

const { clientDescriptor, useActions } = await import("../client/use-actions.js");

describe("clientDescriptor type safety", () => {
  it("preserves literal action names with as const", () => {
    const client = clientDescriptor(["create", "delete"] as const);

    // Runtime check: the action names are preserved
    expect(client.actionNames).toEqual(["create", "delete"]);
    expect(client._brand).toBe("ActionClientDescriptor");

    // Type-level check: TNames is readonly ["create", "delete"]
    // This would fail to compile if the type parameter were lost
    const _check: ClientDescriptor<readonly ["create", "delete"]> = client;
    expect(_check).toBe(client);
  });

  it("infers literal types without explicit as const (const type parameter)", () => {
    // The `const` modifier on the type parameter means callers don't need
    // to write `as const` — the array literal is already inferred as a tuple.
    const client = clientDescriptor(["edit", "remove"]);

    expect(client.actionNames).toEqual(["edit", "remove"]);
    const _check: ClientDescriptor<readonly ["edit", "remove"]> = client;
    expect(_check).toBe(client);
  });

  it("useActions returns object keyed by exact action names", () => {
    const client = clientDescriptor(["create", "delete"] as const);
    const actions = useActions(client);

    // Runtime: both keys exist
    expect(typeof actions.create).toBe("function");
    expect(typeof actions.delete).toBe("function");

    // Type-level: accessing a valid action works
    const createHook = actions.create();
    expect(createHook).toHaveProperty("permitted");
    expect(createHook).toHaveProperty("submit");

    const deleteHook = actions.delete();
    expect(deleteHook).toHaveProperty("permitted");
  });

  it("remains backward-compatible with plain string arrays", () => {
    const names: string[] = ["a", "b"];
    // Should compile without error even with a non-literal array
    const client = clientDescriptor(names);

    expect(client.actionNames).toEqual(["a", "b"]);
  });
});
