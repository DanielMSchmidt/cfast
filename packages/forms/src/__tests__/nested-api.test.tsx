import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createAutoForm, __resetChildrenDeprecationWarning } from "../auto-form";
import { createFormPlugin } from "../plugin";
import { v } from "../validate";
import type {
  FieldComponentProps,
  FormWrapperProps,
  SubmitButtonProps,
  InferAutoFormValues,
} from "../types";

// --- Test plugin -----------------------------------------------------------

function TestTextInput({ name, label, required, readOnly, error, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        {...register(name)}
        aria-required={required}
        readOnly={readOnly}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

function TestNumberInput({ name, label, readOnly, error, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type="number"
        {...register(name, { valueAsNumber: true })}
        readOnly={readOnly}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

function TestSelect({ name, label, enumValues, readOnly, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} {...register(name)} disabled={readOnly}>
        {enumValues?.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
    </div>
  );
}

function TestCheckbox({ name, label, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type="checkbox" {...register(name)} />
    </div>
  );
}

function TestFormWrapper({ onSubmit, children }: FormWrapperProps) {
  return <form onSubmit={onSubmit}>{children}</form>;
}

function TestSubmitButton({ children }: SubmitButtonProps) {
  return <button type="submit">{children}</button>;
}

const testPlugin = createFormPlugin({
  components: {
    textInput: TestTextInput,
    numberInput: TestNumberInput,
    select: TestSelect,
    checkbox: TestCheckbox,
    form: TestFormWrapper,
    submitButton: TestSubmitButton,
  },
});

const AutoForm = createAutoForm(testPlugin);

// --- Schema -----------------------------------------------------------

const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey(),
  title: v(text("title").notNull(), { minLength: 3 }),
  servings: integer("servings").notNull(),
});

const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  name: v(text("name").notNull(), { minLength: 1 }),
  amount: real("amount").notNull(),
  unit: text("unit", { enum: ["g", "ml", "cups"] }).notNull(),
});

// --- Tests -----------------------------------------------------------

