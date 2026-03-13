---
editUrl: false
next: false
prev: false
title: "useComponent"
---

> **useComponent**\<`K`\>(`slot`): [`UIPluginComponents`](/api/ui/type-aliases/uiplugincomponents/)\[`K`\]

Defined in: [packages/ui/src/plugin.tsx:119](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/plugin.tsx#L119)

Resolves a component for a given [UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) slot.

Looks up the slot in the current [UIPlugin](/api/ui/type-aliases/uiplugin/) (via [useUIPlugin](/api/ui/functions/useuiplugin/)).
If the plugin provides an implementation for the slot, that component is returned.
Otherwise, the headless HTML default is returned. This ensures every component
renders correctly even without a UI plugin installed.

## Type Parameters

### K

`K` *extends* keyof [`UIPluginComponents`](/api/ui/type-aliases/uiplugincomponents/)

The slot key from [UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/).

## Parameters

### slot

`K`

The component slot name to resolve (e.g., `"button"`, `"table"`, `"chip"`).

## Returns

[`UIPluginComponents`](/api/ui/type-aliases/uiplugincomponents/)\[`K`\]

The component implementation for the given slot.

## Example

```ts
function MyComponent() {
  const Button = useComponent("button");
  const Chip = useComponent("chip");

  return <Button onClick={handleClick}>Click me</Button>;
}
```
