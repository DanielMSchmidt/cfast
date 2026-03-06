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
| `@cfast/storage` filetype | File upload (see [File Upload Fields](#file-upload-fields)) |

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

### Type Safety

Both `fields` and `exclude` are type-checked against the table's columns. Misspelled or non-existent column names are compile-time errors:

```typescript
<AutoForm
  table={posts}
  fields={{
    titel: { label: "Title" },  // Type error: 'titel' does not exist in posts columns
  }}
  exclude={["cretedAt"]}        // Type error: 'cretedAt' does not exist in posts columns
/>
```

The `fields` prop is typed as `Partial<Record<keyof typeof posts._.columns, FieldConfig>>`, so autocomplete shows all valid column names. The `exclude` prop is typed as `Array<keyof typeof posts._.columns>`.

When using `exclude`, the excluded columns are removed from the `fields` type as well — you can't customize a field you've excluded:

```typescript
<AutoForm
  table={posts}
  exclude={["createdAt"]}
  fields={{
    createdAt: { label: "Created" },  // Type error: 'createdAt' is excluded
  }}
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

### File Upload Fields

When a field references a `@cfast/storage` filetype, AutoForm renders a file upload input with client-side validation, progress tracking, and preview — powered by `useUpload` from `@cfast/storage/client`.

```typescript
import { storage } from "./storage";

<AutoForm
  table={posts}
  mode="create"
  fields={{
    coverImage: {
      upload: storage.postImages,
      // Inherits accept and maxSize from the storage schema
      // Shows drag-and-drop zone, progress bar, and preview
    },
  }}
  onSubmit={handleSubmit}
/>
```

The upload field:
- Validates file type and size on the client before uploading (from the storage schema's `accept` and `maxSize`)
- Shows upload progress via `useUpload`
- Stores the resulting storage key in the form value
- In edit mode, displays the existing file with an option to replace

For multiple files:

```typescript
fields={{
  attachments: {
    upload: storage.documents,
    multiple: true,
    maxFiles: 5,
  },
}}
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
├── File upload integration (delegates to @cfast/storage/client)
├── Type-safe fields/exclude (compile-time column name checking)
└── Plugin API (createFormPlugin)

@cfast/forms/joy (MUI Joy UI plugin)
├── Component implementations for each field type
├── Theme integration
└── Joy-specific affordances (loading states, error display)
```