describe("AutoForm — nested API (issues #145, #191)", () => {
  afterEach(() => {
    cleanup();
  });

  it("infers the values type from `table` + `nested` without manual generics", async () => {
    // This test doesn't assert at runtime — the whole point is that it compiles.
    // If the types break, `tsc --noEmit` will fail and so will this test file.
    const onSubmit = vi.fn();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 1,
          },
        ] as const}
        exclude={["id"]}
        onSubmit={(values) => {
          // Type-level assertions: these property accesses must compile
          // without casts. If the inference breaks, the test file stops
          // compiling.
          const title: string = values.title;
          const servings: number = values.servings;
          const firstIngredient = values.ingredients[0];
          if (firstIngredient) {
            const ingredientName: string = firstIngredient.name;
            const ingredientAmount: number = firstIngredient.amount;
            onSubmit({ title, servings, ingredientName, ingredientAmount });
          } else {
            onSubmit({ title, servings });
          }
        }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("renders nested rows under the table name by default", () => {
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 1,
          },
        ]}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    // Default key = "ingredients" (the Drizzle table name), humanised label.
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(fieldset).toBeInTheDocument();
    expect(within(fieldset).getByLabelText("Name")).toBeInTheDocument();
  });

  it("submits nested arrays under the inferred key", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 1,
          },
        ]}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Pancakes");
    await user.type(screen.getByLabelText("Servings"), "2");

    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.type(within(fieldset).getByLabelText("Name"), "Flour");
    await user.type(within(fieldset).getByLabelText("Amount"), "200");
    await user.selectOptions(within(fieldset).getByLabelText("Unit"), "g");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0]![0];
    expect(values.title).toBe("Pancakes");
    expect(values.servings).toBe(2);
    expect(values.ingredients).toEqual([
      { name: "Flour", amount: 200, unit: "g" },
    ]);
  });

  it("honours the `as` override for the nested form key", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            as: "items",
            min: 1,
          },
        ]}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    // The label is humanised from the form key, so it should now say "Items".
    const fieldset = screen.getByRole("group", { name: /items/i });
    expect(fieldset).toBeInTheDocument();

    await user.type(screen.getByLabelText("Title"), "Soup");
    await user.type(screen.getByLabelText("Servings"), "1");
    await user.type(within(fieldset).getByLabelText("Name"), "Salt");
    await user.type(within(fieldset).getByLabelText("Amount"), "5");
    await user.selectOptions(within(fieldset).getByLabelText("Unit"), "g");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0]![0];
    // The payload key tracks the `as` override, not the table name.
    expect(values.items).toHaveLength(1);
    expect(values).not.toHaveProperty("ingredients");
  });

  it("seeds `min` initial empty rows", () => {
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 3,
          },
        ]}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(3);
  });

  it("respects `max` by disabling the add button at the limit", async () => {
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 1,
            max: 2,
          },
        ]}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    const addButton = within(fieldset).getByRole("button", {
      name: /add ingredients row/i,
    });
    await user.click(addButton);
    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(2);
    expect(addButton).toBeDisabled();
  });

  it("blocks submission when `min` is violated", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 2,
          },
        ]}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Soup");
    await user.type(screen.getByLabelText("Servings"), "2");
    // The 2 seeded rows are empty → required violation blocks submit.
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports reordering via the reorder controls", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 2,
            reorderable: true,
          },
        ]}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Title"), "Test recipe");
    await user.type(screen.getByLabelText("Servings"), "4");

    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    const nameInputs = within(fieldset).getAllByLabelText("Name");
    const amountInputs = within(fieldset).getAllByLabelText("Amount");
    const unitSelects = within(fieldset).getAllByLabelText("Unit");

    await user.type(nameInputs[0]!, "Flour");
    await user.type(amountInputs[0]!, "100");
    await user.selectOptions(unitSelects[0]!, "g");

    await user.type(nameInputs[1]!, "Sugar");
    await user.type(amountInputs[1]!, "50");
    await user.selectOptions(unitSelects[1]!, "g");

    await user.click(
      within(fieldset).getByRole("button", { name: /move ingredients row 1 down/i }),
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0]![0];
    expect(submitted.ingredients).toHaveLength(2);
    expect(submitted.ingredients[0].name).toBe("Sugar");
    expect(submitted.ingredients[1].name).toBe("Flour");
  });

  it("removes a row and updates the submitted payload", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 1,
          },
        ]}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Shortlist");
    await user.type(screen.getByLabelText("Servings"), "1");

    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));
    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));

    const nameInputs = within(fieldset).getAllByLabelText("Name");
    const amountInputs = within(fieldset).getAllByLabelText("Amount");
    const unitSelects = within(fieldset).getAllByLabelText("Unit");

    await user.type(nameInputs[0]!, "Keep1");
    await user.type(amountInputs[0]!, "1");
    await user.selectOptions(unitSelects[0]!, "g");

    await user.type(nameInputs[1]!, "ToDrop");
    await user.type(amountInputs[1]!, "2");
    await user.selectOptions(unitSelects[1]!, "g");

    await user.type(nameInputs[2]!, "Keep2");
    await user.type(amountInputs[2]!, "3");
    await user.selectOptions(unitSelects[2]!, "g");

    const removeButtons = within(fieldset).getAllByRole("button", {
      name: /remove ingredients row/i,
    });
    await user.click(removeButtons[1]!);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0]![0];
    expect(submitted.ingredients).toHaveLength(2);
    expect(submitted.ingredients.map((i: { name: string }) => i.name)).toEqual([
      "Keep1",
      "Keep2",
    ]);
  });

  it("recomputes a computed field from nested data", async () => {
    const user = userEvent.setup();

    const recipesWithTotal = sqliteTable("recipes_computed", {
      id: integer("id").primaryKey(),
      title: text("title").notNull(),
      servings: integer("servings").notNull(),
      totalCalories: real("total_calories").notNull(),
    });

    const ingredientsWithCals = sqliteTable("ingredients_computed", {
      id: integer("id").primaryKey(),
      recipeId: integer("recipe_id").notNull(),
      name: text("name").notNull(),
      amount: real("amount").notNull(),
      calories: real("calories").notNull(),
    });

    render(
      <AutoForm
        table={recipesWithTotal}
        exclude={["id"]}
        nested={[
          {
            table: ingredientsWithCals,
            foreignKey: "recipeId",
            as: "ingredients",
            min: 1,
          },
        ]}
        fields={{
          totalCalories: {
            readOnly: true,
            computed: (values) => {
              const rows = (values.ingredients as Array<{
                amount: number;
                calories: number;
              }>) ?? [];
              return rows.reduce(
                (sum, row) =>
                  sum +
                  ((Number(row.calories) || 0) * (Number(row.amount) || 0)) /
                    100,
                0,
              );
            },
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.type(within(fieldset).getByLabelText("Name"), "Egg");
    await user.type(within(fieldset).getByLabelText("Amount"), "100");
    await user.type(within(fieldset).getByLabelText("Calories"), "155");

    await waitFor(() => {
      const total = screen.getByLabelText("Total Calories") as HTMLInputElement;
      expect(Number(total.value)).toBeCloseTo(155, 1);
    });
  });

  it("throws a helpful error on duplicate nested keys", () => {
    // Two nested entries with the same resolved key → explicit error.
    // Render is wrapped in a try/catch because React surfaces the error
    // via its error boundary path.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <AutoForm
          table={recipes}
          nested={[
            {
              table: ingredients,
              foreignKey: "recipeId",
            },
            {
              // Same table → same resolved key → collision.
              table: ingredients,
              foreignKey: "recipeId",
            },
          ]}
          exclude={["id"]}
          onSubmit={vi.fn()}
        />,
      ),
    ).toThrow(/duplicate nested key/i);
    consoleError.mockRestore();
  });

  it("defaults `mode` to 'create' when omitted", () => {
    render(
      <AutoForm
        table={recipes}
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
          },
        ]}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    // Empty field => create mode default.
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });
});

