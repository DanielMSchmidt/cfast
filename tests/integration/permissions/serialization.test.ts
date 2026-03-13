import { describe, it, expect } from "vitest";
import { ForbiddenError } from "@cfast/permissions";
import { posts } from "../helpers/schema";

describe("serialization", () => {
  it("ForbiddenError.toJSON() serializes correctly", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "viewer",
    });

    const json = err.toJSON();

    expect(json).toEqual({
      name: "ForbiddenError",
      message: expect.stringContaining("viewer"),
      action: "delete",
      table: "posts",
      role: "viewer",
    });

    // Verify it's JSON-serializable (round-trips through JSON.stringify)
    const parsed = JSON.parse(JSON.stringify(json));
    expect(parsed.name).toBe("ForbiddenError");
    expect(parsed.action).toBe("delete");
    expect(parsed.table).toBe("posts");
    expect(parsed.role).toBe("viewer");
  });

  it("ForbiddenError has correct properties", () => {
    const err = new ForbiddenError({
      action: "update",
      table: posts,
      role: "editor",
      descriptors: [
        { action: "update", table: posts },
      ],
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.name).toBe("ForbiddenError");
    expect(err.action).toBe("update");
    expect(err.table).toBe(posts);
    expect(err.role).toBe("editor");
    expect(err.descriptors).toHaveLength(1);
    expect(err.descriptors[0].action).toBe("update");
    expect(err.message).toContain("editor");
    expect(err.message).toContain("update");
    expect(err.message).toContain("posts");
  });
});
