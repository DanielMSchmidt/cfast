---
editUrl: false
next: false
prev: false
title: "useComponent"
---

> **useComponent**\<`K`\>(`slot`): [`UIPluginComponents`](/api/ui/src/type-aliases/uiplugincomponents/)\[`K`\]

Defined in: [packages/ui/src/plugin.tsx:77](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/plugin.tsx#L77)

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
