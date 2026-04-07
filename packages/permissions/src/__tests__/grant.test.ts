import { describe, it, expect } from "vitest";
import { grant } from "../grant";
import type { DrizzleTable, WhereClause } from "../types";

const posts: DrizzleTable = { _: { name: "posts" } };
const _comments: DrizzleTable = { _: { name: "comments" } };

describe("grant", () => {
  it("creates a grant with action and subject", () => {
    const g = grant("read", posts);
    expect(g.action).toBe("read");
    expect(g.subject).toBe(posts);
    expect(g.where).toBeUndefined();
  });

  it("creates a grant with a where clause", () => {
    const whereFn: WhereClause = (_columns, _user) => ({ getSQL: () => ({ }) });
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

  it("accepts a string subject (table name)", () => {
    const g = grant("read", "projects");
    expect(g.action).toBe("read");
    expect(g.subject).toBe("projects");
    expect(g.where).toBeUndefined();
  });

  it("accepts a string subject with a where clause", () => {
    const whereFn: WhereClause = (_columns, _user) => ({ getSQL: () => ({}) });
    const g = grant("update", "projects", { where: whereFn });
    expect(g.action).toBe("update");
    expect(g.subject).toBe("projects");
    expect(g.where).toBe(whereFn);
  });
});
