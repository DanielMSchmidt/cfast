---
editUrl: false
next: false
prev: false
title: "UIPluginProvider"
---

> **UIPluginProvider**(`__namedParameters`): `Element`

Defined in: [packages/ui/src/plugin.tsx:45](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/plugin.tsx#L45)

React context provider that makes a UI plugin available to all `@cfast/ui` components.
Place this near the root of your component tree.

## Parameters

### \_\_namedParameters

#### children

`ReactNode`

#### plugin

[`UIPlugin`](/api/ui/src/type-aliases/uiplugin/)

## Returns

`Element`

## Example

```tsx
<UIPluginProvider plugin={joyPlugin}>
  <App />
</UIPluginProvider>
```
