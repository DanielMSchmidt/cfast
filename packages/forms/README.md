# @cfast/forms

**Auto-generated forms from your Drizzle schema. Customize what you need, accept defaults for the rest.**

Your Drizzle table definition already knows the field names, types, nullability, defaults, and relations. `@cfast/forms` reads that metadata and generates a complete, working form: correct input types, validation, labels, and selects. You get a form in one line. Override individual fields as your design matures. Never write a form from scratch again.

## Design Goals

- **Schema-driven.** Your Drizzle table is the source of truth. Column types map to input types. Nullability maps to required/optional. Enums map to selects.
- **Progressive customization.** Get a working form in one line. Override the label on one field. Swap in a custom component for another. Hide a third. Each change is incremental, not all-or-nothing.
- **UI library plugins.** The core is headless logic (schema introspection, field mapping, validation). Rendering is delegated to a plugin. Ships with MUI Joy UI. Add others without touching the core.
- **Create and edit.** Same component, different mode. Edit mode pre-fills data.

## API

### One-Line Form

```typescript
import { AutoForm } from "@cfast/forms/joy";
import { posts } from "./schema";

function CreatePost() {
  return <AutoForm table={posts} mode="create" onSubmit={handleSubmit} />;
}

function EditPost({ post }) {
  return <AutoForm table={posts} mode="edit" data={post} onSubmit={handleSubmit} />;
}
```

### Field Type Mapping

The form infers input types from Drizzle column types:

| Drizzle Column | Input Type |
|---|---|
| `text` / `varchar` | Text input |
| `integer` | Number input |
| `integer({ mode: "boolean" })` | Checkbox |
| `text({ enum: [...] })` | Select dropdown |

### Schema-Level Validation

Attach validation rules directly to your Drizzle columns using the `v()` helper:

```typescript
import { v } from "@cfast/forms";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
  views: v(integer("views"), { min: 0 }),
  slug: v(text("slug").notNull(), { pattern: /^[a-z0-9-]+$/ }),
  content: text("content").notNull(),
});
```

The `v()` wrapper stores validation metadata on the column builder via a Symbol. `introspectTable()` reads it back alongside schema-derived rules (NOT NULL → required, text length → maxLength).

Supported validation rules:

| Rule | Type | Description |
|---|---|---|
| `minLength` | `number` | Minimum string length |
| `maxLength` | `number` | Maximum string length |
| `min` | `number` | Minimum numeric value |
| `max` | `number` | Maximum numeric value |
| `pattern` | `RegExp` | Regex pattern for strings |
| `message` | `string` | Custom error message |

### Customizing Fields

Override individual fields while keeping defaults for the rest:

```typescript
<AutoForm
  table={posts}
  mode="create"
  fields={{
    title: { label: "Post Title", placeholder: "Enter a title..." },
    content: { component: RichTextEditor },
    authorId: { hidden: true, default: currentUser.id },
  }}
  exclude={["createdAt", "updatedAt"]}
  onSubmit={handleSubmit}
/>
```

### Per-Field Custom Validation

Add custom validation functions alongside schema-derived validation:

```typescript
<AutoForm
  table={posts}
  mode="create"
  fields={{
    title: {
      validate: (value) => {
        if (value.length < 3) return "Title must be at least 3 characters";
      },
    },
  }}
  onSubmit={handleSubmit}
/>
```

### External Form Control

AutoForm creates its own react-hook-form instance by default. For advanced use cases (multi-step wizards, external reset), pass your own:

```typescript
import { useForm } from "react-hook-form";

function MyForm() {
  const form = useForm();
  return <AutoForm table={posts} mode="create" form={form} onSubmit={handleSubmit} />;
}
```

### UI Library Plugins

The core is headless. Rendering is delegated to plugins:

```typescript
// Joy UI (ships with cfast)
import { AutoForm } from "@cfast/forms/joy";

// Future plugins:
// import { AutoForm } from "@cfast/forms/shadcn";
```

Creating a plugin:

```typescript
import { createFormPlugin, createAutoForm } from "@cfast/forms";

const myPlugin = createFormPlugin({
  components: {
    textInput: MyTextInput,
    numberInput: MyNumberInput,
    select: MySelect,
    checkbox: MyCheckbox,
    form: MyFormWrapper,
    submitButton: MySubmitButton,
  },
});

export const AutoForm = createAutoForm(myPlugin);
```

## Architecture

```
@cfast/forms (headless core)
├── v() — attach validation rules to Drizzle column builders
├── introspectTable() — read Drizzle table metadata into FieldDefinition[]
├── createResolver() — build react-hook-form resolver from field definitions
├── createFormPlugin() — register UI components for rendering
└── createAutoForm() — compose plugin + introspection + RHF into AutoForm

@cfast/forms/joy (MUI Joy UI plugin)
├── Component implementations for each field type
└── Joy-specific affordances (loading states, error display)
```

## Planned Features

The following are documented for future implementation:

- **Type-safe fields/exclude** — `fields` and `exclude` props constrained to table column keys at the type level
- **Foreign key selects** — async search select for foreign key columns
- **File upload fields** — integration with `@cfast/storage` for file upload inputs
- **Layout system** — `layout` prop for controlling field arrangement (side-by-side, full-width)
- **Date picker** — `timestamp` columns mapped to date input
- **Radio variant** — `component: "radio"` shorthand for enum fields
