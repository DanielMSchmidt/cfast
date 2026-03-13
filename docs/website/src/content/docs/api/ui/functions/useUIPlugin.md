---
editUrl: false
next: false
prev: false
title: "useUIPlugin"
---

> **useUIPlugin**(): [`UIPlugin`](/api/ui/type-aliases/uiplugin/) \| `null`

Defined in: [packages/ui/src/plugin.tsx:93](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/plugin.tsx#L93)

Returns the current [UIPlugin](/api/ui/type-aliases/uiplugin/) from React context.

Returns `null` if no [UIPluginProvider](/api/ui/functions/uipluginprovider/) is present in the component tree.
Most consumers should use [useComponent](/api/ui/functions/usecomponent/) instead, which handles the
fallback to headless defaults automatically.

## Returns

[`UIPlugin`](/api/ui/type-aliases/uiplugin/) \| `null`

The active [UIPlugin](/api/ui/type-aliases/uiplugin/), or `null` if no provider is mounted.

## Example

```ts
const plugin = useUIPlugin();
if (plugin?.components.button) {
  // A custom button implementation is available
}
```
