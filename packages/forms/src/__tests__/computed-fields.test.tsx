import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createAutoForm } from "../auto-form";
import { createFormPlugin } from "../plugin";
import type {
  FieldComponentProps,
  FormWrapperProps,
  SubmitButtonProps,
} from "../types";

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

function TestNumberInput({ name, label, readOnly, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type="number"
        {...register(name, { valueAsNumber: true })}
        readOnly={readOnly}
      />
    </div>
  );
}

function TestSelect({ name, label, enumValues, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} {...register(name)}>
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

const items = sqliteTable("items", {
  id: integer("id").primaryKey(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  // Stored as a regular column so the form can populate it via `computed`.
  total: real("total").notNull(),
});

describe("AutoForm — computed fields (issue #103)", () => {
  afterEach(() => {
    cleanup();
  });

  it("recomputes the value when a dependency changes", async () => {
    const user = userEvent.setup();
    render(
      <AutoForm
        table={items}
        mode="create"
        exclude={["id"]}
        fields={{
          total: {
            readOnly: true,
            computed: (values) => {
              const price = Number(values.unitPrice) || 0;
              const qty = Number(values.quantity) || 0;
              return price * qty;
            },
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    const priceInput = screen.getByLabelText("Unit Price");
    const qtyInput = screen.getByLabelText("Quantity");
    const totalInput = screen.getByLabelText("Total") as HTMLInputElement;

    await user.type(priceInput, "10");
    await user.type(qtyInput, "3");

    await waitFor(() => {
      expect(totalInput.value).toBe("30");
    });
  });

  it("renders computed fields as read-only", () => {
    render(
      <AutoForm
        table={items}
        mode="create"
        exclude={["id"]}
        fields={{
          total: {
            readOnly: true,
            computed: () => 0,
          },
        }}
        onSubmit={vi.fn()}
      />,
    );
    const totalInput = screen.getByLabelText("Total") as HTMLInputElement;
    expect(totalInput).toHaveAttribute("readonly");
  });

  it("includes the computed value in the submitted payload", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={items}
        mode="create"
        exclude={["id"]}
        fields={{
          total: {
            readOnly: true,
            computed: (values) => {
              const price = Number(values.unitPrice) || 0;
              const qty = Number(values.quantity) || 0;
              return price * qty;
            },
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Unit Price"), "5");
    await user.type(screen.getByLabelText("Quantity"), "4");

    await waitFor(() => {
      expect((screen.getByLabelText("Total") as HTMLInputElement).value).toBe("20");
    });

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = onSubmit.mock.calls[0]![0];
    expect(submitted.unitPrice).toBe(5);
    expect(submitted.quantity).toBe(4);
    expect(submitted.total).toBe(20);
  });

  it("skips required-field validation for computed fields", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={items}
        mode="create"
        exclude={["id"]}
        fields={{
          total: {
            readOnly: true,
            // Always returns undefined → would normally trip the NOT NULL rule.
            computed: () => undefined,
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Unit Price"), "1");
    await user.type(screen.getByLabelText("Quantity"), "1");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("does not crash when the compute function throws", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={items}
        mode="create"
        exclude={["id"]}
        fields={{
          total: {
            readOnly: true,
            computed: (values) => {
              if (values.unitPrice === undefined) throw new Error("boom");
              return Number(values.unitPrice) * Number(values.quantity);
            },
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Unit Price"), "2");
    await user.type(screen.getByLabelText("Quantity"), "5");

    await waitFor(() => {
      expect((screen.getByLabelText("Total") as HTMLInputElement).value).toBe("10");
    });
  });
});

// --- Integration: recipe + ingredients + computed totals ---------------

const recipes = sqliteTable("recipes_int", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  servings: integer("servings").notNull(),
  totalCalories: real("total_calories").notNull(),
  totalProtein: real("total_protein").notNull(),
});

const ingredients = sqliteTable("ingredients_int", {
  id: integer("id").primaryKey(),
  recipe_id: integer("recipe_id").notNull(),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  unit: text("unit", { enum: ["g", "ml"] }).notNull(),
});

describe("AutoForm — recipe + ingredients + computed macros (integration)", () => {
  afterEach(() => {
    cleanup();
  });

  it("recomputes total macros from child rows and submits the full payload", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <AutoForm
        table={recipes}
        mode="create"
        exclude={["id"]}
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
            reorderable: true,
            fields: {
              calories: { label: "Calories (per 100)" },
              protein: { label: "Protein (per 100)" },
            },
          },
        }}
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
                  sum + ((Number(row.calories) || 0) * (Number(row.amount) || 0)) / 100,
                0,
              );
            },
          },
          totalProtein: {
            readOnly: true,
            computed: (values) => {
              const rows = (values.ingredients as Array<{
                amount: number;
                protein: number;
              }>) ?? [];
              return rows.reduce(
                (sum, row) =>
                  sum + ((Number(row.protein) || 0) * (Number(row.amount) || 0)) / 100,
                0,
              );
            },
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    // Fill parent
    await user.type(screen.getByLabelText("Title"), "Egg breakfast");
    await user.type(screen.getByLabelText("Servings"), "1");

    // Add second ingredient row
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));

    const nameInputs = within(fieldset).getAllByLabelText("Name");
    const amountInputs = within(fieldset).getAllByLabelText("Amount");
    const caloriesInputs = within(fieldset).getAllByLabelText("Calories (per 100)");
    const proteinInputs = within(fieldset).getAllByLabelText("Protein (per 100)");
    const unitSelects = within(fieldset).getAllByLabelText("Unit");

    expect(nameInputs).toHaveLength(2);

    // Egg: 100g, 155 cal/100g, 13g protein/100g → 155 cal, 13g protein
    await user.type(nameInputs[0]!, "Egg");
    await user.type(amountInputs[0]!, "100");
    await user.type(caloriesInputs[0]!, "155");
    await user.type(proteinInputs[0]!, "13");
    await user.selectOptions(unitSelects[0]!, "g");

    // Bacon: 50g, 540 cal/100g, 37g protein/100g → 270 cal, 18.5g protein
    await user.type(nameInputs[1]!, "Bacon");
    await user.type(amountInputs[1]!, "50");
    await user.type(caloriesInputs[1]!, "540");
    await user.type(proteinInputs[1]!, "37");
    await user.selectOptions(unitSelects[1]!, "g");

    await waitFor(() => {
      const total = screen.getByLabelText("Total Calories") as HTMLInputElement;
      expect(Number(total.value)).toBeCloseTo(425, 1);
    });

    const totalProtein = screen.getByLabelText("Total Protein") as HTMLInputElement;
    expect(Number(totalProtein.value)).toBeCloseTo(31.5, 1);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0]![0];
    expect(submitted.title).toBe("Egg breakfast");
    expect(submitted.servings).toBe(1);
    expect(submitted.ingredients).toHaveLength(2);
    expect(submitted.ingredients[0]).toMatchObject({
      name: "Egg",
      amount: 100,
      calories: 155,
      protein: 13,
      unit: "g",
    });
    expect(submitted.ingredients[1]).toMatchObject({
      name: "Bacon",
      amount: 50,
      calories: 540,
      protein: 37,
      unit: "g",
    });
    expect(submitted.totalCalories).toBeCloseTo(425, 1);
    expect(submitted.totalProtein).toBeCloseTo(31.5, 1);
  });

  it("recomputes totals after a child row is removed", async () => {
    const user = userEvent.setup();

    render(
      <AutoForm
        table={recipes}
        mode="create"
        exclude={["id"]}
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
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
                  sum + ((Number(row.calories) || 0) * (Number(row.amount) || 0)) / 100,
                0,
              );
            },
          },
          totalProtein: {
            readOnly: true,
            computed: () => 0,
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Title"), "Two ingredients");
    await user.type(screen.getByLabelText("Servings"), "1");

    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));

    const amountInputs = within(fieldset).getAllByLabelText("Amount");
    const caloriesInputs = within(fieldset).getAllByLabelText("Calories");

    await user.type(amountInputs[0]!, "100");
    await user.type(caloriesInputs[0]!, "100"); // 100 cal contribution

    await user.type(amountInputs[1]!, "100");
    await user.type(caloriesInputs[1]!, "200"); // 200 cal contribution

    await waitFor(() => {
      const total = screen.getByLabelText("Total Calories") as HTMLInputElement;
      expect(Number(total.value)).toBeCloseTo(300, 1);
    });

    // Remove the second row
    const removeButtons = within(fieldset).getAllByRole("button", {
      name: /remove ingredients row/i,
    });
    await user.click(removeButtons[1]!);

    await waitFor(() => {
      const total = screen.getByLabelText("Total Calories") as HTMLInputElement;
      expect(Number(total.value)).toBeCloseTo(100, 1);
    });
  });
});
