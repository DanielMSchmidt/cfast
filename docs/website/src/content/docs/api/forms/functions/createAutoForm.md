---
editUrl: false
next: false
prev: false
title: "createAutoForm"
---

> **createAutoForm**(`plugin`): (`__namedParameters`) => `Element`

Defined in: [packages/forms/src/auto-form.tsx:74](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/auto-form.tsx#L74)

Create an AutoForm React component bound to a specific UI [FormPlugin](/api/forms/type-aliases/formplugin/).

The returned component introspects a Drizzle table via [introspectTable](/api/forms/functions/introspecttable/),
builds validation via [createResolver](/api/forms/functions/createresolver/), and renders fields using the
plugin's components. Supports both create and edit modes, per-field overrides
via [FieldConfig](/api/forms/type-aliases/fieldconfig/), column exclusion, and external react-hook-form instances.

## Parameters

### plugin

[`FormPlugin`](/api/forms/type-aliases/formplugin/)

A [FormPlugin](/api/forms/type-aliases/formplugin/) providing the UI components for rendering.

## Returns

A React component (`AutoForm`) that accepts AutoFormProps.

> (`__namedParameters`): `Element`

### Parameters

#### \_\_namedParameters

`AutoFormProps`

### Returns

`Element`

## Example

```tsx
import { createAutoForm, createFormPlugin } from "@cfast/forms";

const plugin = createFormPlugin({ components: joyComponents });
const AutoForm = createAutoForm(plugin);

// Create mode
<AutoForm table={posts} mode="create" onSubmit={handleSubmit} />

// Edit mode with field overrides
<AutoForm
  table={posts}
  mode="edit"
  data={existingPost}
  fields={{ title: { label: "Post Title" } }}
  exclude={["createdAt"]}
  onSubmit={handleSubmit}
/>
```
