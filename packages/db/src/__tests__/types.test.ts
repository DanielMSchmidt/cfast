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

  it("findMany<TRow>() honors the explicit row generic for `with` relations (#158)", () => {
    // Regression for #158: Drizzle's relational `with` includes embed
    // joined rows into the result, but `@cfast/db` cannot infer that shape
    // from the runtime-typed schema. The escape hatch lets callers claim
    // the wider shape via an explicit generic instead of `as any`.
    const recipes = sqliteTable("recipes", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });

    const db = createDb({
      d1: createMockD1(),
      schema: { recipes },
      grants: [],
      user: null,
      cache: false,
    });

    type Ingredient = { id: string; name: string };
    type RecipeWithIngredients = {
      id: string;
      title: string;
      ingredients: Ingredient[];
    };

    const op = db
      .query(recipes)
      .findMany<{ with: { ingredients: true } }, RecipeWithIngredients>({
        with: { ingredients: true },
      });
    expectTypeOf(op).toEqualTypeOf<Operation<RecipeWithIngredients[]>>();

    // Default (no generic) still infers from the table.
    const plain = db.query(recipes).findMany();
    expectTypeOf(plain).toEqualTypeOf<
      Operation<{ id: string; title: string }[]>
    >();
  });

  it("findFirst<TRow>() honors the explicit row generic for `with` relations (#158)", () => {
    const recipes = sqliteTable("recipes", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });

    const db = createDb({
      d1: createMockD1(),
      schema: { recipes },
      grants: [],
      user: null,
      cache: false,
    });

    type RecipeWithIngredients = {
      id: string;
      title: string;
      ingredients: { id: string }[];
    };

    const op = db
      .query(recipes)
      .findFirst<{ with: { ingredients: true } }, RecipeWithIngredients>({
        with: { ingredients: true },
      });
    expectTypeOf(op).toEqualTypeOf<
      Operation<RecipeWithIngredients | undefined>
    >();
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

  it("auto-infers .with() relation result types from typed schema (#240)", () => {
    const recipes = sqliteTable("recipes", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });
    const ingredients = sqliteTable("ingredients", {
      id: text("id").primaryKey(),
      recipeId: text("recipe_id").notNull(),
      name: text("name").notNull(),
    });
    const recipesRelations = relations(recipes, ({ many }) => ({
      ingredients: many(ingredients),
    }));
    const ingredientsRelations = relations(ingredients, ({ one }) => ({
      recipe: one(recipes, {
        fields: [ingredients.recipeId],
        references: [recipes.id],
      }),
    }));
    const schema = { recipes, ingredients, recipesRelations, ingredientsRelations };

    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: [],
      user: null,
      cache: false,
    });

    // findMany with `with` -- relation type auto-inferred
    const _op = db.query(recipes).findMany({ with: { ingredients: true } });
    type Result = Awaited<ReturnType<typeof _op.run>>;
    expectTypeOf<Result[0]["id"]>().toBeString();
    expectTypeOf<Result[0]["title"]>().toBeString();
    expectTypeOf<Result[0]["ingredients"]>().toBeArray();

    // findFirst with `with` -- relation type auto-inferred
    const _firstOp = db.query(recipes).findFirst({ with: { ingredients: true } });
    type FirstResult = NonNullable<Awaited<ReturnType<typeof _firstOp.run>>>;
    expectTypeOf<FirstResult["ingredients"]>().toBeArray();

    // Nested with -- ingredients -> recipe (One relation)
    const _nestedOp = db.query(ingredients).findFirst({ with: { recipe: true } });
    type NestedResult = NonNullable<Awaited<ReturnType<typeof _nestedOp.run>>>;
    expectTypeOf<NestedResult["name"]>().toBeString();
    expectTypeOf<NestedResult["recipe"]>().toMatchTypeOf<{ id: string; title: string }>();

    // Without `with` -- plain row type
    const _plainOp = db.query(recipes).findMany();
    type PlainResult = Awaited<ReturnType<typeof _plainOp.run>>;
    expectTypeOf<PlainResult[0]>().toEqualTypeOf<{ id: string; title: string }>();
  });

  it("Db<TSchema> propagates through unsafe()", () => {
    const posts = sqliteTable("posts_typed", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
    });
    const comments = sqliteTable("comments_typed", {
      id: text("id").primaryKey(),
      postId: text("post_id").notNull(),
      body: text("body").notNull(),
    });
    const postsRelations = relations(posts, ({ many }) => ({
      comments: many(comments),
    }));
    const commentsRelations = relations(comments, ({ one }) => ({
      post: one(posts, { fields: [comments.postId], references: [posts.id] }),
    }));
    const schema = { posts, comments, postsRelations, commentsRelations };
    const db = createDb({ d1: createMockD1(), schema, grants: [], user: null, cache: false });

    const _unsafeOp = db.unsafe().query(posts).findMany({ with: { comments: true } });
    type UnsafeResult = Awaited<ReturnType<typeof _unsafeOp.run>>;
    expectTypeOf<UnsafeResult[0]["comments"]>().toBeArray();
  });
});
