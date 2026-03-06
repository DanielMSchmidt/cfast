import { describe, it, expect } from "vitest";
import { ForbiddenError } from "../errors";

const posts = { _: { name: "posts" } } as any;

describe("ForbiddenError", () => {
  it("is an instance of Error", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it("has a descriptive message", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
    });
    expect(err.message).toBe("Role 'user' cannot delete on 'posts'");
  });

  it("exposes action, table, and role properties", () => {
    const err = new ForbiddenError({
      action: "update",
      table: posts,
      role: "editor",
    });
    expect(err.action).toBe("update");
    expect(err.table).toBe(posts);
    expect(err.role).toBe("editor");
  });

  it("optionally carries descriptors", () => {
    const descriptors = [
      { action: "update" as const, table: posts },
      { action: "create" as const, table: posts },
    ];
    const err = new ForbiddenError({
      action: "update",
      table: posts,
      role: "user",
      descriptors,
    });
    expect(err.descriptors).toEqual(descriptors);
  });

  it("defaults descriptors to empty array", () => {
    const err = new ForbiddenError({
      action: "read",
      table: posts,
      role: "anonymous",
    });
    expect(err.descriptors).toEqual([]);
  });

  it("has a name of ForbiddenError", () => {
    const err = new ForbiddenError({
      action: "read",
      table: posts,
      role: "anonymous",
    });
    expect(err.name).toBe("ForbiddenError");
  });

  it("is JSON-serializable", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
    });
    const json = JSON.parse(JSON.stringify(err.toJSON()));
    expect(json.action).toBe("delete");
    expect(json.table).toBe("posts");
    expect(json.role).toBe("user");
    expect(json.message).toBe("Role 'user' cannot delete on 'posts'");
  });
});
