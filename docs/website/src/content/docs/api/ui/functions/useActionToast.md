---
editUrl: false
next: false
prev: false
title: "useActionToast"
---

> **useActionToast**(`descriptor`, `config`): `void`

Defined in: [packages/ui/src/hooks/use-action-toast.ts:42](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/hooks/use-action-toast.ts#L42)

Automatically shows toast notifications when `@cfast/actions` results arrive.

Watches all configured actions via their [ClientDescriptor](/api/actions/type-aliases/clientdescriptor/) and triggers
success or error toasts when their result data changes. Internally uses
[useToast](/api/ui/functions/usetoast/) and `useActions` from `@cfast/actions/client`.

Must be used within both a `ToastProvider` and an actions context
(i.e., inside `app.Provider`).

## Parameters

### descriptor

[`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Client-side action descriptor from `@cfast/actions`, typically
  `composed.client` from a `createActions()` call.

### config

`ActionToastConfig`

Map of action names to toast messages. Only actions listed here
  are watched; others are ignored.

## Returns

`void`

void

## Example

```ts
// In a route component:
useActionToast(composed.client, {
  deletePost: { success: "Post deleted", error: "Failed to delete" },
  publishPost: { success: "Post published" },
});
```
