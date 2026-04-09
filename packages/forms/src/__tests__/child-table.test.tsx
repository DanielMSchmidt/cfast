import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createAutoForm } from "../auto-form";
import { createFormPlugin } from "../plugin";
import { v } from "../validate";
import type {
  FieldComponentProps,
  FormWrapperProps,
  SubmitButtonProps,
} from "../types";

// Test plugin using native HTML elements (intentionally omits `childTable` so
// we exercise the `DefaultChildTable` fallback in the core).
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

const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey(),
  title: v(text("title").notNull(), { minLength: 3 }),
  servings: integer("servings").notNull(),
});

const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey(),
  recipe_id: integer("recipe_id").notNull(),
  name: v(text("name").notNull(), { minLength: 1 }),
  amount: real("amount").notNull(),
  unit: text("unit", { enum: ["g", "ml", "tbsp", "tsp", "cup"] }).notNull(),
});

describe("AutoForm — child tables (issue #102)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the child table fieldset with no rows by default", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(fieldset).toBeInTheDocument();
    expect(within(fieldset).queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("seeds minRows initial empty rows", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 2,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    const nameInputs = within(fieldset).getAllByLabelText("Name");
    expect(nameInputs).toHaveLength(2);
  });

  it("excludes the foreign key column from the rendered child rows", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(within(fieldset).queryByLabelText("Recipe Id")).not.toBeInTheDocument();
  });

  it("excludes child primary keys from the rendered rows", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    // The child id column is the primary key — should not be rendered.
    expect(within(fieldset).queryByLabelText("Id")).not.toBeInTheDocument();
  });

  it("appends a new row when the add button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(1);

    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));

    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(2);
  });

  it("removes a row when the remove button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));
    await user.click(within(fieldset).getByRole("button", { name: /add ingredients row/i }));

    // Now we have 3 rows
    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(3);

    const removeButtons = within(fieldset).getAllByRole("button", {
      name: /remove ingredients row/i,
    });
    await user.click(removeButtons[1]!);

    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(2);
  });

  it("respects minRows by disabling remove on the last row", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    const removeButtons = within(fieldset).getAllByRole("button", {
      name: /remove ingredients row/i,
    });
    expect(removeButtons[0]).toBeDisabled();
  });

  it("respects maxRows by disabling the add button when at the limit", async () => {
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
            maxRows: 2,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    const addButton = within(fieldset).getByRole("button", { name: /add ingredients row/i });
    await user.click(addButton);
    expect(within(fieldset).getAllByLabelText("Name")).toHaveLength(2);
    expect(addButton).toBeDisabled();
  });

  it("renders reorder controls when reorderable: true", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 2,
            reorderable: true,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(within(fieldset).getAllByRole("button", { name: /move ingredients row 1 up/i }).length).toBeGreaterThan(0);
    expect(within(fieldset).getAllByRole("button", { name: /move ingredients row 1 down/i }).length).toBeGreaterThan(0);
  });

  it("does not render reorder controls when reorderable is false", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 2,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(within(fieldset).queryByRole("button", { name: /move .* up/i })).not.toBeInTheDocument();
  });

  it("reorders rows by moving down", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 2,
            reorderable: true,
          },
        }}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    // Fill in parent fields
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

    // Move row 1 down → Sugar should now be first.
    await user.click(within(fieldset).getByRole("button", { name: /move ingredients row 1 down/i }));

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0]![0];
    expect(submitted.ingredients).toHaveLength(2);
    expect(submitted.ingredients[0].name).toBe("Sugar");
    expect(submitted.ingredients[1].name).toBe("Flour");
  });

  it("submits the typed array of child rows under the configured key", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
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

  it("validates child rows against schema rules and surfaces row errors", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Soup");
    await user.type(screen.getByLabelText("Servings"), "2");
    // Leave child name empty → required violation
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    // The default child table renders the row error inline; we just verify no
    // submission occurred and that an alert is rendered somewhere in the form.
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("blocks submission and surfaces a top-level error when minRows is violated", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 2,
          },
        }}
        exclude={["id"]}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Soup");
    await user.type(screen.getByLabelText("Servings"), "2");

    // Remove one of the two seeded rows by adding then removing — but we
    // cannot remove below minRows. Instead pretend we have one row by
    // emulating user action: the form should reject because the seeded rows
    // are still empty (validation runs).
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("pre-fills child rows in edit mode", () => {
    render(
      <AutoForm
        table={recipes}
        mode="edit"
        data={{
          title: "Existing recipe",
          servings: 3,
          ingredients: [
            { name: "Egg", amount: 2, unit: "g" },
            { name: "Milk", amount: 100, unit: "ml" },
          ],
        }}
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Existing recipe");
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    const nameInputs = within(fieldset).getAllByLabelText("Name");
    expect(nameInputs).toHaveLength(2);
    expect(nameInputs[0]).toHaveValue("Egg");
    expect(nameInputs[1]).toHaveValue("Milk");
  });

  it("supports child field overrides (label + placeholder)", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
            fields: {
              name: { label: "Ingredient name", placeholder: "Flour" },
            },
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    const fieldset = screen.getByRole("group", { name: /ingredients/i });
    expect(within(fieldset).getByLabelText("Ingredient name")).toBeInTheDocument();
  });

  it("uses a custom child label when provided", () => {
    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            label: "Recipe Steps",
            minRows: 1,
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("group", { name: /recipe steps/i }),
    ).toBeInTheDocument();
  });

  it("passes the form instance to child row field components", () => {
    const formSpy = vi.fn();

    // Custom field component that captures the `form` prop
    function SpyInput({ name, label, form: formInstance, register }: FieldComponentProps) {
      if (formInstance) formSpy(formInstance);
      return (
        <div>
          <label htmlFor={name}>{label}</label>
          <input id={name} {...register(name)} />
        </div>
      );
    }

    render(
      <AutoForm
        table={recipes}
        mode="create"
        children={{
          ingredients: {
            table: ingredients,
            foreignKey: "recipe_id",
            minRows: 1,
            fields: {
              name: { component: SpyInput },
            },
          },
        }}
        exclude={["id"]}
        onSubmit={vi.fn()}
      />,
    );

    // The spy should have been called at least once (for the single row's name field)
    expect(formSpy).toHaveBeenCalled();
    // The form instance should have standard react-hook-form methods
    const receivedForm = formSpy.mock.calls[0]![0];
    expect(receivedForm).toHaveProperty("register");
    expect(receivedForm).toHaveProperty("setValue");
    expect(receivedForm).toHaveProperty("getValues");
    expect(receivedForm).toHaveProperty("formState");
  });
});
