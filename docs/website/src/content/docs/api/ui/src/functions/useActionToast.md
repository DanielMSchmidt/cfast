---
editUrl: false
next: false
prev: false
title: "useActionToast"
---

> **useActionToast**(`descriptor`, `config`): `void`

Defined in: [packages/ui/src/hooks/use-action-toast.ts:30](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/hooks/use-action-toast.ts#L30)

Automatically shows toast notifications when action results arrive.

Watches all configured actions and triggers success or error toasts when
their data changes. Must be used within both a `ToastProvider` and an
actions context.

## Parameters

### descriptor

[`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Client-side action descriptor from `@cfast/actions`

### config

`ActionToastConfig`

Map of action names to toast messages

## Returns

`void`

## Example

```ts
useActionToast(composed.client, {
  deletePost: { success: "Post deleted", error: "Failed to delete" },
  publishPost: { success: "Post published" },
});
```
