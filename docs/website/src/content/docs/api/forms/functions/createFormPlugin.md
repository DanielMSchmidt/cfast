---
editUrl: false
next: false
prev: false
title: "createFormPlugin"
---

> **createFormPlugin**(`config`): [`FormPlugin`](/api/forms/type-aliases/formplugin/)

Defined in: [packages/forms/src/plugin.ts:32](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/plugin.ts#L32)

Create a form plugin that provides UI components for rendering auto-generated forms.

The plugin encapsulates all UI-specific rendering: one component per input type
(`textInput`, `numberInput`, `select`, `checkbox`), a form wrapper, and a submit button.
The headless core ([introspectTable](/api/forms/functions/introspecttable/), [createResolver](/api/forms/functions/createresolver/)) remains UI-agnostic;
the plugin bridges it to a specific component library.

## Parameters

### config

Configuration object containing the [FormPluginComponents](/api/forms/type-aliases/formplugincomponents/) implementations.

#### components

[`FormPluginComponents`](/api/forms/type-aliases/formplugincomponents/)

## Returns

[`FormPlugin`](/api/forms/type-aliases/formplugin/)

A [FormPlugin](/api/forms/type-aliases/formplugin/) to pass to [createAutoForm](/api/forms/functions/createautoform/).

## Example

```ts
import { createFormPlugin, createAutoForm } from "@cfast/forms";

const plugin = createFormPlugin({
  components: {
    textInput: MyTextInput,
    numberInput: MyNumberInput,
    select: MySelect,
    checkbox: MyCheckbox,
    form: MyFormWrapper,
    submitButton: MySubmitButton,
  },
});

export const AutoForm = createAutoForm(plugin);
```
