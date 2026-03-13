---
editUrl: false
next: false
prev: false
title: "createFormPlugin"
---

> **createFormPlugin**(`config`): [`FormPlugin`](/api/forms/src/type-aliases/formplugin/)

Defined in: [packages/forms/src/plugin.ts:18](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/forms/src/plugin.ts#L18)

Create a form plugin that provides UI components for auto-generated forms.

## Parameters

### config

Configuration object containing the UI component implementations.

#### components

[`FormPluginComponents`](/api/forms/src/type-aliases/formplugincomponents/)

## Returns

[`FormPlugin`](/api/forms/src/type-aliases/formplugin/)

A [FormPlugin](/api/forms/src/type-aliases/formplugin/) to pass to [createAutoForm](/api/forms/src/functions/createautoform/).

## Example

```ts
import { createFormPlugin } from "@cfast/forms";

const plugin = createFormPlugin({
  components: { textInput, numberInput, select, checkbox, form, submitButton },
});
```
