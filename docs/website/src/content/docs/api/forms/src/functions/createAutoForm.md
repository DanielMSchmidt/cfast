---
editUrl: false
next: false
prev: false
title: "createAutoForm"
---

> **createAutoForm**(`plugin`): (`__namedParameters`) => `Element`

Defined in: [packages/forms/src/auto-form.tsx:48](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/forms/src/auto-form.tsx#L48)

Create an auto-generated form component from a Drizzle table schema.

## Parameters

### plugin

[`FormPlugin`](/api/forms/src/type-aliases/formplugin/)

A [FormPlugin](/api/forms/src/type-aliases/formplugin/) providing the UI components for rendering.

## Returns

A React component that renders a form based on a Drizzle table.

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

<AutoForm table={posts} mode="create" onSubmit={handleSubmit} />
```
