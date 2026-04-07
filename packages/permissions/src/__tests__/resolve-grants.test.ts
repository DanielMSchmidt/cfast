import { describe, it, expect, vi } from "vitest";
import { definePermissions } from "../define-permissions";
import { grant } from "../grant";
import { resolveGrants } from "../resolve-grants";
import type { DrizzleSQL, DrizzleTable, WhereClause } from "../types";

const posts: DrizzleTable = { _: { name: "posts" } };
const comments: DrizzleTable = { _: { name: "comments" } };

const fakeSql = (tag: string): DrizzleSQL => ({ getSQL: () => tag });

describe("resolveGrants", () => {
  const perms = definePermissions({
    roles: ["anonymous", "author", "editor", "admin"] as const,
    hierarchy: {
      author: ["anonymous"],
      editor: ["author"],
      admin: ["editor"],
    },
    grants: {
      anonymous: [grant("read", posts)],
      author: [grant("create", posts)],
      editor: [grant("update", posts)],
      admin: [grant("manage", "all")],
    },
  });

  it("returns grants for a single role", () => {
    const result = resolveGrants(perms, ["anonymous"]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("read");
    expect(result[0].subject).toBe(posts);
  });

  it("merges grants from multiple roles (no overlap)", () => {
    // anonymous has read:posts, author has read:posts + create:posts (via hierarchy)
    // But let's use two roles that have non-overlapping grants
    const p = definePermissions({
      roles: ["reader", "writer"] as const,
      grants: {
        reader: [grant("read", posts)],
        writer: [grant("create", comments)],
      },
    });

    const result = resolveGrants(p, ["reader", "writer"]);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "read", subject: posts }),
        expect.objectContaining({ action: "create", subject: comments }),
      ]),
    );
  });

  it("deduplicates same action+subject without where clauses", () => {
    const p = definePermissions({
      roles: ["a", "b"] as const,
      grants: {
        a: [grant("read", posts)],
        b: [grant("read", posts)],
      },
    });

    const result = resolveGrants(p, ["a", "b"]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("read");
    expect(result[0].subject).toBe(posts);
    expect(result[0].where).toBeUndefined();
  });

  it("unrestricted grant overrides restricted grant (no where wins)", () => {
    const where1 = vi.fn(() => fakeSql("where1"));
    const p = definePermissions({
      roles: ["restricted", "unrestricted"] as const,
      grants: {
        restricted: [grant("read", posts, { where: where1 })],
        unrestricted: [grant("read", posts)],
      },
    });

    const result = resolveGrants(p, ["restricted", "unrestricted"]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("read");
    expect(result[0].where).toBeUndefined();
  });

  it("OR-merges where clauses when all grants are restricted", () => {
    const where1: WhereClause = vi.fn((_cols: Record<string, unknown>, _user: unknown) => fakeSql("w1"));
    const where2: WhereClause = vi.fn((_cols: Record<string, unknown>, _user: unknown) => fakeSql("w2"));

    const p = definePermissions({
      roles: ["a", "b"] as const,
      grants: {
        a: [grant("read", posts, { where: where1 })],
        b: [grant("read", posts, { where: where2 })],
      },
    });

    const result = resolveGrants(p, ["a", "b"]);
    expect(result).toHaveLength(1);
    expect(result[0].where).toBeDefined();

    // Call the merged where and verify both originals are called
    const cols = { id: "col" };
    const user = { id: "user1" };
    const lookups = {};
    result[0].where!(cols, user, lookups);

    expect(where1).toHaveBeenCalledWith(cols, user, lookups);
    expect(where2).toHaveBeenCalledWith(cols, user, lookups);
  });

  it("returns empty array for empty roles list", () => {
    const result = resolveGrants(perms, []);
    expect(result).toEqual([]);
  });

  it("returns empty array for unknown roles", () => {
    const result = resolveGrants(perms, ["nonexistent"]);
    expect(result).toEqual([]);
  });

  it("handles mix of known and unknown roles", () => {
    const result = resolveGrants(perms, ["anonymous", "nonexistent"]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("read");
  });

  it("uses resolvedGrants (hierarchy already expanded)", () => {
    // editor's resolvedGrants should include inherited grants from author and anonymous
    const result = resolveGrants(perms, ["editor"]);
    expect(result).toHaveLength(3); // read + create + update
  });

  it("keeps grants with different action+subject pairs independent", () => {
    const p = definePermissions({
      roles: ["a", "b"] as const,
      grants: {
        a: [grant("read", posts), grant("create", comments)],
        b: [grant("update", posts), grant("delete", comments)],
      },
    });

    const result = resolveGrants(p, ["a", "b"]);
    expect(result).toHaveLength(4);
  });

  it("handles manage:all grants", () => {
    const result = resolveGrants(perms, ["admin"]);
    // admin's resolvedGrants: read:posts, create:posts, update:posts, manage:all
    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "manage", subject: "all" }),
      ]),
    );
  });

  it("deduplicates manage:all from multiple roles", () => {
    const p = definePermissions({
      roles: ["superadmin", "admin"] as const,
      grants: {
        superadmin: [grant("manage", "all")],
        admin: [grant("manage", "all")],
      },
    });

    const result = resolveGrants(p, ["superadmin", "admin"]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("manage");
    expect(result[0].subject).toBe("all");
  });

  it("groups by subject reference equality for tables", () => {
    // Two different table objects with the same name should NOT be merged
    const posts2: DrizzleTable = { _: { name: "posts" } };

    const p = definePermissions({
      roles: ["a", "b"] as const,
      grants: {
        a: [grant("read", posts)],
        b: [grant("read", posts2)],
      },
    });

    const result = resolveGrants(p, ["a", "b"]);
    // Different object references = not merged
    expect(result).toHaveLength(2);
  });

  it("OR-merges where clauses from three roles", () => {
    const where1 = vi.fn(() => fakeSql("w1"));
    const where2 = vi.fn(() => fakeSql("w2"));
    const where3 = vi.fn(() => fakeSql("w3"));

    const p = definePermissions({
      roles: ["a", "b", "c"] as const,
      grants: {
        a: [grant("read", posts, { where: where1 })],
        b: [grant("read", posts, { where: where2 })],
        c: [grant("read", posts, { where: where3 })],
      },
    });

    const result = resolveGrants(p, ["a", "b", "c"]);
    expect(result).toHaveLength(1);
    expect(result[0].where).toBeDefined();

    const cols = {};
    const user = {};
    result[0].where!(cols, user, {});

    expect(where1).toHaveBeenCalledOnce();
    expect(where2).toHaveBeenCalledOnce();
    expect(where3).toHaveBeenCalledOnce();
  });

  describe("user-object signature (issue #89)", () => {
    it("accepts a user object with a roles array", () => {
      const user = {
        id: "u1",
        email: "u1@example.com",
        roles: ["author"],
      };
      const result = resolveGrants(perms, user);
      // author inherits anonymous, so 2 grants total
      expect(result).toHaveLength(2);
    });

    it("returns the same grants whether called with user or roles array", () => {
      const user = { id: "u1", roles: ["editor"] };
      const fromUser = resolveGrants(perms, user);
      const fromArray = resolveGrants(perms, ["editor"]);
      expect(fromUser).toHaveLength(fromArray.length);
      // Compare by action+subject pairs (where clauses are functions, can't deep-equal)
      const userKeys = fromUser.map((g) => `${g.action}:${String(g.subject)}`).sort();
      const arrayKeys = fromArray.map((g) => `${g.action}:${String(g.subject)}`).sort();
      expect(userKeys).toEqual(arrayKeys);
    });

    it("handles user with empty roles array", () => {
      const user = { id: "u1", roles: [] };
      const result = resolveGrants(perms, user);
      expect(result).toEqual([]);
    });

    it("handles user with multiple roles", () => {
      const user = { id: "u1", roles: ["anonymous", "author"] };
      const result = resolveGrants(perms, user);
      // Both anonymous and author have read:posts (via hierarchy), plus author has create:posts
      // After dedup, expect read:posts and create:posts
      expect(result).toHaveLength(2);
    });

    it("treats arrays as the legacy roles signature, not as a user object", () => {
      // A bare array should still be the roles form even though arrays are objects
      const result = resolveGrants(perms, ["anonymous"]);
      expect(result).toHaveLength(1);
    });
  });

  describe("string subject support", () => {
    it("merges string-keyed string subjects across roles", () => {
      const p = definePermissions({
        roles: ["a", "b"] as const,
        grants: {
          a: [grant("read", "posts")],
          b: [grant("read", "posts")],
        },
      });
      const result = resolveGrants(p, { roles: ["a", "b"] });
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe("posts");
    });

    it("does NOT merge string and object subjects with the same name (preserves identity)", () => {
      const p = definePermissions({
        roles: ["a", "b"] as const,
        grants: {
          a: [grant("read", posts)],   // object subject
          b: [grant("read", "posts")], // string subject
        },
      });
      const result = resolveGrants(p, { roles: ["a", "b"] });
      // They live under different group keys, so two grants
      expect(result).toHaveLength(2);
    });
  });

  describe("with-lookup grants (issue #105)", () => {
    const noopWith = { friendIds: () => Promise.resolve([] as string[]) };

    it("preserves the with map on a single grant", () => {
      const where = vi.fn(() => fakeSql("w"));
      const p = definePermissions({
        roles: ["member"] as const,
        grants: {
          member: [grant("read", posts, { with: noopWith, where })],
        },
      });
      const result = resolveGrants(p, ["member"]);
      expect(result).toHaveLength(1);
      expect(result[0].with).toBe(noopWith);
      expect(result[0].where).toBe(where);
    });

    it("emits with-grants as standalone entries instead of OR-merging", () => {
      const where1 = vi.fn(() => fakeSql("w1"));
      const where2 = vi.fn(() => fakeSql("w2"));
      const p = definePermissions({
        roles: ["a", "b"] as const,
        grants: {
          a: [grant("read", posts, { with: noopWith, where: where1 })],
          b: [grant("read", posts, { with: noopWith, where: where2 })],
        },
      });
      const result = resolveGrants(p, ["a", "b"]);
      // Each with-grant stays separate so each can resolve its own lookups.
      expect(result).toHaveLength(2);
      expect(result.every((g) => g.with === noopWith)).toBe(true);
    });

    it("keeps a with-grant alongside a sibling plain grant for the same action+subject", () => {
      const whereWith = vi.fn(() => fakeSql("with"));
      const wherePlain = vi.fn(() => fakeSql("plain"));
      const p = definePermissions({
        roles: ["a", "b"] as const,
        grants: {
          a: [grant("read", posts, { with: noopWith, where: whereWith })],
          b: [grant("read", posts, { where: wherePlain })],
        },
      });
      const result = resolveGrants(p, ["a", "b"]);
      // With-grant is one entry, plain grant is another
      expect(result).toHaveLength(2);
      const withGrant = result.find((g) => g.with !== undefined);
      const plainGrant = result.find((g) => g.with === undefined);
      expect(withGrant).toBeDefined();
      expect(plainGrant).toBeDefined();
      expect(withGrant!.where).toBe(whereWith);
      expect(plainGrant!.where).toBe(wherePlain);
    });

    it("an unrestricted sibling collapses both plain and with-grants for the group", () => {
      const whereWith = vi.fn(() => fakeSql("with"));
      const p = definePermissions({
        roles: ["a", "b"] as const,
        grants: {
          a: [grant("read", posts, { with: noopWith, where: whereWith })],
          b: [grant("read", posts)], // unrestricted
        },
      });
      const result = resolveGrants(p, ["a", "b"]);
      // Unrestricted wins; the with-grant is dropped to avoid wasted lookups.
      expect(result).toHaveLength(1);
      expect(result[0].where).toBeUndefined();
      expect(result[0].with).toBeUndefined();
    });

    it("preserves with maps across hierarchy resolution", () => {
      const where = vi.fn(() => fakeSql("w"));
      const p = definePermissions({
        roles: ["base", "premium"] as const,
        hierarchy: { premium: ["base"] },
        grants: {
          base: [grant("read", posts, { with: noopWith, where })],
          premium: [grant("create", posts)],
        },
      });
      const result = resolveGrants(p, ["premium"]);
      // premium inherits the read+with grant from base
      const readGrant = result.find((g) => g.action === "read");
      expect(readGrant).toBeDefined();
      expect(readGrant!.with).toBe(noopWith);
    });
  });
});
