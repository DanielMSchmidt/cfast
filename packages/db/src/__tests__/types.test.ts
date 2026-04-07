import { describe, it, expectTypeOf } from "vitest";
import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createDb } from "../create-db";
import type { Operation, Db, DbConfig, InferRow } from "../types";
import { createMockD1 } from "./helpers";

describe("types", () => {
  it("Operation has permissions and run", () => {
    type TestOp = Operation<string[]>;
    expectTypeOf<TestOp["permissions"]>().toBeArray();
    expectTypeOf<TestOp["run"]>().toBeFunction();
  });

  it("Db has all required methods", () => {
    expectTypeOf<Db>().toHaveProperty("query");
    expectTypeOf<Db>().toHaveProperty("insert");
    expectTypeOf<Db>().toHaveProperty("update");
    expectTypeOf<Db>().toHaveProperty("delete");
    expectTypeOf<Db>().toHaveProperty("unsafe");
    expectTypeOf<Db>().toHaveProperty("batch");
    expectTypeOf<Db>().toHaveProperty("cache");
  });

  it("InferRow extracts the row shape from a Drizzle table", () => {
    const _products = sqliteTable("products", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      price: integer("price").notNull(),
    });

    type Row = InferRow<typeof _products>;
    expectTypeOf<Row>().toEqualTypeOf<{
      id: string;
      name: string;
      price: number;
    }>();
  });

  it("db.query(table).findMany() returns Operation<Row[]>", () => {
    const products = sqliteTable("products", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      price: integer("price").notNull(),
    });

    const db = createDb({
      d1: createMockD1(),
      schema: { products },
      grants: [],
      user: null,
      cache: false,
    });

    const op = db.query(products).findMany();
    expectTypeOf(op).toEqualTypeOf<
      Operation<{ id: string; name: string; price: number }[]>
    >();
  });

  it("db.query(table).findFirst() returns Operation<Row | undefined>", () => {
    const products = sqliteTable("products", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
    });

    const db = createDb({
      d1: createMockD1(),
      schema: { products },
      grants: [],
      user: null,
      cache: false,
    });

    const op = db.query(products).findFirst();
    expectTypeOf(op).toEqualTypeOf<
      Operation<{ id: string; name: string } | undefined>
    >();
  });

  it("db.insert(table).values().returning() returns Operation<Row>", () => {
    const products = sqliteTable("products", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
    });

    const db = createDb({
      d1: createMockD1(),
      schema: { products },
      grants: [],
      user: null,
      cache: false,
    });

    const op = db.insert(products).values({ id: "p1", name: "Hat" }).returning();
    expectTypeOf(op).toEqualTypeOf<Operation<{ id: string; name: string }>>();
  });

  it("DbConfig.schema accepts a wide record (no cast required)", () => {
    // Simulate `import * as schema from "./schema"` where the module
    // exports both tables and Drizzle `relations()` definitions.
    const cards = sqliteTable("cards", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });
    const cardRelations = relations(cards, ({ many: _many }) => ({}));

    const schema = { cards, cardRelations };

    // Should typecheck without `as Record<string, DrizzleTable>` cast.
    const config: DbConfig = {
      d1: createMockD1(),
      schema,
      grants: [],
      user: null,
      cache: false,
    };

    // And constructable through createDb without cast.
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: [],
      user: null,
      cache: false,
    });
    expectTypeOf(db).toHaveProperty("query");
    expectTypeOf(config).toHaveProperty("schema");
  });
});
