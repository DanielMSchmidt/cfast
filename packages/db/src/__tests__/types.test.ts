import { describe, it, expectTypeOf } from "vitest";
import type { Operation, Db } from "../types";

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
});
