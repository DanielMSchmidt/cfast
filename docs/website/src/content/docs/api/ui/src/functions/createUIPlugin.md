---
editUrl: false
next: false
prev: false
title: "createUIPlugin"
---

> **createUIPlugin**(`config`): [`UIPlugin`](/api/ui/src/type-aliases/uiplugin/)

Defined in: [packages/ui/src/plugin.tsx:25](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/plugin.tsx#L25)

Creates a UI plugin that maps component slots to styled implementations.
Slots not provided fall back to unstyled HTML defaults.

## Parameters

### config

Plugin configuration with component implementations

#### components

`Partial`\<[`UIPluginComponents`](/api/ui/src/type-aliases/uiplugincomponents/)\>

## Returns

[`UIPlugin`](/api/ui/src/type-aliases/uiplugin/)

A UIPlugin instance to pass to `UIPluginProvider`

## Example

```ts
const joyPlugin = createUIPlugin({
  components: {
    button: JoyButton,
    table: JoyTable,
    chip: JoyChip,
  },
});
```
