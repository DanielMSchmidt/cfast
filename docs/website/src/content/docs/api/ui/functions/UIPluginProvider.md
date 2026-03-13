---
editUrl: false
next: false
prev: false
title: "UIPluginProvider"
---

> **UIPluginProvider**(`props`): `Element`

Defined in: [packages/ui/src/plugin.tsx:66](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/plugin.tsx#L66)

React context provider that makes a [UIPlugin](/api/ui/type-aliases/uiplugin/) available to all `@cfast/ui` components.

Place this near the root of your component tree (typically in the root layout).
All headless components use [useComponent](/api/ui/functions/usecomponent/) internally to resolve their
styled implementations from this context.

## Parameters

### props

Component props.

#### children

`ReactNode`

Child elements that can access the plugin via
  [useUIPlugin](/api/ui/functions/useuiplugin/) or [useComponent](/api/ui/functions/usecomponent/).

#### plugin

[`UIPlugin`](/api/ui/type-aliases/uiplugin/)

The UI plugin created by [createUIPlugin](/api/ui/functions/createuiplugin/).

## Returns

`Element`

A React element wrapping children with the UI plugin context.

## Example

```tsx
import { UIPluginProvider, createUIPlugin } from "@cfast/ui";

const plugin = createUIPlugin({ components: { button: MyButton } });

function Root() {
  return (
    <UIPluginProvider plugin={plugin}>
      <App />
    </UIPluginProvider>
  );
}
```
