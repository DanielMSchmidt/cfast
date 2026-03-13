---
editUrl: false
next: false
prev: false
title: "ConfirmProvider"
---

> **ConfirmProvider**(`__namedParameters`): `Element`

Defined in: [packages/ui/src/components/confirm-provider.tsx:32](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/components/confirm-provider.tsx#L32)

Provides the [useConfirm](/api/ui/functions/useconfirm/) context and renders the confirmation dialog.

Wrap your application (or a subtree) with `ConfirmProvider` to enable the
imperative `useConfirm()` hook. The dialog is rendered using the UI plugin's
`confirmDialog` slot, so it matches your chosen component library.

## Parameters

### \_\_namedParameters

#### children

`ReactNode`

## Returns

`Element`

## Example

```tsx
// In your root layout:
<ConfirmProvider>
  <App />
</ConfirmProvider>

// In any descendant component:
const confirm = useConfirm();
const ok = await confirm({ title: "Delete?", variant: "danger" });
```
