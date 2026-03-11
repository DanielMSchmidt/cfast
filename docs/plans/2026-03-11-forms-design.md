# @cfast/forms — Core Design

## Scope (v1)

- Schema introspection + field type mapping
- Validation derivation from schema (NOT NULL -> required, varchar(n) -> maxLength) + custom `$validate()` metadata
- react-hook-form integration (internal by default, optional external instance)
- `createFormPlugin` API
- Joy UI plugin: text input, number input, checkbox, select (enum), form wrapper, submit button
- Create + edit modes
- Type-safe `fields` and `exclude` props

### Not in scope (later)

- File uploads (`@cfast/storage` integration)
- Async foreign key selects
- Layout system
- Radio variant

## Entrypoints

- `@cfast/forms` — headless core: schema introspection, `$validate()`, `createFormPlugin`, types
- `@cfast/forms/joy` — Joy UI plugin + `AutoForm` component

## Custom Validation Metadata

Uses Drizzle's custom metadata pattern to attach validation rules at column definition time:

```typescript
import { text, integer } from "drizzle-orm/sqlite-core";

const posts = sqliteTable("posts", {
  title: text("title").notNull().$validate({ minLength: 3, maxLength: 200 }),
  views: integer("views").$validate({ min: 0 }),
  slug: text("slug").notNull().$validate({ pattern: /^[a-z0-9-]+$/ }),
});
```

### ValidationRules type

```typescript
type ValidationRules = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
};
```

## AutoForm Component

```typescript
<AutoForm
  table={posts}
  mode="create"
  onSubmit={handleSubmit}
  fields={{
    title: { label: "Post Title", placeholder: "Enter a title..." },
    authorId: { hidden: true, default: currentUser.id },
  }}
  exclude={["createdAt", "updatedAt"]}
  form={optionalExternalUseFormInstance}
/>
```

- `fields` typed as `Partial<Record<ColumnNames, FieldConfig>>` — compile-time column name checking
- `exclude` typed as `Array<ColumnNames>` — excluded columns removed from `fields` type
- `form` optional — if omitted, AutoForm calls `useForm()` internally
- `mode` — "create" renders empty form, "edit" pre-fills from `data` prop and only submits changed fields

## Plugin API

```typescript
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
```

Each component receives standardized props from the core: field name, label, error, RHF `register` function, options (for selects), etc.

## Data Flow

```
Drizzle table
  -> introspectTable() extracts columns, types, nullability, $validate metadata
  -> mapFields() converts to FieldDefinition[] (input type, validation rules, label)
  -> user overrides via fields/exclude props merged
  -> react-hook-form resolver built from merged validation rules
  -> plugin components render each field
```

## Dependencies

- **Peer:** `react >=19`, `react-dom >=19`, `drizzle-orm >=0.35`, `react-hook-form >=7`, `@mui/joy >=5.0.0-beta.0` (optional)
- **Dev:** `tsup`, `typescript`, `vitest`
