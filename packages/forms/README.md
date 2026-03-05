# @cfast/forms

**Auto-generated forms from your Drizzle schema. Customize what you need, accept defaults for the rest.**

Your Drizzle table definition already knows the field names, types, nullability, defaults, and relations. `@cfast/forms` reads that metadata and generates a complete, working form: correct input types, validation, labels, and foreign key selects. You get a form in one line. Override individual fields as your design matures. Never write a form from scratch again.

## Design Goals

- **Schema-driven.** Your Drizzle table is the source of truth. Column types map to input types. Nullability maps to required/optional. Enums map to selects. Foreign keys map to async search selects.
- **Progressive customization.** Get a working form in one line. Override the label on one field. Swap in a custom component for another. Hide a third. Each change is incremental, not all-or-nothing.
- **UI library plugins.** The core is headless logic (schema introspection, field mapping, validation). Rendering is delegated to a plugin. Ships with MUI Joy UI. Add others without touching the core.
- **Create and edit.** Same component, different mode. Edit mode pre-fills data and only submits changed fields.

## Planned API

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
| `boolean` | Checkbox / switch |
| `timestamp` | Date picker |
| `enum` | Select dropdown |
| Foreign key | Async select with search |

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
    category: {
      component: "radio",
      options: ["tech", "design", "business"],
    },
  }}
  exclude={["createdAt", "updatedAt"]}
  onSubmit={handleSubmit}
/>
```

### Field Layout

Control how fields are arranged without replacing the form:

```typescript
<AutoForm
  table={users}
  mode="edit"
  data={user}
  layout={[
    ["firstName", "lastName"],   // Side by side
    ["email"],                    // Full width
    ["bio"],                      // Full width
    ["role", "status"],          // Side by side
  ]}
  onSubmit={handleSubmit}
/>
```

### Validation

Validation rules are derived from the schema:

- `NOT NULL` columns are required
- `varchar(255)` gets a maxLength of 255
- `integer` gets type="number"
- Custom validation can be added per field:

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
import { createFormPlugin } from "@cfast/forms";

export const myPlugin = createFormPlugin({
  components: {
    textInput: MyTextInput,
    numberInput: MyNumberInput,
    select: MySelect,
    checkbox: MyCheckbox,
    dateInput: MyDatePicker,
    asyncSelect: MyAsyncSelect,
    form: MyFormWrapper,
    submitButton: MySubmitButton,
  },
});
```

## Architecture

```
@cfast/forms (headless core)
├── Schema introspection (reads Drizzle table metadata)
├── Field type mapping (column type → input type)
├── Validation derivation (NOT NULL → required, varchar(n) → maxLength)
├── Foreign key resolution (detects relations for async selects)
└── Plugin API (createFormPlugin)

@cfast/forms/joy (MUI Joy UI plugin)
├── Component implementations for each field type
├── Theme integration
└── Joy-specific affordances (loading states, error display)
```
