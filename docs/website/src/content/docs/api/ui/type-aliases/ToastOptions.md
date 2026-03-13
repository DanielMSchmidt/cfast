---
editUrl: false
next: false
prev: false
title: "ToastOptions"
---

> **ToastOptions** = `object`

Defined in: [packages/ui/src/types.ts:868](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L868)

Options for displaying a toast notification.

Passed to [ToastApi.show](/api/ui/type-aliases/toastapi/#show) for full control over the notification. The
convenience methods (`success`, `error`, `info`, `warning`) set the `type`
automatically.

## See

 - [ToastApi](/api/ui/type-aliases/toastapi/) for the imperative notification API.
 - [ToastType](/api/ui/type-aliases/toasttype/) for the available severity levels.

## Properties

### description?

> `optional` **description**: `string`

Defined in: [packages/ui/src/types.ts:876](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L876)

Optional secondary description text.

***

### duration?

> `optional` **duration**: `number`

Defined in: [packages/ui/src/types.ts:874](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L874)

Auto-dismiss duration in milliseconds.

***

### message

> **message**: `string`

Defined in: [packages/ui/src/types.ts:870](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L870)

Primary message text.

***

### type?

> `optional` **type**: [`ToastType`](/api/ui/type-aliases/toasttype/)

Defined in: [packages/ui/src/types.ts:872](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L872)

Notification type determining the visual style.
