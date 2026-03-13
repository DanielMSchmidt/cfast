---
editUrl: false
next: false
prev: false
title: "useComponent"
---

> **useComponent**\<`K`\>(`slot`): [`UIPluginComponents`](/api/ui/src/type-aliases/uiplugincomponents/)\[`K`\]

Defined in: [packages/ui/src/plugin.tsx:77](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/plugin.tsx#L77)

Resolves a component for a given plugin slot.
Returns the plugin's implementation if available, otherwise the headless default.

## Type Parameters

### K

`K` *extends* keyof [`UIPluginComponents`](/api/ui/src/type-aliases/uiplugincomponents/)

## Parameters

### slot

`K`

The component slot name to resolve

## Returns

[`UIPluginComponents`](/api/ui/src/type-aliases/uiplugincomponents/)\[`K`\]

The component for the given slot

## Example

```ts
const Button = useComponent("button");
const Table = useComponent("table");
```
