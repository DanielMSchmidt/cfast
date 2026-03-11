# @cfast/forms Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the headless core of @cfast/forms with schema introspection, validation derivation, react-hook-form integration, plugin API, and a Joy UI plugin.

**Architecture:** Column validation metadata is stored on the Drizzle builder's `config` object via a Symbol, which survives into the Column instance. `introspectTable()` reads column metadata and `$validate` rules, produces `FieldDefinition[]`. `AutoForm` wires these into react-hook-form and delegates rendering to a plugin's components.

**Tech Stack:** TypeScript, React 19, Drizzle ORM (SQLite), react-hook-form, MUI Joy UI, vitest, tsup

---

### Task 1: Project setup — add dependencies

**Files:**
- Modify: `packages/forms/package.json`

**Step 1: Add peer and dev dependencies**

Update `packages/forms/package.json`:

```json
{
  "name": "@cfast/forms",
  "version": "0.0.1",
  "description": "Auto-generated forms from Drizzle schema with progressive customization",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./joy": {
      "import": "./dist/joy.js",
      "types": "./dist/joy.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/joy.ts --format esm --dts",
    "dev": "tsup src/index.ts src/joy.ts --format esm --dts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
    "drizzle-orm": ">=0.35",
    "react-hook-form": ">=7",
    "@mui/joy": ">=5.0.0-beta.0"
  },
  "peerDependenciesMeta": {
    "@mui/joy": {
      "optional": true
    }
  },
  "devDependencies": {
    "@testing-library/react": "^16",
    "@testing-library/jest-dom": "^6",
    "drizzle-orm": "^0.44",
    "react": "^19",
    "react-dom": "^19",
    "react-hook-form": "^7",
    "@mui/joy": "^5.0.0-beta.48",
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "jsdom": "^26",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

**Step 2: Install dependencies**

Run: `cd packages/forms && pnpm install`

**Step 3: Verify build works**

Run: `pnpm build`
Expected: Successful build producing `dist/index.js` and `dist/joy.js`

**Step 4: Commit**

```bash
git add packages/forms/package.json pnpm-lock.yaml
git commit -m "chore(forms): add dependencies for core implementation"
```

---

### Task 2: Types and validation metadata — `$validate()` and `ValidationRules`

**Files:**
- Create: `packages/forms/src/types.ts`
- Create: `packages/forms/src/validate.ts`
- Test: `packages/forms/src/__tests__/validate.test.ts`

**Step 1: Write the failing test**

Create `packages/forms/src/__tests__/validate.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { getValidationRules, VALIDATE_SYMBOL } from "../validate";

