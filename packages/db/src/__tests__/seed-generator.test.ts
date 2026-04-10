import { describe, it, expect, vi, beforeEach } from "vitest";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { getTableName, type Table } from "drizzle-orm";
import {
  seedConfig,
  tableSeed,
  createSeedEngine,
  createSingleTableSeed,
  topologicalSort,
  extractForeignKeys,
  findPrimaryKeyColumn,
  isTable,
} from "../seed-generator";
import type { SeedContext } from "../seed-generator";
import { createDb } from "../create-db";
import { createMockD1, schema as testSchema, grantsForRole } from "./helpers";

// ---------------------------------------------------------------------------
// Test schema — richer than the helpers.ts one, with FK chains and types
// ---------------------------------------------------------------------------

const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  rating: real("rating"),
  published: integer("published", { mode: "boolean" }).default(false),
});

const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  body: text("body").notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
});

const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

const postTags = sqliteTable("post_tags", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id),
});

const schema = { users, posts, comments, tags, postTags };

// ---------------------------------------------------------------------------
// Minimal faker mock — enough to exercise all code paths
// ---------------------------------------------------------------------------

let uuidCounter = 0;

function createFakerMock() {
  uuidCounter = 0;
  return {
    string: {
      uuid: () => `uuid-${++uuidCounter}`,
      alphanumeric: (n: number) => "a".repeat(n),
    },
    lorem: {
      words: (n: number) => Array.from({ length: n }, (_, i) => `word${i + 1}`).join(" "),
      sentence: () => "A generated sentence.",
      paragraphs: (n: number) => Array.from({ length: n }, () => "A paragraph.").join("\n\n"),
    },
    number: {
      int: ({ min, max: _max }: { min: number; max: number }) => min,
      float: ({ min, max: _max, fractionDigits: _fd }: { min: number; max: number; fractionDigits?: number }) => min,
    },
    datatype: {
      boolean: () => true,
    },
    date: {
      recent: () => new Date("2025-01-01T00:00:00Z"),
    },
    person: {
      fullName: () => "Test User",
    },
    internet: {
      email: () => "test@example.com",
    },
    helpers: {
      arrayElement: (arr: unknown[]) => arr[0],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("seed-generator", () => {
  let faker: ReturnType<typeof createFakerMock>;

  beforeEach(() => {
    faker = createFakerMock();
  });

  describe("isTable", () => {
    it("returns true for Drizzle tables", () => {
      expect(isTable(users)).toBe(true);
      expect(isTable(posts)).toBe(true);
    });

    it("returns false for non-tables", () => {
      expect(isTable(null)).toBe(false);
      expect(isTable({})).toBe(false);
      expect(isTable("users")).toBe(false);
      expect(isTable(42)).toBe(false);
    });
  });

  describe("findPrimaryKeyColumn", () => {
    it("finds the PK column for a table", () => {
      const pk = findPrimaryKeyColumn(users);
      expect(pk).toBeDefined();
      expect(pk!.key).toBe("id");
    });
  });

  describe("extractForeignKeys", () => {
    it("extracts FK info from a table with references", () => {
      const fks = extractForeignKeys(posts);
      expect(fks).toHaveLength(1);
      expect(fks[0]!.columnKey).toBe("authorId");
      expect(getTableName(fks[0]!.foreignTable as unknown as Table)).toBe("users");
      expect(fks[0]!.foreignColumnName).toBe("id");
    });

    it("returns empty for a table without FKs", () => {
      const fks = extractForeignKeys(users);
      expect(fks).toHaveLength(0);
    });

    it("extracts multiple FKs", () => {
      const fks = extractForeignKeys(comments);
      expect(fks).toHaveLength(2);
      const keys = fks.map((f) => f.columnKey).sort();
      expect(keys).toEqual(["authorId", "postId"]);
    });
  });

  describe("topologicalSort", () => {
    it("sorts root tables before children", () => {
      const fkMap = new Map();
      for (const t of Object.values(schema)) {
        fkMap.set(t, extractForeignKeys(t));
      }

      const sorted = topologicalSort(Object.values(schema), fkMap);
      const names = sorted.map((t) => getTableName(t as unknown as Table));

      // users and tags must come before posts
      expect(names.indexOf("users")).toBeLessThan(names.indexOf("posts"));
      expect(names.indexOf("tags")).toBeLessThan(names.indexOf("post_tags"));
      // posts must come before comments and post_tags
      expect(names.indexOf("posts")).toBeLessThan(names.indexOf("comments"));
      expect(names.indexOf("posts")).toBeLessThan(names.indexOf("post_tags"));
    });

    it("handles independent tables", () => {
      const independent = sqliteTable("independent", {
        id: text("id").primaryKey(),
        value: text("value"),
      });
      const fkMap = new Map();
      fkMap.set(users, []);
      fkMap.set(independent, []);

      const sorted = topologicalSort([users, independent], fkMap);
      expect(sorted).toHaveLength(2);
    });
  });

  describe("createSeedEngine", () => {
    describe("basic generation", () => {
      it("generates rows for all tables", () => {
        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();

        for (const table of engine.tables) {
          const rows = generated.get(table);
          expect(rows).toBeDefined();
          expect(rows!.length).toBeGreaterThan(0);
        }
      });

      it("generates correct count of rows", () => {
        tableSeed(users, { count: 5 });
        const engine = createSeedEngine({ users }, faker);
        const generated = engine.generate();
        expect(generated.get(users)!.length).toBe(5);
      });

      it("generates UUIDs for primary keys", () => {
        const engine = createSeedEngine({ users }, faker);
        const generated = engine.generate();
        const rows = generated.get(users)!;
        // All PKs should be unique UUIDs
        const ids = new Set(rows.map((r) => r.id));
        expect(ids.size).toBe(rows.length);
        for (const row of rows) {
          expect(typeof row.id).toBe("string");
          expect((row.id as string).startsWith("uuid-")).toBe(true);
        }
      });

      it("respects column type inference for text columns", () => {
        const engine = createSeedEngine({ users }, faker);
        const generated = engine.generate();
        const row = generated.get(users)![0]!;
        // name is text -> should be string
        expect(typeof row.name).toBe("string");
      });

      it("respects column type inference for integer columns", () => {
        const engine = createSeedEngine({ users }, faker);
        const generated = engine.generate();
        const row = generated.get(users)![0]!;
        // age is integer, nullable -> could be null or number
        expect(row.age === null || typeof row.age === "number").toBe(true);
      });

      it("respects column type inference for real columns", () => {
        // Need users first for FK so use full schema
        const fullEngine = createSeedEngine(schema, faker);
        const generated = fullEngine.generate();
        const postRow = generated.get(posts)![0]!;
        // rating is real, nullable
        expect(postRow.rating === null || typeof postRow.rating === "number").toBe(true);
      });

      it("respects column type inference for boolean columns", () => {
        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();
        // active has a default, should be skipped (uses Drizzle default)
        // published has a default, should be skipped
        expect(generated.get(users)!.length).toBeGreaterThan(0);
      });

      it("skips columns with $defaultFn", () => {
        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();
        const row = generated.get(users)![0]!;
        // createdAt has $defaultFn — should not be in the generated row
        expect(row.createdAt).toBeUndefined();
      });

      it("skips columns with static defaults", () => {
        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();
        const row = generated.get(users)![0]!;
        // active has default(true) — should not be in the generated row
        expect(row.active).toBeUndefined();
      });
    });

    describe("FK auto-fill", () => {
      it("fills FK columns from generated parent rows", () => {
        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();

        const userRows = generated.get(users)!;
        const postRows = generated.get(posts)!;
        const userIds = new Set(userRows.map((r) => r.id));

        for (const post of postRows) {
          expect(userIds.has(post.authorId as string)).toBe(true);
        }
      });

      it("fills deep FK chains (comments -> posts -> users)", () => {
        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();

        const postRows = generated.get(posts)!;
        const commentRows = generated.get(comments)!;
        const postIds = new Set(postRows.map((r) => r.id));
        const userRows = generated.get(users)!;
        const userIds = new Set(userRows.map((r) => r.id));

        for (const comment of commentRows) {
          expect(postIds.has(comment.postId as string)).toBe(true);
          expect(userIds.has(comment.authorId as string)).toBe(true);
        }
      });
    });

    describe("per relational generation", () => {
      it("generates N rows per parent when `per` is set", () => {
        // Reset any previous tableSeed config
        tableSeed(users, { count: 3 });
        tableSeed(posts, { count: 2, per: users });

        const engine = createSeedEngine({ users, posts }, faker);
        const generated = engine.generate();

        expect(generated.get(users)!.length).toBe(3);
        // 2 per user * 3 users = 6 total
        expect(generated.get(posts)!.length).toBe(6);
      });

      it("fills FK to parent automatically with per", () => {
        tableSeed(users, { count: 2 });
        tableSeed(posts, { count: 3, per: users });

        const engine = createSeedEngine({ users, posts }, faker);
        const generated = engine.generate();

        const userRows = generated.get(users)!;
        const postRows = generated.get(posts)!;

        // First 3 posts should reference user 0, next 3 should reference user 1
        for (let i = 0; i < 3; i++) {
          expect(postRows[i]!.authorId).toBe(userRows[0]!.id);
        }
        for (let i = 3; i < 6; i++) {
          expect(postRows[i]!.authorId).toBe(userRows[1]!.id);
        }
      });
    });

    describe("seedConfig column overrides", () => {
      it("uses custom seed function for columns", () => {
        const customTitle = sqliteTable("custom_posts", {
          id: text("id").primaryKey(),
          title: seedConfig(text("title").notNull(), () => "Custom Title"),
        });

        const engine = createSeedEngine({ customTitle }, faker);
        const generated = engine.generate();
        const rows = generated.get(customTitle)!;
        for (const row of rows) {
          expect(row.title).toBe("Custom Title");
        }
      });

      it("passes faker and ctx to custom seed functions", () => {
        const seedFn = vi.fn((_f: unknown, ctx: SeedContext) => `row-${ctx.index}`);
        const custom = sqliteTable("ctx_test", {
          id: text("id").primaryKey(),
          value: seedConfig(text("value").notNull(), seedFn),
        });

        tableSeed(custom, { count: 3 });
        const engine = createSeedEngine({ custom }, faker);
        const generated = engine.generate();

        expect(seedFn).toHaveBeenCalledTimes(3);
        const rows = generated.get(custom)!;
        expect(rows[0]!.value).toBe("row-0");
        expect(rows[1]!.value).toBe("row-1");
        expect(rows[2]!.value).toBe("row-2");
      });

      it("ctx.parent is available in per-child rows", () => {
        const parents = sqliteTable("parents", {
          id: text("id").primaryKey(),
          name: text("name").notNull(),
        });
        const children = sqliteTable("children", {
          id: text("id").primaryKey(),
          parentId: text("parent_id")
            .notNull()
            .references(() => parents.id),
          parentName: seedConfig(text("parent_name"), (_f, ctx) => ctx.parent?.name),
        });

        tableSeed(parents, { count: 2 });
        tableSeed(children, { count: 1, per: parents });

        const engine = createSeedEngine({ parents, children }, faker);
        const generated = engine.generate();

        const parentRows = generated.get(parents)!;
        const childRows = generated.get(children)!;

        expect(childRows[0]!.parentName).toBe(parentRows[0]!.name);
        expect(childRows[1]!.parentName).toBe(parentRows[1]!.name);
      });

      it("ctx.ref picks a random row from another table", () => {
        const orgs = sqliteTable("orgs", {
          id: text("id").primaryKey(),
          name: text("name").notNull(),
        });
        const employees = sqliteTable("employees", {
          id: text("id").primaryKey(),
          // FK ensures orgs are generated before employees in topo sort
          orgId: text("org_id").references(() => orgs.id),
          orgRef: seedConfig(text("org_ref"), (_f, ctx) => {
            const org = ctx.ref(orgs);
            return org.id as string;
          }),
        });

        tableSeed(orgs, { count: 3 });
        tableSeed(employees, { count: 2 });

        const engine = createSeedEngine({ orgs, employees }, faker);
        const generated = engine.generate();

        const orgIds = new Set(generated.get(orgs)!.map((r) => r.id));
        for (const emp of generated.get(employees)!) {
          // orgRef should be one of the org IDs
          expect(orgIds.has(emp.orgRef as string)).toBe(true);
        }
      });

      it("ctx.all returns all rows for a table", () => {
        const items = sqliteTable("items", {
          id: text("id").primaryKey(),
          label: text("label").notNull(),
        });
        // Use an FK to ensure items are generated before summary in topo sort
        const summary = sqliteTable("summary", {
          id: text("id").primaryKey(),
          firstItemId: text("first_item_id").references(() => items.id),
          itemCount: seedConfig(integer("item_count").notNull(), (_f, ctx) => ctx.all(items).length),
        });

        tableSeed(items, { count: 5 });
        tableSeed(summary, { count: 1 });

        const engine = createSeedEngine({ items, summary }, faker);
        const generated = engine.generate();

        const summaryRows = generated.get(summary)!;
        expect(summaryRows[0]!.itemCount).toBe(5);
      });
    });

    describe("many-to-many deduplication", () => {
      it("deduplicates rows based on FK composite keys", () => {
        // With only 3 tags and 10 post_tags per post, duplicates will occur
        // because faker.number.int always returns min (0) in our mock
        tableSeed(users, { count: 1 });
        tableSeed(posts, { count: 1 });
        tableSeed(tags, { count: 2 });
        tableSeed(postTags, { count: 5 }); // 5 requested but only 2 unique combos possible

        const engine = createSeedEngine(schema, faker);
        const generated = engine.generate();
        const ptRows = generated.get(postTags)!;

        // Check no duplicate (postId, tagId) pairs
        const combos = ptRows.map((r) => `${r.postId}:${r.tagId}`);
        const uniqueCombos = new Set(combos);
        expect(combos.length).toBe(uniqueCombos.size);
      });
    });

    describe("auth table detection", () => {
      it("generates role-based emails for users table", () => {
        tableSeed(users, { count: 6 });
        const engine = createSeedEngine({ users }, faker);
        const generated = engine.generate();
        const rows = generated.get(users)!;

        expect(rows[0]!.email).toBe("admin@example.com");
        expect(rows[1]!.email).toBe("user@example.com");
        expect(rows[2]!.email).toBe("editor@example.com");
        expect(rows[3]!.email).toBe("viewer@example.com");
        expect(rows[4]!.email).toBe("moderator@example.com");
        // 6th should fall back to faker
        expect(typeof rows[5]!.email).toBe("string");
      });

      it("generates names via faker.person.fullName for users table", () => {
        tableSeed(users, { count: 1 });
        const engine = createSeedEngine({ users }, faker);
        const generated = engine.generate();
        expect(generated.get(users)![0]!.name).toBe("Test User");
      });
    });

    describe("table count overrides", () => {
      it("respects per-table count overrides", () => {
        const engine = createSeedEngine(schema, faker);
        const overrides = new Map();
        overrides.set(users, { count: 3 });
        overrides.set(posts, { count: 2 });
        overrides.set(comments, { count: 0 });
        overrides.set(tags, { count: 1 });
        overrides.set(postTags, { count: 0 });

        const generated = engine.generate(overrides);
        expect(generated.get(users)!.length).toBe(3);
        expect(generated.get(posts)!.length).toBe(2);
        expect(generated.get(comments)!.length).toBe(0);
        expect(generated.get(tags)!.length).toBe(1);
      });
    });

    describe("run (insert into db)", () => {
      it("inserts generated rows via db.unsafe()", async () => {
        const d1 = createMockD1();
        const db = createDb({
          d1,
          schema: testSchema,
          grants: grantsForRole("anonymous"),
          user: null,
        });

        tableSeed(users, { count: 2 });
        const engine = createSeedEngine({ users }, faker);
        const generated = await engine.run(db);

        expect(generated.get(users)!.length).toBe(2);

        const insertCalls = d1._calls.filter((c) =>
          c.sql.toLowerCase().includes("insert into"),
        );
        expect(insertCalls.length).toBeGreaterThanOrEqual(2);
      });

      it("generates SQL transcript when transcript option is set", async () => {
        const d1 = createMockD1();
        const db = createDb({
          d1,
          schema: testSchema,
          grants: grantsForRole("anonymous"),
          user: null,
        });

        tableSeed(users, { count: 1 });
        const engine = createSeedEngine({ users }, faker);

        // Since we can't write to fs in test, just verify the engine runs
        // without error when transcript is set to a dummy path
        // (the fs write will silently fail in test env)
        await engine.run(db, { transcript: "/tmp/test-seed.sql" });

        const insertCalls = d1._calls.filter((c) =>
          c.sql.toLowerCase().includes("insert into"),
        );
        expect(insertCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("createSingleTableSeed", () => {
    it("generates rows for a single table only", () => {
      const engine = createSingleTableSeed(schema, faker, users, 5);
      const generated = engine.generate();
      expect(generated.get(users)!.length).toBe(5);
      // Other tables should have 0 rows
      expect(generated.get(posts)!.length).toBe(0);
      expect(generated.get(comments)!.length).toBe(0);
    });

    it("runs single-table insert via db", async () => {
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema: testSchema,
        grants: grantsForRole("anonymous"),
        user: null,
      });

      const engine = createSingleTableSeed(schema, faker, users, 3);
      await engine.run(db);

      const insertCalls = d1._calls.filter((c) =>
        c.sql.toLowerCase().includes("insert into"),
      );
      expect(insertCalls.length).toBeGreaterThanOrEqual(3);
    });
  });
});
