import { describe, it, expect } from "vitest";
import { grant } from "../grant";
import { getGrantedActions } from "../granted-actions";
import type { Grant } from "../types";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { eq, sql } from "drizzle-orm";

const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authorId: text("author_id").notNull(),
  published: integer("published", { mode: "boolean" }).default(false),
});

const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  body: text("body").notNull(),
  authorId: text("author_id").notNull(),
});

describe("getGrantedActions", () => {
  it("returns empty array when no grants match the table", () => {
    const grants: Grant[] = [grant("read", comments)];
    const result = getGrantedActions(grants, posts);
    expect(result).toEqual([]);
  });

  it("returns matching actions with unrestricted flag for grants without where", () => {
    const grants: Grant[] = [
      grant("read", posts),
      grant("create", posts),
    ];
    const result = getGrantedActions(grants, posts);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(
      expect.objectContaining({ action: "read", unrestricted: true }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({ action: "create", unrestricted: true }),
    );
  });

  it("marks restricted when all grants have where clauses", () => {
    const grants: Grant[] = [
      grant("update", posts, {
        where: (cols: any, user: any) => eq(cols.authorId, user.id),
      }),
    ];
    const result = getGrantedActions(grants, posts);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      action: "update",
      unrestricted: false,
    });
    expect(result[0].grants).toHaveLength(1);
  });

  it("marks unrestricted when any grant lacks a where clause", () => {
    const grants: Grant[] = [
      grant("read", posts, {
        where: (cols: any) => sql`${cols.published} = 1`,
      }),
      grant("read", posts),
    ];
    const result = getGrantedActions(grants, posts);
    const readAction = result.find((a) => a.action === "read");
    expect(readAction).toBeDefined();
    expect(readAction!.unrestricted).toBe(true);
  });

  it("expands manage into all four CRUD actions", () => {
    const grants: Grant[] = [grant("manage", "all")];
    const result = getGrantedActions(grants, posts);
    expect(result).toHaveLength(4);
    const actions = result.map((a) => a.action).sort();
    expect(actions).toEqual(["create", "delete", "read", "update"]);
    for (const a of result) {
      expect(a.unrestricted).toBe(true);
    }
  });

  it("handles string subject grants", () => {
    const grants: Grant[] = [grant("read", "posts")];
    const result = getGrantedActions(grants, posts);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ action: "read", unrestricted: true });
  });

  it("handles all subject grants", () => {
    const grants: Grant[] = [grant("read", "all")];
    const result = getGrantedActions(grants, posts);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ action: "read", unrestricted: true });
  });

  it("includes multiple restricted grants for the same action", () => {
    const grants: Grant[] = [
      grant("read", posts, {
        where: (cols: any) => sql`${cols.published} = 1`,
      }),
      grant("read", posts, {
        where: (cols: any, user: any) => eq(cols.authorId, user.id),
      }),
    ];
    const result = getGrantedActions(grants, posts);
    expect(result).toHaveLength(1);
    expect(result[0].grants).toHaveLength(2);
    expect(result[0].unrestricted).toBe(false);
  });
});
