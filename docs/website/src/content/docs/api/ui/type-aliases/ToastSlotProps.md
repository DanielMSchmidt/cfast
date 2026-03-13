---
editUrl: false
next: false
prev: false
title: "ToastSlotProps"
---

> **ToastSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:307](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L307)

Props for the toast provider plugin slot.

Wraps the application to provide toast notification support. Individual
toasts are managed internally via the [ToastApi](/api/ui/type-aliases/toastapi/) returned by `useToast()`.

## See

 - [ToastApi](/api/ui/type-aliases/toastapi/) for the imperative notification API.
 - [ToastOptions](/api/ui/type-aliases/toastoptions/) for individual toast configuration.

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:309](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L309)

Provider-level children; individual toasts are managed internally.
