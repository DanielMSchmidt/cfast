---
editUrl: false
next: false
prev: false
title: "createUIPlugin"
---

> **createUIPlugin**(`config`): [`UIPlugin`](/api/ui/type-aliases/uiplugin/)

Defined in: [packages/ui/src/plugin.tsx:32](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/plugin.tsx#L32)

Creates a [UIPlugin](/api/ui/type-aliases/uiplugin/) that maps component slots to styled implementations.

Slots not provided in the `components` map fall back to the unstyled HTML
defaults from the headless layer. This allows incremental adoption -- implement
only the slots your design system covers.

## Parameters

### config

Plugin configuration object.

#### components

`Partial`\<[`UIPluginComponents`](/api/ui/type-aliases/uiplugincomponents/)\>

Partial map of slot names to styled component implementations.
  See [UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for available slots.

## Returns

[`UIPlugin`](/api/ui/type-aliases/uiplugin/)

A [UIPlugin](/api/ui/type-aliases/uiplugin/) instance to pass to [UIPluginProvider](/api/ui/functions/uipluginprovider/).

## Example

```ts
import { createUIPlugin } from "@cfast/ui";

const joyPlugin = createUIPlugin({
  components: {
    button: JoyButton,
    table: JoyTable,
    chip: JoyChip,
  },
});
```