describe("AutoForm — deprecated `children` shim", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
    __resetChildrenDeprecationWarning();
  });

  afterEach(() => {
    cleanup();
  });

  it("still accepts the old `children` record shape and submits the same payload", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            // The deprecated API takes the TS column key, same as the new one.
            foreignKey: "recipeId",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Old API");
    await user.type(screen.getByLabelText("Servings"), "2");

    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.type(within(fieldset).getByLabelText("Name"), "Salt");
    await user.type(within(fieldset).getByLabelText("Amount"), "1");
    await user.selectOptions(within(fieldset).getByLabelText("Unit"), "g");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0]![0];
    expect(values.ingredients).toEqual([{ name: "Salt", amount: 1, unit: "g" }]);
  });

  it("logs a deprecation warning when `children` is used", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipeId",
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );

    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls[0]?.[0] as string;
    expect(message).toMatch(/children.*deprecated/i);
    expect(message).toMatch(/nested/i);
  });

  it("only logs the deprecation warning once across multiple renders", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: { table: ingredients, foreignKey: "recipeId" },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    cleanup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: { table: ingredients, foreignKey: "recipeId" },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );

    // Two renders, one warning.
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("accepts both `nested` and `children` simultaneously (no collision)", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    const tags = sqliteTable("tags", {
      id: integer("id").primaryKey(),
      recipeId: integer("recipe_id").notNull(),
      label: text("label").notNull(),
    });

    render(
      <AutoForm
        table={recipes}
        mode="create"
        nested={[
          {
            table: ingredients,
            foreignKey: "recipeId",
            min: 1,
          },
        ]}
        children={{
          tags: {
            table: tags,
            foreignKey: "recipeId",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Title"), "Mixed");
    await user.type(screen.getByLabelText("Servings"), "3");

    const ingredientsGroup = screen.getByRole("group", { name: /ingredients/i });
    await user.type(within(ingredientsGroup).getByLabelText("Name"), "Oil");
    await user.type(within(ingredientsGroup).getByLabelText("Amount"), "10");
    await user.selectOptions(within(ingredientsGroup).getByLabelText("Unit"), "ml");

    const tagsGroup = screen.getByRole("group", { name: /tags/i });
    await user.type(within(tagsGroup).getByLabelText("Label"), "quick");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0]![0];
    expect(values.ingredients).toHaveLength(1);
    expect(values.tags).toEqual([{ label: "quick" }]);
  });
});

// --- Type-level tests ------------------------------------------------------

// These `type` declarations only need to compile to pass. They exercise the
// inference pipeline without any runtime assertions. All names are
// underscore-prefixed to satisfy the project's `no-unused-vars` rule.

type _RecipesRow = {
  id: number;
  title: string;
  servings: number;
};

type _IngredientsRow = {
  id: number;
  recipeId: number;
  name: string;
  amount: number;
  unit: "g" | "ml" | "cups";
};

// Case 1: table only → parent row is inferred.
type _T1 = InferAutoFormValues<typeof recipes, undefined>;
const _t1: _T1 = {
  id: 1,
  title: "hello",
  servings: 2,
};

// Case 2: table + one nested entry (default key from table name).
type _Nested2 = readonly [
  { table: typeof ingredients; foreignKey: "recipeId" },
];
type _T2 = InferAutoFormValues<typeof recipes, _Nested2>;
const _t2: _T2 = {
  id: 1,
  title: "hello",
  servings: 2,
  ingredients: [
    { id: 1, recipeId: 1, name: "Flour", amount: 100, unit: "g" },
  ],
};

// Case 3: `as` override changes the form key.
type _Nested3 = readonly [
  { table: typeof ingredients; foreignKey: "recipeId"; as: "items" },
];
type _T3 = InferAutoFormValues<typeof recipes, _Nested3>;
const _t3: _T3 = {
  id: 1,
  title: "hello",
  servings: 2,
  items: [{ id: 1, recipeId: 1, name: "Salt", amount: 1, unit: "g" }],
};