describe("$validate", () => {
  it("stores and retrieves validation rules on a text column", () => {
    const table = sqliteTable("posts", {
      title: text("title").notNull().$validate({ minLength: 3, maxLength: 200 }),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toEqual({ minLength: 3, maxLength: 200 });
  });

  it("stores and retrieves validation rules on an integer column", () => {
    const table = sqliteTable("posts", {
      views: integer("views").$validate({ min: 0, max: 10000 }),
    });
    const rules = getValidationRules(table.views);
    expect(rules).toEqual({ min: 0, max: 10000 });
  });

  it("returns undefined for columns without $validate", () => {
    const table = sqliteTable("posts", {
      title: text("title").notNull(),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toBeUndefined();
  });

  it("supports pattern validation", () => {
    const table = sqliteTable("posts", {
      slug: text("slug").$validate({ pattern: /^[a-z0-9-]+$/ }),
    });
    const rules = getValidationRules(table.slug);
    expect(rules).toEqual({ pattern: /^[a-z0-9-]+$/ });
  });

  it("supports custom error message", () => {
    const table = sqliteTable("posts", {
      title: text("title").$validate({ minLength: 3, message: "Too short" }),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toEqual({ minLength: 3, message: "Too short" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/forms && pnpm test`
Expected: FAIL — modules don't exist yet

**Step 3: Create types**

Create `packages/forms/src/types.ts`:

```typescript
export type ValidationRules = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
};

export type InputType = "text" | "number" | "checkbox" | "select";

export type FieldDefinition = {
  name: string;
  inputType: InputType;
  label: string;
  required: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  enumValues?: string[];
  validation: ValidationRules;
};

export type FieldConfig = {
  label?: string;
  placeholder?: string;
  hidden?: boolean;
  default?: unknown;
  component?: React.ComponentType<FieldComponentProps>;
  validate?: (value: unknown) => string | undefined;
};

export type FieldComponentProps = {
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  error?: string;
  enumValues?: string[];
  register: unknown;
};

export type FormPluginComponents = {
  textInput: React.ComponentType<FieldComponentProps>;
  numberInput: React.ComponentType<FieldComponentProps>;
  select: React.ComponentType<FieldComponentProps>;
  checkbox: React.ComponentType<FieldComponentProps>;
  form: React.ComponentType<FormWrapperProps>;
  submitButton: React.ComponentType<SubmitButtonProps>;
};

export type FormWrapperProps = {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
};

export type SubmitButtonProps = {
  isSubmitting: boolean;
  children: React.ReactNode;
};

export type FormPlugin = {
  components: FormPluginComponents;
};
```

**Step 4: Create validate module**

Create `packages/forms/src/validate.ts`:

```typescript
import type { Column } from "drizzle-orm";
import { ColumnBuilder } from "drizzle-orm/column-builder";
import type { ValidationRules } from "./types";

export const VALIDATE_SYMBOL = Symbol.for("cfast:validate");

// Augment ColumnBuilder prototype with $validate
ColumnBuilder.prototype.$validate = function (rules: ValidationRules) {
  (this.config as Record<symbol, unknown>)[VALIDATE_SYMBOL] = rules;
  return this;
};

// TypeScript declaration merge so $validate is available on all column builders
declare module "drizzle-orm/column-builder" {
  interface ColumnBuilder {
    $validate(rules: ValidationRules): this;
  }
}

/**
 * Read validation rules from a built Column instance.
 * The rules were stored on the builder's config object (via Symbol),
 * which is passed through to the Column constructor.
 */
export function getValidationRules(column: Column): ValidationRules | undefined {
  return (column as unknown as { config: Record<symbol, unknown> }).config[
    VALIDATE_SYMBOL
  ] as ValidationRules | undefined;
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/forms && pnpm test`
Expected: PASS — all 5 tests pass

**Step 6: Commit**

```bash
git add packages/forms/src/types.ts packages/forms/src/validate.ts packages/forms/src/__tests__/validate.test.ts
git commit -m "feat(forms): add ValidationRules type and \$validate() column metadata"
```

---

### Task 3: Schema introspection — `introspectTable()`

**Files:**
- Create: `packages/forms/src/introspect.ts`
- Test: `packages/forms/src/__tests__/introspect.test.ts`

**Step 1: Write the failing test**

Create `packages/forms/src/__tests__/introspect.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { introspectTable } from "../introspect";
import "../validate"; // side-effect: registers $validate on ColumnBuilder

describe("introspectTable", () => {
  it("maps text columns to text input", () => {
    const table = sqliteTable("posts", {
      title: text("title").notNull(),
    });
    const fields = introspectTable(table);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({
      name: "title",
      inputType: "text",
      label: "Title",
      required: true,
    });
  });

  it("maps integer columns to number input", () => {
    const table = sqliteTable("posts", {
      views: integer("views"),
    });
    const fields = introspectTable(table);
    expect(fields[0]).toMatchObject({
      name: "views",
      inputType: "number",
      required: false,
    });
  });

  it("maps integer mode=boolean to checkbox", () => {
    const table = sqliteTable("posts", {
      published: integer("published", { mode: "boolean" }).notNull(),
    });
    const fields = introspectTable(table);
    expect(fields[0]).toMatchObject({
      name: "published",
      inputType: "checkbox",
    });
  });

  it("maps text with enum to select", () => {
    const table = sqliteTable("posts", {
      status: text("status", { enum: ["draft", "published", "archived"] }).notNull(),
    });
    const fields = introspectTable(table);
    expect(fields[0]).toMatchObject({
      name: "status",
      inputType: "select",
      enumValues: ["draft", "published", "archived"],
    });
  });

  it("includes $validate rules in validation", () => {
    const table = sqliteTable("posts", {
      title: text("title").notNull().$validate({ minLength: 3, maxLength: 200 }),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.validation).toMatchObject({
      minLength: 3,
      maxLength: 200,
    });
  });

  it("derives maxLength from text column length", () => {
    const table = sqliteTable("posts", {
      title: text("title", { length: 255 }).notNull(),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.validation.maxLength).toBe(255);
  });

  it("generates human-readable labels from column names", () => {
    const table = sqliteTable("users", {
      firstName: text("first_name"),
      createdAt: text("created_at"),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.label).toBe("First Name");
    expect(fields[1]!.label).toBe("Created At");
  });

  it("marks columns with defaults as hasDefault", () => {
    const table = sqliteTable("posts", {
      status: text("status").default("draft"),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.hasDefault).toBe(true);
  });

  it("marks primary key columns", () => {
    const table = sqliteTable("posts", {
      id: integer("id").primaryKey(),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.isPrimaryKey).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/forms && pnpm test`
Expected: FAIL — `introspect` module doesn't exist

**Step 3: Write introspect module**

Create `packages/forms/src/introspect.ts`:

```typescript
import { getTableColumns } from "drizzle-orm";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import type { FieldDefinition, InputType, ValidationRules } from "./types";
import { getValidationRules } from "./validate";

function columnNameToLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveInputType(column: {
  dataType: string;
  columnType: string;
  enumValues?: readonly string[] | string[];
}): InputType {
  if (column.enumValues && column.enumValues.length > 0) {
    return "select";
  }
  if (column.columnType === "SQLiteBoolean") {
    return "checkbox";
  }
  switch (column.dataType) {
    case "number":
      return "number";
    case "boolean":
      return "checkbox";
    default:
      return "text";
  }
}

export function introspectTable(
  table: SQLiteTableWithColumns<Record<string, unknown>>,
): FieldDefinition[] {
  const columns = getTableColumns(table);
  const fields: FieldDefinition[] = [];

  for (const [key, column] of Object.entries(columns)) {
    const customRules = getValidationRules(column) ?? {};
    const col = column as unknown as {
      dataType: string;
      columnType: string;
      notNull: boolean;
      hasDefault: boolean;
      primary: boolean;
      enumValues?: readonly string[] | string[];
      config: { length?: number };
    };

    const validation: ValidationRules = { ...customRules };

    // Derive maxLength from text column length if not explicitly set
    if (col.config.length && validation.maxLength === undefined) {
      validation.maxLength = col.config.length;
    }

    fields.push({
      name: key,
      inputType: resolveInputType(col),
      label: columnNameToLabel(column.name),
      required: col.notNull,
      hasDefault: col.hasDefault,
      isPrimaryKey: col.primary,
      enumValues: col.enumValues ? [...col.enumValues] : undefined,
      validation,
    });
  }

  return fields;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/forms && pnpm test`
Expected: PASS — all 9 tests pass

**Step 5: Commit**

```bash
git add packages/forms/src/introspect.ts packages/forms/src/__tests__/introspect.test.ts
git commit -m "feat(forms): add introspectTable() for schema-driven field extraction"
```

---

### Task 4: react-hook-form resolver — `buildResolver()`

**Files:**
- Create: `packages/forms/src/resolver.ts`
- Test: `packages/forms/src/__tests__/resolver.test.ts`

**Step 1: Write the failing test**

Create `packages/forms/src/__tests__/resolver.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildResolver } from "../resolver";
import type { FieldDefinition } from "../types";

function makeField(overrides: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    name: "title",
    inputType: "text",
    label: "Title",
    required: false,
    hasDefault: false,
    isPrimaryKey: false,
    validation: {},
    ...overrides,
  };
}

describe("buildResolver", () => {
  it("returns no errors for valid data", async () => {
    const resolver = buildResolver([makeField({ required: true })]);
    const result = await resolver({ title: "Hello" }, undefined, {} as never);
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ title: "Hello" });
  });

  it("returns error for missing required field", async () => {
    const resolver = buildResolver([makeField({ required: true })]);
    const result = await resolver({}, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/required/i);
  });

  it("validates minLength", async () => {
    const resolver = buildResolver([
      makeField({ validation: { minLength: 3 } }),
    ]);
    const result = await resolver({ title: "ab" }, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/at least 3/);
  });

  it("validates maxLength", async () => {
    const resolver = buildResolver([
      makeField({ validation: { maxLength: 5 } }),
    ]);
    const result = await resolver({ title: "toolong" }, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/at most 5/);
  });

  it("validates min for numbers", async () => {
    const resolver = buildResolver([
      makeField({ name: "views", inputType: "number", validation: { min: 0 } }),
    ]);
    const result = await resolver({ views: -1 }, undefined, {} as never);
    expect(result.errors.views).toBeDefined();
  });

  it("validates max for numbers", async () => {
    const resolver = buildResolver([
      makeField({ name: "views", inputType: "number", validation: { max: 100 } }),
    ]);
    const result = await resolver({ views: 101 }, undefined, {} as never);
    expect(result.errors.views).toBeDefined();
  });

  it("validates pattern", async () => {
    const resolver = buildResolver([
      makeField({ validation: { pattern: /^[a-z]+$/ } }),
    ]);
    const result = await resolver({ title: "UPPER" }, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/pattern/i);
  });

  it("uses custom message when provided", async () => {
    const resolver = buildResolver([
      makeField({
        required: true,
        validation: { message: "Please enter a title" },
      }),
    ]);
    const result = await resolver({}, undefined, {} as never);
    expect(result.errors.title!.message).toBe("Please enter a title");
  });

  it("skips validation for empty optional fields", async () => {
    const resolver = buildResolver([
      makeField({ required: false, validation: { minLength: 3 } }),
    ]);
    const result = await resolver({}, undefined, {} as never);
    expect(result.errors).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/forms && pnpm test`
Expected: FAIL — `resolver` module doesn't exist

**Step 3: Write resolver module**

Create `packages/forms/src/resolver.ts`:

```typescript
import type { FieldDefinition, ValidationRules } from "./types";

type ResolverResult = {
  values: Record<string, unknown>;
  errors: Record<string, { type: string; message: string }>;
};

type Resolver = (
  values: Record<string, unknown>,
  context: unknown,
  options: never,
) => Promise<ResolverResult>;

function validateField(
  field: FieldDefinition,
  value: unknown,
): string | undefined {
  const rules = field.validation;
  const customMessage = rules.message;

  // Required check
  if (field.required && (value === undefined || value === null || value === "")) {
    return customMessage ?? `${field.label} is required`;
  }

  // Skip further validation for empty optional fields
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  // String validations
  if (typeof value === "string") {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return customMessage ?? `${field.label} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return customMessage ?? `${field.label} must be at most ${rules.maxLength} characters`;
    }
    if (rules.pattern !== undefined && !rules.pattern.test(value)) {
      return customMessage ?? `${field.label} does not match the required pattern`;
    }
  }

  // Number validations
  if (typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      return customMessage ?? `${field.label} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return customMessage ?? `${field.label} must be at most ${rules.max}`;
    }
  }

  return undefined;
}

export function buildResolver(fields: FieldDefinition[]): Resolver {
  return async (values) => {
    const errors: Record<string, { type: string; message: string }> = {};
    const validValues: Record<string, unknown> = {};

    for (const field of fields) {
      const value = values[field.name];
      const error = validateField(field, value);

      if (error) {
        errors[field.name] = { type: "validation", message: error };
      } else {
        validValues[field.name] = value;
      }
    }

    return {
      values: Object.keys(errors).length === 0 ? values : {},
      errors,
    };
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/forms && pnpm test`
Expected: PASS — all 9 tests pass

**Step 5: Commit**

```bash
git add packages/forms/src/resolver.ts packages/forms/src/__tests__/resolver.test.ts
git commit -m "feat(forms): add buildResolver() for react-hook-form validation"
```

---

### Task 5: Plugin API — `createFormPlugin()`

**Files:**
- Create: `packages/forms/src/plugin.ts`
- Test: `packages/forms/src/__tests__/plugin.test.ts`

**Step 1: Write the failing test**

Create `packages/forms/src/__tests__/plugin.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createFormPlugin } from "../plugin";

describe("createFormPlugin", () => {
  it("returns a plugin with the provided components", () => {
    const Stub = () => null;
    const plugin = createFormPlugin({
      components: {
        textInput: Stub,
        numberInput: Stub,
        select: Stub,
        checkbox: Stub,
        form: Stub,
        submitButton: Stub,
      },
    });
    expect(plugin.components.textInput).toBe(Stub);
    expect(plugin.components.form).toBe(Stub);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/forms && pnpm test`
Expected: FAIL — module doesn't exist

**Step 3: Write plugin module**

Create `packages/forms/src/plugin.ts`:

```typescript
import type { FormPlugin, FormPluginComponents } from "./types";

export function createFormPlugin(config: {
  components: FormPluginComponents;
}): FormPlugin {
  return { components: config.components };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/forms && pnpm test`
Expected: PASS

**Step 5: Update index.ts exports**

Update `packages/forms/src/index.ts`:

```typescript
export { introspectTable } from "./introspect";
export { buildResolver } from "./resolver";
export { createFormPlugin } from "./plugin";
export { getValidationRules, VALIDATE_SYMBOL } from "./validate";

// Side-effect: registers $validate on ColumnBuilder prototype
import "./validate";

export type {
  ValidationRules,
  FieldDefinition,
  FieldConfig,
  FieldComponentProps,
  FormPlugin,
  FormPluginComponents,
  FormWrapperProps,
  SubmitButtonProps,
  InputType,
} from "./types";
```

**Step 6: Verify build**

Run: `cd packages/forms && pnpm build`
Expected: Successful build

**Step 7: Commit**

```bash
git add packages/forms/src/plugin.ts packages/forms/src/__tests__/plugin.test.ts packages/forms/src/index.ts
git commit -m "feat(forms): add createFormPlugin() and wire up headless core exports"
```

---

### Task 6: AutoForm core component

**Files:**
- Create: `packages/forms/src/auto-form.tsx`
- Test: `packages/forms/src/__tests__/auto-form.test.tsx`

Note: This task needs `vitest.config.ts` to be created with jsdom environment for React testing. Create `packages/forms/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
```

**Step 1: Write the failing test**

Create `packages/forms/src/__tests__/auto-form.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createAutoForm } from "../auto-form";
import { createFormPlugin } from "../plugin";
import "../validate";
import type { FieldComponentProps, FormWrapperProps, SubmitButtonProps } from "../types";

// Minimal test plugin
function TestTextInput({ name, label, required, error, register }: FieldComponentProps) {
  const reg = register as ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>;
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} {...reg(name)} aria-required={required} />
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

function TestNumberInput({ name, label, register }: FieldComponentProps) {
  const reg = register as ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>;
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type="number" {...reg(name, { valueAsNumber: true })} />
    </div>
  );
}

function TestSelect({ name, label, enumValues, register }: FieldComponentProps) {
  const reg = register as ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>;
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} {...reg(name)}>
        {enumValues?.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}

function TestCheckbox({ name, label, register }: FieldComponentProps) {
  const reg = register as ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>;
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type="checkbox" {...reg(name)} />
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
  it("renders fields from table schema", () => {
    const table = sqliteTable("posts", {
      title: text("title").notNull(),
      views: integer("views"),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Views")).toBeInTheDocument();
  });

  it("excludes specified fields", () => {
    const table = sqliteTable("items", {
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
    const table = sqliteTable("posts2", {
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
    const table = sqliteTable("posts3", {
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
    const table = sqliteTable("posts4", {
      status: text("status", { enum: ["draft", "published"] }).notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("pre-fills data in edit mode", () => {
    const table = sqliteTable("posts5", {
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
    const table = sqliteTable("posts6", {
      title: text("title").notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/forms && pnpm test`
Expected: FAIL — module doesn't exist

**Step 3: Write AutoForm component**

Create `packages/forms/src/auto-form.tsx`:

```tsx
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { introspectTable } from "./introspect";
import { buildResolver } from "./resolver";
import type { FieldConfig, FieldDefinition, FormPlugin } from "./types";

type AutoFormProps<TTable extends SQLiteTableWithColumns<Record<string, unknown>>> = {
  table: TTable;
  mode: "create" | "edit";
  data?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  fields?: Partial<Record<string, FieldConfig>>;
  exclude?: string[];
  form?: UseFormReturn;
};

function getComponentForField(plugin: FormPlugin, field: FieldDefinition) {
  switch (field.inputType) {
    case "number":
      return plugin.components.numberInput;
    case "checkbox":
      return plugin.components.checkbox;
    case "select":
      return plugin.components.select;
    default:
      return plugin.components.textInput;
  }
}

export function createAutoForm(plugin: FormPlugin) {
  function AutoForm<TTable extends SQLiteTableWithColumns<Record<string, unknown>>>({
    table,
    mode,
    data,
    onSubmit,
    fields: fieldOverrides,
    exclude,
    form: externalForm,
  }: AutoFormProps<TTable>) {
    const allFields = useMemo(() => introspectTable(table), [table]);

    const visibleFields = useMemo(() => {
      const excludeSet = new Set(exclude ?? []);
      return allFields.filter((f) => {
        if (excludeSet.has(f.name)) return false;
        if (fieldOverrides?.[f.name]?.hidden) return false;
        return true;
      });
    }, [allFields, exclude, fieldOverrides]);

    const resolver = useMemo(() => buildResolver(visibleFields), [visibleFields]);

    const defaultValues = useMemo(() => {
      if (mode === "edit" && data) return data;
      const defaults: Record<string, unknown> = {};
      for (const field of visibleFields) {
        const override = fieldOverrides?.[field.name];
        if (override?.default !== undefined) {
          defaults[field.name] = override.default;
        }
      }
      return defaults;
    }, [mode, data, visibleFields, fieldOverrides]);

    const internalForm = useForm({
      resolver,
      defaultValues,
    });

    const form = externalForm ?? internalForm;

    const handleSubmit = form.handleSubmit(async (values) => {
      await onSubmit(values);
    });

    const FormWrapper = plugin.components.form;
    const SubmitButton = plugin.components.submitButton;

    return (
      <FormWrapper onSubmit={handleSubmit}>
        {visibleFields.map((field) => {
          const override = fieldOverrides?.[field.name];
          const Component = override?.component ?? getComponentForField(plugin, field);
          const label = override?.label ?? field.label;
          const error = form.formState.errors[field.name]?.message as
            | string
            | undefined;

          return (
            <Component
              key={field.name}
              name={field.name}
              label={label}
              placeholder={override?.placeholder}
              required={field.required}
              error={error}
              enumValues={field.enumValues}
              register={form.register}
            />
          );
        })}
        <SubmitButton isSubmitting={form.formState.isSubmitting}>
          Submit
        </SubmitButton>
      </FormWrapper>
    );
  }

  return AutoForm;
}
```

**Step 4: Add `@testing-library/user-event` to devDependencies**

Run: `cd packages/forms && pnpm add -D @testing-library/user-event`

**Step 5: Run test to verify it passes**

Run: `cd packages/forms && pnpm test`
Expected: PASS — all 7 tests pass

**Step 6: Commit**

```bash
git add packages/forms/src/auto-form.tsx packages/forms/src/__tests__/auto-form.test.tsx packages/forms/vitest.config.ts packages/forms/package.json pnpm-lock.yaml
git commit -m "feat(forms): add AutoForm component with createAutoForm() factory"
```

---

### Task 7: Joy UI plugin

**Files:**
- Create: `packages/forms/src/joy.tsx`
- Test: `packages/forms/src/__tests__/joy.test.tsx`

**Step 1: Write the failing test**

Create `packages/forms/src/__tests__/joy.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { AutoForm } from "../joy";
import "../validate";

describe("Joy UI AutoForm", () => {
  it("renders a form with Joy UI components", () => {
    const table = sqliteTable("posts7", {
      title: text("title").notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders select for enum fields", () => {
    const table = sqliteTable("posts8", {
      status: text("status", { enum: ["draft", "published"] }).notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("renders checkbox for boolean fields", () => {
    const table = sqliteTable("posts9", {
      published: integer("published", { mode: "boolean" }).notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Published")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/forms && pnpm test`
Expected: FAIL — joy module is still a stub

**Step 3: Write Joy UI plugin**

Replace `packages/forms/src/joy.tsx`:

```tsx
import React from "react";
import Input from "@mui/joy/Input";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Checkbox from "@mui/joy/Checkbox";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { createFormPlugin } from "./plugin";
import { createAutoForm } from "./auto-form";
import type { FieldComponentProps, FormWrapperProps, SubmitButtonProps } from "./types";

// Side-effect: registers $validate
import "./validate";

function JoyTextInput({ name, label, placeholder, required, error, register }: FieldComponentProps) {
  const reg = register as CallableFunction;
  return (
    <FormControl error={!!error}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <Input
        id={name}
        placeholder={placeholder}
        {...reg(name)}
        required={required}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyNumberInput({ name, label, placeholder, required, error, register }: FieldComponentProps) {
  const reg = register as CallableFunction;
  return (
    <FormControl error={!!error}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <Input
        id={name}
        type="number"
        placeholder={placeholder}
        {...reg(name, { valueAsNumber: true })}
        required={required}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoySelect({ name, label, required, error, enumValues, register }: FieldComponentProps) {
  const reg = register as CallableFunction;
  return (
    <FormControl error={!!error}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <select id={name} {...reg(name)} aria-required={required}>
        <option value="">Select...</option>
        {enumValues?.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyCheckbox({ name, label, error, register }: FieldComponentProps) {
  const reg = register as CallableFunction;
  return (
    <FormControl error={!!error}>
      <Checkbox id={name} label={label} {...reg(name)} />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyFormWrapper({ onSubmit, children }: FormWrapperProps) {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {children}
    </Box>
  );
}

function JoySubmitButton({ isSubmitting, children }: SubmitButtonProps) {
  return (
    <Button type="submit" loading={isSubmitting}>
      {children}
    </Button>
  );
}

const joyPlugin = createFormPlugin({
  components: {
    textInput: JoyTextInput,
    numberInput: JoyNumberInput,
    select: JoySelect,
    checkbox: JoyCheckbox,
    form: JoyFormWrapper,
    submitButton: JoySubmitButton,
  },
});

export const AutoForm = createAutoForm(joyPlugin);
export { joyPlugin };
```

Note: The Joy Select component requires controlled state that doesn't work easily with react-hook-form's register pattern. For v1, use a native `<select>` styled within Joy's FormControl. This can be upgraded to Joy's Select component later with a Controller wrapper.

**Step 4: Run test to verify it passes**

Run: `cd packages/forms && pnpm test`
Expected: PASS — all 3 tests pass

**Step 5: Commit**

```bash
git add packages/forms/src/joy.tsx packages/forms/src/__tests__/joy.test.tsx
git commit -m "feat(forms): add Joy UI plugin with AutoForm component"
```

---

### Task 8: Build verification and typecheck

**Files:**
- Modify: `packages/forms/tsconfig.json` (add jsx support)

**Step 1: Update tsconfig for JSX**

Update `packages/forms/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["src/__tests__"]
}
```

**Step 2: Run typecheck**

Run: `cd packages/forms && pnpm typecheck`
Expected: PASS — no type errors

**Step 3: Run build**

Run: `cd packages/forms && pnpm build`
Expected: Successful build producing `dist/index.js`, `dist/index.d.ts`, `dist/joy.js`, `dist/joy.d.ts`

**Step 4: Run all tests**

Run: `cd packages/forms && pnpm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add packages/forms/tsconfig.json
git commit -m "chore(forms): configure tsconfig for JSX and finalize build"
```

---

### Task 9: Run quality agents

**Step 1: Run api-reviewer agent**

Spawn the `api-reviewer` agent (Sonnet) to review the public API of `@cfast/forms`.
Check: `.claude/agents/api-reviewer.md` for instructions.

**Step 2: Run workers-compat agent**

Spawn the `workers-compat` agent (Haiku) to verify no Node.js APIs were used.
Check: `.claude/agents/workers-compat.md` for instructions.

**Step 3: Run package-boundary agent**

Spawn the `package-boundary` agent (Haiku) to verify dependency flow and exports.
Check: `.claude/agents/package-boundary.md` for instructions.

**Step 4: Run readme-sync agent**

Spawn the `readme-sync` agent (Sonnet) to verify the implementation matches the README.
Check: `.claude/agents/readme-sync.md` for instructions.

**Step 5: Fix any issues found by agents, commit**

```bash
git add -A
git commit -m "fix(forms): address review feedback from quality agents"
```
