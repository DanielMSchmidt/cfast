---
editUrl: false
next: false
prev: false
title: "useComponent"
---

> **useComponent**\<`K`\>(`slot`): [`UIPluginComponents`](/api/ui/src/type-aliases/uiplugincomponents/)\[`K`\]

Defined in: [packages/ui/src/plugin.tsx:77](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/plugin.tsx#L77)

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
