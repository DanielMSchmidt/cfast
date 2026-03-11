import { describe, it, expect } from "vitest";
import { grant } from "../grant";

const posts = { _: { name: "posts" } } as any;
const _comments = { _: { name: "comments" } } as any;

describe("grant", () => {
  it("creates a grant with action and subject", () => {
    const g = grant("read", posts);
    expect(g.action).toBe("read");
    expect(g.subject).toBe(posts);
    expect(g.where).toBeUndefined();
  });

  it("creates a grant with a where clause", () => {
    const whereFn = (row: any) => row.published;
    const g = grant("read", posts, { where: whereFn });
    expect(g.action).toBe("read");
    expect(g.subject).toBe(posts);
    expect(g.where).toBe(whereFn);
  });

  it("creates a grant with 'all' subject", () => {
    const g = grant("manage", "all");
    expect(g.action).toBe("manage");
    expect(g.subject).toBe("all");
  });

  it("accepts all CRUD actions", () => {
    expect(grant("read", posts).action).toBe("read");
    expect(grant("create", posts).action).toBe("create");
    expect(grant("update", posts).action).toBe("update");
    expect(grant("delete", posts).action).toBe("delete");
    expect(grant("manage", posts).action).toBe("manage");
  });
});
