import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createAutoForm } from "../auto-form";
import { createFormPlugin } from "../plugin";
import type { FieldComponentProps, FormWrapperProps, SubmitButtonProps } from "../types";

// Minimal test plugin using native HTML elements
function TestTextInput({ name, label, required, error, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} {...register(name)} aria-required={required} />
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

function TestNumberInput({ name, label, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type="number" {...register(name, { valueAsNumber: true })} />
    </div>
  );
}

function TestSelect({ name, label, enumValues, register }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} {...register(name)}>
        {enumValues?.map((val) => (
          <option key={val} value={val}>{val}</option>
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

describe("AutoForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders fields from table schema", () => {
    const table = sqliteTable("af1", {
      title: text("title").notNull(),
      views: integer("views"),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Views")).toBeInTheDocument();
  });

  it("excludes specified fields", () => {
    const table = sqliteTable("af2", {
      name: text("name").notNull(),
      createdAt: text("created_at"),
    });

    render(
      <AutoForm
        table={table}
        mode="create"
        exclude={["createdAt"]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Created At")).not.toBeInTheDocument();
  });

  it("applies field overrides (label)", () => {
    const table = sqliteTable("af3", {
      title: text("title").notNull(),
    });

    render(
      <AutoForm
        table={table}
        mode="create"
        fields={{ title: { label: "Post Title" } }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Post Title")).toBeInTheDocument();
  });

  it("hides fields with hidden: true", () => {
    const table = sqliteTable("af4", {
      title: text("title").notNull(),
      authorId: text("author_id"),
    });

    render(
      <AutoForm
        table={table}
        mode="create"
        fields={{ authorId: { hidden: true } }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Author Id")).not.toBeInTheDocument();
  });

  it("renders select for enum columns", () => {
    const table = sqliteTable("af5", {
      status: text("status", { enum: ["draft", "published"] }).notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("pre-fills data in edit mode", () => {
    const table = sqliteTable("af6", {
      title: text("title").notNull(),
    });

    render(
      <AutoForm
        table={table}
        mode="edit"
        data={{ title: "Existing Title" }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Existing Title");
  });

  it("renders a submit button", () => {
    const table = sqliteTable("af7", {
      title: text("title").notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });
});
