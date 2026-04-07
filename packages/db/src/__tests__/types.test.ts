import { describe, it, expectTypeOf } from "vitest";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createDb } from "../create-db";
import type { Operation, Db, DbConfig } from "../types";
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
