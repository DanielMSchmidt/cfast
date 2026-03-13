---
editUrl: false
next: false
prev: false
title: "ToastSlotProps"
---

> **ToastSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:307](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L307)

Props for the toast provider plugin slot.

Wraps the application to provide toast notification support. Individual
toasts are managed internally via the [ToastApi](/api/ui/type-aliases/toastapi/) returned by `useToast()`.

## See

 - [ToastApi](/api/ui/type-aliases/toastapi/) for the imperative notification API.
 - [ToastOptions](/api/ui/type-aliases/toastoptions/) for individual toast configuration.

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:309](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L309)

Provider-level children; individual toasts are managed internally.
